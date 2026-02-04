import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/api/api_service.dart';
import '../../core/theme/app_theme.dart';
import '../../core/providers/address_provider.dart';
import '../../core/navigation/main_navigation_screen.dart';

class OtpVerificationScreen extends StatefulWidget {
  final String phoneNumber;

  const OtpVerificationScreen({super.key, required this.phoneNumber});

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final TextEditingController _otpController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _verifyOtp() async {
    // Clear previous error
    setState(() {
      _errorMessage = null;
    });

    // Validate OTP
    final otp = _otpController.text.trim();
    if (otp.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter the OTP';
      });
      return;
    }

    if (otp.length != 6) {
      setState(() {
        _errorMessage = 'Please enter a valid 6-digit OTP';
      });
      return;
    }

    // Show loading
    setState(() {
      _isLoading = true;
    });

    try {
      final result = await _apiService.verifyOtp(
        phoneNumber: widget.phoneNumber,
        otp: otp,
      );

      if (!mounted) return;

      if (result['success']) {
        // Load addresses after successful login
        if (mounted) {
          context.read<AddressProvider>().loadAddresses();
        }

        // Navigate to main navigation screen and remove all previous routes
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const MainNavigationScreen()),
          (route) => false,
        );
      } else {
        setState(() {
          _errorMessage = result['message'];
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'An error occurred. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _resendOtp() async {
    setState(() {
      _errorMessage = null;
      _isLoading = true;
    });

    try {
      final result = await _apiService.sendOtp(widget.phoneNumber);

      if (!mounted) return;

      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('OTP resent successfully'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        setState(() {
          _errorMessage = result['message'];
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Failed to resend OTP. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppTheme.primaryColor,
              AppTheme.primaryColor.withValues(alpha: 0.8),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Custom app bar
              Padding(
                padding: EdgeInsets.all(AppTheme.spaceSmall),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),

              Expanded(
                child: SingleChildScrollView(
                  child: Padding(
                    padding: EdgeInsets.all(AppTheme.spaceLarge),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 20),

                        // Icon
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Icon(
                            Icons.lock_outline,
                            size: 40,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                        const SizedBox(height: 30),

                        // Title
                        Text(
                          'Verify OTP',
                          style: AppTheme.heading1.copyWith(
                            color: Colors.white,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: AppTheme.spaceSmall),

                        // Subtitle with phone number
                        Text(
                          'Enter the 6-digit code sent to\n${widget.phoneNumber}',
                          style: AppTheme.bodyLarge.copyWith(
                            color: Colors.white.withValues(alpha: 0.9),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 50),

                        // White card container
                        Container(
                          padding: EdgeInsets.all(AppTheme.spaceLarge),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(
                              AppTheme.radiusLarge,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              // OTP input
                              TextField(
                                controller: _otpController,
                                keyboardType: TextInputType.number,
                                maxLength: 6,
                                textAlign: TextAlign.center,
                                autofocus: true,
                                inputFormatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                ],
                                style: AppTheme.heading1.copyWith(
                                  letterSpacing: 16,
                                  color: AppTheme.primaryColor,
                                ),
                                decoration: InputDecoration(
                                  hintText: '• • • • • •',
                                  hintStyle: AppTheme.heading2.copyWith(
                                    color: AppTheme.textSecondary,
                                    letterSpacing: 16,
                                  ),
                                  filled: true,
                                  fillColor: AppTheme.surfaceColor,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(
                                      AppTheme.radiusMedium,
                                    ),
                                    borderSide: BorderSide.none,
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(
                                      AppTheme.radiusMedium,
                                    ),
                                    borderSide: BorderSide(
                                      color: AppTheme.borderColor,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(
                                      AppTheme.radiusMedium,
                                    ),
                                    borderSide: BorderSide(
                                      color: AppTheme.primaryColor,
                                      width: 2,
                                    ),
                                  ),
                                  errorBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(
                                      AppTheme.radiusMedium,
                                    ),
                                    borderSide: BorderSide(
                                      color: AppTheme.errorColor,
                                    ),
                                  ),
                                  errorText: _errorMessage,
                                  counterText: '',
                                ),
                                enabled: !_isLoading,
                              ),
                              SizedBox(height: AppTheme.spaceLarge),

                              // Verify button
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: _isLoading ? null : _verifyOtp,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primaryColor,
                                    foregroundColor: Colors.white,
                                    padding: EdgeInsets.symmetric(
                                      vertical: AppTheme.spaceMedium + 4,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(
                                        AppTheme.radiusMedium,
                                      ),
                                    ),
                                    elevation: AppTheme.elevationMedium,
                                  ),
                                  child: _isLoading
                                      ? const SizedBox(
                                          height: 20,
                                          width: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            valueColor:
                                                AlwaysStoppedAnimation<Color>(
                                                  Colors.white,
                                                ),
                                          ),
                                        )
                                      : Text(
                                          'Verify OTP',
                                          style: AppTheme.buttonText,
                                        ),
                                ),
                              ),
                              SizedBox(height: AppTheme.spaceMedium),

                              // Resend OTP
                              TextButton(
                                onPressed: _isLoading ? null : _resendOtp,
                                child: Text(
                                  'Resend OTP',
                                  style: AppTheme.bodyLarge.copyWith(
                                    color: AppTheme.primaryColor,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
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
