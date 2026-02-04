import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/vendor_api.dart';
import '../../core/api/auth_api.dart';
import '../approval/pending_approval_screen.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final VendorApi _vendorApi = VendorApi();

  final _storeNameController = TextEditingController();
  final _ownerNameController = TextEditingController();
  final _phoneController = TextEditingController(); // Added
  final _documentUrlController = TextEditingController(); // Added
  final _addressController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _gstController = TextEditingController();

  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchUserProfile();
  }

  Future<void> _fetchUserProfile() async {
    // Attempt to pre-fill phone number
    try {
      final authApi = AuthApi();
      final profile = await authApi.getProfile();
      if (profile['success'] == true && profile['data'] != null) {
        if (profile['data']['user'] != null) {
          final phone =
              profile['data']['user']['phoneNumber']?.toString() ?? '';
          if (phone.isNotEmpty) {
            setState(() => _phoneController.text = phone);
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching user profile for registration: $e');
    }
  }

  @override
  void dispose() {
    _storeNameController.dispose();
    _ownerNameController.dispose();
    _phoneController.dispose();
    _documentUrlController.dispose();
    _addressController.dispose();
    _pincodeController.dispose();
    _gstController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await _vendorApi.register(
      storeName: _storeNameController.text.trim(),
      ownerName: _ownerNameController.text.trim(),
      phone: _phoneController.text.trim(),
      documentUrl: _documentUrlController.text.trim(),
      storeAddress: _addressController.text.trim(),
      pincode: _pincodeController.text.trim(),
      latitude: 0, // Will be updated by admin after approval
      longitude: 0,
      gstNumber: _gstController.text.trim().isNotEmpty
          ? _gstController.text.trim()
          : null,
    );

    setState(() => _isLoading = false);

    if (result['success'] == true) {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (c) => const PendingApprovalScreen()),
        );
      }
    } else {
      setState(() {
        _errorMessage = result['message'] ?? 'Registration failed';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Register Your Store'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: isDark
            ? AppTheme.darkTextPrimary
            : AppTheme.textPrimary,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Text(
                  'Store Details',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: isDark
                        ? AppTheme.darkTextPrimary
                        : AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Tell us about your auto parts store',
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark
                        ? AppTheme.darkTextSecondary
                        : AppTheme.textSecondary,
                  ),
                ),

                const SizedBox(height: 32),

                // Store Name
                _buildLabel('Store Name *'),
                TextFormField(
                  controller: _storeNameController,
                  decoration: const InputDecoration(
                    hintText: 'e.g., Kumar Auto Parts',
                  ),
                  validator: (v) => v?.isEmpty == true ? 'Required' : null,
                ),

                const SizedBox(height: 20),

                // Owner Name
                _buildLabel('Owner Name *'),
                TextFormField(
                  controller: _ownerNameController,
                  decoration: const InputDecoration(
                    hintText: 'e.g., Rajesh Kumar',
                  ),
                  validator: (v) => v?.isEmpty == true ? 'Required' : null,
                ),

                const SizedBox(height: 20),

                // Phone Number
                _buildLabel('Phone Number *'),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(hintText: '+919876543210'),
                  validator: (v) => v?.isEmpty == true ? 'Required' : null,
                ),

                const SizedBox(height: 20),

                // Document URL
                _buildLabel('Business License / Document Link *'),
                TextFormField(
                  controller: _documentUrlController,
                  decoration: const InputDecoration(
                    hintText: 'e.g., Google Drive link to PDF',
                    helperText: 'Please provide a link to your business proof',
                  ),
                  validator: (v) => v?.isEmpty == true ? 'Required' : null,
                ),

                const SizedBox(height: 20),

                // Address
                _buildLabel('Store Address *'),
                TextFormField(
                  controller: _addressController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    hintText: 'Full address with landmark',
                  ),
                  validator: (v) => v?.isEmpty == true ? 'Required' : null,
                ),

                const SizedBox(height: 20),

                // Pincode
                _buildLabel('Pincode *'),
                TextFormField(
                  controller: _pincodeController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  decoration: const InputDecoration(
                    hintText: '560001',
                    counterText: '',
                  ),
                  validator: (v) {
                    if (v?.isEmpty == true) return 'Required';
                    if (v!.length != 6) return 'Enter 6-digit pincode';
                    return null;
                  },
                ),

                const SizedBox(height: 20),

                // GST (Optional)
                _buildLabel('GST Number (Optional)'),
                TextFormField(
                  controller: _gstController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(
                    hintText: '22AAAAA0000A1Z5',
                  ),
                ),

                const SizedBox(height: 16),

                // Location Note
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.accentColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: AppTheme.accentColor.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.location_on, color: AppTheme.accentColor),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Your location will be auto-detected for order matching',
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark
                                ? AppTheme.darkTextPrimary
                                : AppTheme.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.errorColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.error_outline,
                          color: AppTheme.errorColor,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: TextStyle(
                              color: AppTheme.errorColor,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 32),

                // Submit Button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentColor,
                      foregroundColor: Colors.black,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.black,
                            ),
                          )
                        : const Text(
                            'Submit for Approval',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),

                const SizedBox(height: 16),

                Center(
                  child: Text(
                    'Admin will review and approve your store within 24 hours',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark
                          ? AppTheme.darkTextSecondary
                          : AppTheme.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
        ),
      ),
    );
  }
}
