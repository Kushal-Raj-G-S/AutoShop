import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/auth_api.dart';
import 'otp_screen.dart';

class PhoneInputScreen extends StatefulWidget {
  const PhoneInputScreen({super.key});

  @override
  State<PhoneInputScreen> createState() => _PhoneInputScreenState();
}

class _PhoneInputScreenState extends State<PhoneInputScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final AuthApi _authApi = AuthApi();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    debugPrint('🔘 Get OTP Clicked');
    debugPrint('📝 Phone Input Value: "${_phoneController.text}"');
    
    // Validate form
    if (!_formKey.currentState!.validate()) {
      debugPrint('❌ Form validation failed');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final phone = '+91${_phoneController.text.trim()}';
    debugPrint('🚀 Sending OTP to $phone');
    
    final result = await _authApi.sendOtp(phone);

    setState(() => _isLoading = false);

    if (result['success'] == true) {
      debugPrint('✅ OTP Sent Successfully');
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => OtpScreen(phoneNumber: phone),
          ),
        );
      }
    } else {
      debugPrint('❌ Send OTP Error: ${result['message']}');
      setState(() {
        _errorMessage = result['message'] ?? 'Failed to send OTP';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        // Use LayoutBuilder + SingleChildScrollView for robust sticky footer
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: IntrinsicHeight(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Spacer(),
                        
                        // Logo / App Name
                        Center(
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: AppTheme.accentColor.withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.storefront,
                                  size: 64,
                                  color: AppTheme.accentColor,
                                ),
                              ),
                              const SizedBox(height: 24),
                              Text(
                                'AutoShop Vendor',
                                style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Manage orders & grow your business',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        const Spacer(),
                        
                        // Phone Input Form
                        Text(
                          'Enter your mobile number',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'We\'ll send you a verification code',
                          style: TextStyle(
                            fontSize: 14,
                            color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 24),
                        
                        Form(
                          key: _formKey,
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Country Code
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                                decoration: BoxDecoration(
                                  color: isDark ? AppTheme.darkSurface : Colors.white,
                                  borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                                  border: Border.all(
                                    color: isDark ? AppTheme.darkBorder : AppTheme.borderColor,
                                  ),
                                ),
                                child: Text(
                                  '+91',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              
                              // Phone Number Input
                              Expanded(
                                child: TextFormField(
                                  controller: _phoneController,
                                  keyboardType: TextInputType.phone,
                                  maxLength: 10,
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
                                  ),
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                  ],
                                  decoration: InputDecoration(
                                    hintText: '9876543210',
                                    counterText: '',
                                    filled: true,
                                    fillColor: isDark ? AppTheme.darkSurface : Colors.white,
                                  ),
                                  onChanged: (val) {
                                    // Clear error when typing
                                    if (_errorMessage != null) {
                                      setState(() => _errorMessage = null);
                                    }
                                  },
                                  validator: (value) {
                                    debugPrint('🔍 Validating input: "$value"');
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Number required';
                                    }
                                    if (value.trim().length != 10) {
                                      return 'Enter valid 10-digit number';
                                    }
                                    return null;
                                  },
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
                                Icon(Icons.error_outline, color: AppTheme.errorColor, size: 20),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: TextStyle(color: AppTheme.errorColor, fontSize: 14),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        
                        const SizedBox(height: 24),
                        
                        // Send OTP Button
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _sendOtp,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.accentColor,
                              foregroundColor: Colors.black,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                              ),
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    height: 24,
                                    width: 24,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                                  )
                                : const Text(
                                    'Get OTP',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                          ),
                        ),
                        
                        const Spacer(),
                        
                        // Terms
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: Text(
                              'By continuing, you agree to our Terms of Service',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
