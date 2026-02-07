import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/vendor_api.dart';
import '../../core/api/api_service.dart';
import '../../core/providers/theme_provider.dart';
import 'package:provider/provider.dart';

class VendorProfileScreen extends StatefulWidget {
  const VendorProfileScreen({super.key});

  @override
  State<VendorProfileScreen> createState() => _VendorProfileScreenState();
}

class _VendorProfileScreenState extends State<VendorProfileScreen> {
  final VendorApi _vendorApi = VendorApi();

  Map<String, dynamic>? _vendorData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);

    // Try cached data first
    _vendorData = await ApiService().getVendorData();

    // Then fetch fresh data
    // Then fetch fresh data
    final result = await _vendorApi.getProfile();

    setState(() {
      if (result['success'] == true) {
        // Helper to find vendor object (Map containing storeName)
        Map<String, dynamic>? findVendorData(dynamic data) {
          if (data is Map<String, dynamic>) {
            if (data['storeName'] != null) {
              return data;
            }

            for (var key in data.keys) {
              if (data[key] is Map) {
                // Key priorities
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

        final data = findVendorData(result);
        if (data != null) {
          _vendorData = data;
        }
      }
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeProvider = context.watch<ThemeProvider>();

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Store Profile'),
        automaticallyImplyLeading: false,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadProfile,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // Store Header
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: isDark ? AppTheme.darkSurface : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark
                              ? AppTheme.darkBorder
                              : AppTheme.borderColor,
                        ),
                      ),
                      child: Column(
                        children: [
                          // Store Icon
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: AppTheme.accentColor.withValues(
                                alpha: 0.1,
                              ),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.storefront,
                              size: 48,
                              color: AppTheme.accentColor,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _vendorData?['storeName'] ?? 'Your Store',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: isDark
                                  ? AppTheme.darkTextPrimary
                                  : AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _vendorData?['ownerName'] ?? '',
                            style: TextStyle(
                              color: isDark
                                  ? AppTheme.darkTextSecondary
                                  : AppTheme.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 16),
                          // Status Badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.successColor.withValues(
                                alpha: 0.1,
                              ),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.verified,
                                  size: 16,
                                  color: AppTheme.successColor,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'VERIFIED VENDOR',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.successColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Store Details
                    _buildSection(
                      title: 'Store Details',
                      isDark: isDark,
                      children: [
                        _buildInfoRow(
                          icon: Icons.location_on,
                          label: 'Address',
                          value: _vendorData?['storeAddress'] ?? 'N/A',
                          isDark: isDark,
                        ),
                        _buildInfoRow(
                          icon: Icons.pin_drop,
                          label: 'Pincode',
                          value: _vendorData?['pincode'] ?? 'N/A',
                          isDark: isDark,
                        ),
                        if (_vendorData?['gstNumber'] != null)
                          _buildInfoRow(
                            icon: Icons.receipt_long,
                            label: 'GST Number',
                            value: _vendorData?['gstNumber'] ?? '',
                            isDark: isDark,
                          ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Service Areas
                    if (_vendorData?['serviceAreas'] != null &&
                        (_vendorData!['serviceAreas'] as List).isNotEmpty)
                      _buildSection(
                        title: 'Service Areas',
                        isDark: isDark,
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      Icons.map,
                                      size: 20,
                                      color: AppTheme.accentColor,
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      'Pincodes We Serve',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isDark
                                            ? AppTheme.darkTextSecondary
                                            : AppTheme.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children:
                                      (_vendorData!['serviceAreas'] as List)
                                          .map(
                                            (area) => Container(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    horizontal: 12,
                                                    vertical: 6,
                                                  ),
                                              decoration: BoxDecoration(
                                                color: AppTheme.accentColor
                                                    .withValues(alpha: 0.1),
                                                borderRadius:
                                                    BorderRadius.circular(16),
                                                border: Border.all(
                                                  color: AppTheme.accentColor
                                                      .withValues(alpha: 0.3),
                                                ),
                                              ),
                                              child: Text(
                                                area.toString(),
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                  color: AppTheme.accentColor,
                                                ),
                                              ),
                                            ),
                                          )
                                          .toList(),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                    if (_vendorData?['serviceAreas'] != null &&
                        (_vendorData!['serviceAreas'] as List).isNotEmpty)
                      const SizedBox(height: 24),

                    // Bank Details
                    if (_vendorData?['bankDetails'] != null)
                      _buildSection(
                        title: 'Bank Details (KYC)',
                        isDark: isDark,
                        children: [
                          if (_vendorData!['bankDetails']['accountHolderName'] !=
                              null)
                            _buildInfoRow(
                              icon: Icons.person,
                              label: 'Account Holder Name',
                              value:
                                  _vendorData!['bankDetails']['accountHolderName'],
                              isDark: isDark,
                            ),
                          if (_vendorData!['bankDetails']['accountNumber'] !=
                              null)
                            _buildInfoRow(
                              icon: Icons.account_balance,
                              label: 'Account Number',
                              value:
                                  _vendorData!['bankDetails']['accountNumber'],
                              isDark: isDark,
                            ),
                          if (_vendorData!['bankDetails']['ifscCode'] != null)
                            _buildInfoRow(
                              icon: Icons.code,
                              label: 'IFSC Code',
                              value: _vendorData!['bankDetails']['ifscCode'],
                              isDark: isDark,
                            ),
                          if (_vendorData!['bankDetails']['bankName'] != null)
                            _buildInfoRow(
                              icon: Icons.account_balance_wallet,
                              label: 'Bank Name',
                              value: _vendorData!['bankDetails']['bankName'],
                              isDark: isDark,
                            ),
                          if (_vendorData!['bankDetails']['branchName'] != null)
                            _buildInfoRow(
                              icon: Icons.location_city,
                              label: 'Branch Name',
                              value: _vendorData!['bankDetails']['branchName'],
                              isDark: isDark,
                            ),
                        ],
                      ),

                    if (_vendorData?['bankDetails'] != null)
                      const SizedBox(height: 24),

                    // Theme Toggle
                    _buildSection(
                      title: 'Appearance',
                      isDark: isDark,
                      children: [
                        _buildToggleRow(
                          icon: isDark ? Icons.dark_mode : Icons.light_mode,
                          label: 'Dark Mode',
                          value: themeProvider.isDarkMode,
                          onChanged: (v) => themeProvider.setDarkMode(v),
                          isDark: isDark,
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Performance
                    _buildSection(
                      title: 'Performance',
                      isDark: isDark,
                      children: [
                        _buildInfoRow(
                          icon: Icons.star,
                          label: 'Rating',
                          value: '${_vendorData?['rating'] ?? 'N/A'}',
                          isDark: isDark,
                        ),
                        _buildInfoRow(
                          icon: Icons.shopping_cart,
                          label: 'Total Orders',
                          value: '${_vendorData?['totalOrders'] ?? 0}',
                          isDark: isDark,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSection({
    required String title,
    required bool isDark,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: isDark ? AppTheme.darkSurface : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isDark ? AppTheme.darkBorder : AppTheme.borderColor,
            ),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    required bool isDark,
  }) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.accentColor),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark
                        ? AppTheme.darkTextSecondary
                        : AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    color: isDark
                        ? AppTheme.darkTextPrimary
                        : AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToggleRow({
    required IconData icon,
    required String label,
    required bool value,
    required ValueChanged<bool> onChanged,
    required bool isDark,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.accentColor),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
              ),
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeTrackColor: AppTheme.accentColor,
          ),
        ],
      ),
    );
  }
}
