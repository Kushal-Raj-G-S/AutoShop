import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/orders_api.dart';
import '../../core/socket/socket_service.dart';

class IncomingOrdersScreen extends StatefulWidget {
  const IncomingOrdersScreen({super.key});

  @override
  State<IncomingOrdersScreen> createState() => _IncomingOrdersScreenState();
}

class _IncomingOrdersScreenState extends State<IncomingOrdersScreen> {
  final OrdersApi _ordersApi = OrdersApi();
  final SocketService _socketService = SocketService();
  
  List<Map<String, dynamic>> _orders = [];
  bool _isLoading = true;
  String? _acceptingOrderId;

  @override
  void initState() {
    super.initState();
    _loadOrders();
    _setupSocketListeners();
  }

  void _setupSocketListeners() {
    _socketService.onNewOrder = (data) {
      setState(() {
        _orders.insert(0, data);
      });
    };
    
    _socketService.onOrderAcceptSuccess = (data) {
      final orderId = data['orderId'];
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Order #$orderId accepted!'),
            backgroundColor: AppTheme.successColor,
          ),
        );
        _loadOrders(); // Refresh list
      }
      setState(() => _acceptingOrderId = null);
    };
    
    _socketService.onOrderAcceptFailed = (data) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ ${data['reason'] ?? 'Order already taken'}'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
        _loadOrders(); // Refresh list
      }
      setState(() => _acceptingOrderId = null);
    };
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    
    final result = await _ordersApi.getOrders(status: 'pending');
    
    setState(() {
      if (result['success'] == true && result['data'] != null) {
        if (result['data'] is List) {
          _orders = List<Map<String, dynamic>>.from(result['data']);
        } else {
          // Fallback if API normalization failed or structure is different
           debugPrint('❌ IncomingOrders: Expected List but got ${result['data'].runtimeType}');
        }
      }
      _isLoading = false;
    });
  }

  void _acceptOrder(String orderId) {
    setState(() => _acceptingOrderId = orderId);
    _socketService.acceptOrder(orderId);
  }

  void _rejectOrder(String orderId) {
    _socketService.rejectOrder(orderId, reason: 'Vendor declined');
    setState(() {
      _orders.removeWhere((o) => o['id'].toString() == orderId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Incoming Orders'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            onPressed: _loadOrders,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _orders.isEmpty
              ? _buildEmptyState(isDark)
              : RefreshIndicator(
                  onRefresh: _loadOrders,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _orders.length,
                    itemBuilder: (context, index) {
                      return _buildOrderCard(_orders[index], isDark);
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.accentColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.inbox,
              size: 64,
              color: AppTheme.accentColor,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'No Incoming Orders',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'New orders will appear here',
            style: TextStyle(
              color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: _loadOrders,
            icon: const Icon(Icons.refresh),
            label: const Text('Refresh'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.accentColor,
              side: BorderSide(color: AppTheme.accentColor),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order, bool isDark) {
    final orderId = order['id']?.toString() ?? '';
    final totalAmount = (order['totalAmount'] ?? 0).toDouble();
    final items = order['items'] as List? ?? [];
    final address = order['shippingAddress'];
    final isAccepting = _acceptingOrderId == orderId;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppTheme.darkBorder : AppTheme.borderColor,
        ),
        boxShadow: isDark ? null : [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.accentColor.withValues(alpha: 0.1),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.fiber_new, color: AppTheme.accentColor),
                    const SizedBox(width: 8),
                    Text(
                      'Order #$orderId',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.accentColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '₹${totalAmount.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Items
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${items.length} item(s)',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                ...items.take(3).map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(
                    '• ${item['title'] ?? item['name'] ?? 'Item'} x${item['quantity'] ?? 1}',
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
                    ),
                  ),
                )),
                if (items.length > 3)
                  Text(
                    '+${items.length - 3} more items',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.accentColor,
                    ),
                  ),
              ],
            ),
          ),
          
          // Address
          if (address != null)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkBackground : AppTheme.backgroundColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.location_on,
                    size: 18,
                    color: AppTheme.accentColor,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      address['addressLine1'] ?? address['address'] ?? 'Delivery address',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          
          const SizedBox(height: 16),
          
          // Action Buttons
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: isAccepting ? null : () => _rejectOrder(orderId),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.errorColor,
                      side: BorderSide(color: AppTheme.errorColor),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('Reject'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: isAccepting ? null : () => _acceptOrder(orderId),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.successColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: isAccepting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Accept Order'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
