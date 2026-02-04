import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/auth_api.dart';
import '../../core/api/vendor_api.dart';
import '../registration/registration_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../approval/pending_approval_screen.dart';

class OtpScreen extends StatefulWidget {
  final String phoneNumber;

  const OtpScreen({super.key, required this.phoneNumber});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _otpController = TextEditingController();
  final AuthApi _authApi = AuthApi();
  final VendorApi _vendorApi = VendorApi();
  
  bool _isLoading = false;
  bool _isResending = false;
  String? _errorMessage;
  int _resendSeconds = 30;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  void _startResendTimer() {
    _resendSeconds = 30;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendSeconds > 0) {
        setState(() => _resendSeconds--);
      } else {
        timer.cancel();
      }
    });
  }

  Future<void> _verifyOtp() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await _authApi.verifyOtp(
      widget.phoneNumber,
      _otpController.text.trim(),
    );

    if (result['success'] == true) {
      debugPrint('Correct OTP. Checking vendor profile...');
      final vendorResult = await _vendorApi.getProfile();
      debugPrint('Vendor Profile Result: $vendorResult');
      
      if (mounted) {
        if (vendorResult['success'] == true && vendorResult['data'] != null) {
          String status = 'pending';
          if (vendorResult['data']['vendor'] != null) {
            status = vendorResult['data']['vendor']['status'] ?? 'pending';
          } else {
             // Fallback
             status = vendorResult['data']['status'] ?? 'pending';
          }
          debugPrint('Vendor Status: $status');
          
          if (status == 'approved') {
            debugPrint('Navigating to Dashboard');
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (c) => const DashboardScreen()),
              (route) => false,
            );
          } else if (status == 'pending') {
            debugPrint('Navigating to Pending Approval');
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (c) => const PendingApprovalScreen()),
              (route) => false,
            );
          } else {
            setState(() {
              _isLoading = false;
              _errorMessage = 'Your application was rejected. Please contact support.';
            });
          }
        } else {
          // Vendor profile not found -> New Vendor -> Registration
          // This matches user requirement: "If number isn't registered [as vendor], open register store"
          debugPrint('Vendor not found (404/Empty). Navigating to Registration.');
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (c) => const RegistrationScreen()),
          );
        }
      }
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage = result['message'] ?? 'Invalid OTP';
      });
    }
  }

  Future<void> _resendOtp() async {
    if (_resendSeconds > 0) return;

    setState(() => _isResending = true);
    
    final result = await _authApi.sendOtp(widget.phoneNumber);
    
    setState(() => _isResending = false);

    if (result['success'] == true) {
      _startResendTimer();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('OTP sent successfully'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Failed to resend OTP'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Verify OTP'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 24),
              
              Text(
                'Enter verification code',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'We sent a 6-digit code to ${widget.phoneNumber}',
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
                ),
              ),
              
              const SizedBox(height: 40),
              
              // OTP Input
              Form(
                key: _formKey,
                child: TextFormField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 16,
                    color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
                  ),
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                  ],
                  decoration: InputDecoration(
                    counterText: '',
                    hintText: '------',
                    hintStyle: TextStyle(
                      letterSpacing: 16,
                      color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
                    ),
                    filled: true,
                    fillColor: isDark ? AppTheme.darkSurface : Colors.white,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter OTP';
                    }
                    if (value.length != 6) {
                      return 'Enter 6-digit OTP';
                    }
                    return null;
                  },
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
              
              // Verify Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _verifyOtp,
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
                          'Verify & Continue',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Resend OTP
              Center(
                child: _isResending
                    ? const CircularProgressIndicator()
                    : TextButton(
                        onPressed: _resendSeconds > 0 ? null : _resendOtp,
                        child: Text(
                          _resendSeconds > 0
                              ? 'Resend OTP in ${_resendSeconds}s'
                              : 'Resend OTP',
                          style: TextStyle(
                            color: _resendSeconds > 0
                                ? (isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary)
                                : AppTheme.accentColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
