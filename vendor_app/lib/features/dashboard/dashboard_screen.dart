import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/orders_api.dart';
import '../../core/api/vendor_api.dart';
import '../../core/api/api_service.dart';
import '../../core/socket/socket_service.dart';
import '../orders/incoming_orders_screen.dart';
import '../orders/order_history_screen.dart';
import '../profile/vendor_profile_screen.dart';
import '../auth/phone_input_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final OrdersApi _ordersApi = OrdersApi();
  final VendorApi _vendorApi = VendorApi();
  final SocketService _socketService = SocketService();

  int _currentIndex = 0;
  bool _isOnline = true;
  bool _isLoading = true;

  Map<String, dynamic>? _vendorData;
  Map<String, dynamic> _stats = {
    'todayOrders': 0,
    'pendingOrders': 0,
    'completedOrders': 0,
    'todayEarnings': 0.0,
  };

  @override
  void initState() {
    super.initState();
    _loadData();
    _connectSocket();
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    debugPrint('🔄 Dashboard: Loading data...');

    try {
      // Load vendor profile
      debugPrint('🔄 Dashboard: Fetching profile...');
      final vendorResult = await _vendorApi.getProfile();
      debugPrint('📦 Dashboard: Profile result: $vendorResult');

      if (vendorResult['success'] == true) {
        // Helper to find vendor object
        Map<String, dynamic>? findVendorData(dynamic data) {
          if (data is Map<String, dynamic>) {
            if (data['storeName'] != null) {
              return data;
            }
            for (var key in data.keys) {
              if (data[key] is Map) {
                if (key == 'vendor' ||
                    key == 'data' ||
                    key == 'message' ||
                    key == 'user') {
                  final found = findVendorData(data[key]);
                  if (found != null) return found;
                }
              }
            }
          }
          return null;
        }

        final data = findVendorData(vendorResult);
        if (data != null) {
          _vendorData = data;
        }
      }

      // Load stats
      debugPrint('🔄 Dashboard: Fetching stats...');
      final statsResult = await _ordersApi.getDashboardStats();
      debugPrint('📦 Dashboard: Stats result: $statsResult');

      if (statsResult['success'] == true) {
        _stats = statsResult['data'];
      }
    } catch (e) {
      debugPrint('❌ Dashboard: Error loading data: $e');
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _connectSocket() async {
    _socketService.onNewOrder = (data) {
      // Show snackbar for new order
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('🔔 New order available!'),
            backgroundColor: AppTheme.successColor,
            action: SnackBarAction(
              label: 'View',
              textColor: Colors.white,
              onPressed: () {
                setState(() => _currentIndex = 1); // Go to orders tab
              },
            ),
          ),
        );
      }
    };

    _socketService.onConnected = () {
      if (mounted) {
        setState(() {});
      }
    };

    await _socketService.connect();
  }

  Future<void> _logout() async {
    _socketService.disconnect();
    await ApiService().logout();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (c) => const PhoneInputScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildDashboardTab(),
          const IncomingOrdersScreen(),
          const OrderHistoryScreen(),
          const VendorProfileScreen(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppTheme.accentColor,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long),
            label: 'Orders',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.history), label: 'History'),
          BottomNavigationBarItem(icon: Icon(Icons.store), label: 'Profile'),
        ],
      ),
    );
  }

  Widget _buildDashboardTab() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(_vendorData?['storeName'] ?? 'Dashboard'),
        actions: [
          // Online/Offline Toggle
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: Row(
              children: [
                Text(
                  _isOnline ? 'Online' : 'Offline',
                  style: TextStyle(
                    color: _isOnline ? AppTheme.successColor : Colors.grey,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 8),
                Switch(
                  value: _isOnline,
                  onChanged: (v) => setState(() => _isOnline = v),
                  activeTrackColor: AppTheme.successColor,
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
            onPressed: () {
              // Show confirmation dialog
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Are you sure you want to logout?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _logout();
                      },
                      child: const Text(
                        'Logout',
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppTheme.accentColor,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Connection Status
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: _socketService.isConnected
                            ? AppTheme.successColor.withValues(alpha: 0.1)
                            : AppTheme.errorColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.circle,
                            size: 10,
                            color: _socketService.isConnected
                                ? AppTheme.successColor
                                : AppTheme.errorColor,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _socketService.isConnected
                                ? 'Connected - Ready for orders'
                                : 'Disconnected',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: _socketService.isConnected
                                  ? AppTheme.successColor
                                  : AppTheme.errorColor,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Stats Grid
                    Text(
                      "Today's Overview",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? AppTheme.darkTextPrimary
                            : AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            icon: Icons.shopping_cart,
                            label: 'Today Orders',
                            value: '${_stats['todayOrders']}',
                            color: AppTheme.flipkartBlue,
                            isDark: isDark,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildStatCard(
                            icon: Icons.pending_actions,
                            label: 'Pending',
                            value: '${_stats['pendingOrders']}',
                            color: AppTheme.warningColor,
                            isDark: isDark,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            icon: Icons.check_circle,
                            label: 'Completed',
                            value: '${_stats['completedOrders']}',
                            color: AppTheme.successColor,
                            isDark: isDark,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildStatCard(
                            icon: Icons.currency_rupee,
                            label: 'Earnings',
                            value:
                                '₹${(_stats['todayEarnings'] as num).toStringAsFixed(0)}',
                            color: AppTheme.accentColor,
                            isDark: isDark,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 32),

                    // Quick Actions removed as per request
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppTheme.darkBorder : AppTheme.borderColor,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 16),
          Text(
            value,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isDark
                  ? AppTheme.darkTextSecondary
                  : AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
