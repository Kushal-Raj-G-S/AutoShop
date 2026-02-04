import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/api/api_service.dart';
import '../../core/theme/app_theme.dart';
import 'otp_verification_screen.dart';

class PhoneInputScreen extends StatefulWidget {
  const PhoneInputScreen({super.key});

  @override
  State<PhoneInputScreen> createState() => _PhoneInputScreenState();
}

class _PhoneInputScreenState extends State<PhoneInputScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _phoneController = TextEditingController();
  final ApiService _apiService = ApiService();
  final FocusNode _phoneFocus = FocusNode();
  bool _isLoading = false;
  String? _errorMessage;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero).animate(
          CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
        );
    _animationController.forward();
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _phoneFocus.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    // Clear previous error
    setState(() {
      _errorMessage = null;
    });

    // Validate phone number
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter your phone number';
      });
      return;
    }

    if (phone.length != 10) {
      setState(() {
        _errorMessage = 'Please enter a valid 10-digit phone number';
      });
      return;
    }

    // Format phone number with country code
    final formattedPhone = '+91$phone';

    // Show loading
    setState(() {
      _isLoading = true;
    });

    try {
      final result = await _apiService.sendOtp(formattedPhone);

      if (!mounted) return;

      if (result['success']) {
        // Navigate to OTP screen
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                OtpVerificationScreen(phoneNumber: formattedPhone),
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
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: SingleChildScrollView(
                padding: EdgeInsets.all(AppTheme.spaceLarge),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 40),

                    // Logo/Icon
                    Container(
                      width: 100,
                      height: 100,
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
                        Icons.directions_car,
                        size: 50,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                    const SizedBox(height: 40),

                    // Title
                    Text(
                      'Welcome to AutoShop',
                      style: AppTheme.heading1.copyWith(
                        color: Colors.white,
                        fontSize: 32,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: AppTheme.spaceSmall),

                    // Subtitle
                    Text(
                      'Your trusted auto service partner',
                      style: AppTheme.bodyLarge.copyWith(
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 60),

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
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'Enter your phone number',
                            style: AppTheme.heading3,
                            textAlign: TextAlign.center,
                          ),
                          SizedBox(height: AppTheme.spaceMedium),

                          // Phone number input
                          TextField(
                            controller: _phoneController,
                            focusNode: _phoneFocus,
                            keyboardType: TextInputType.phone,
                            maxLength: 10,
                            style: AppTheme.bodyLarge.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                            ],
                            decoration: InputDecoration(
                              labelText: 'Phone Number',
                              hintText: 'Enter 10-digit number',
                              prefixIcon: Icon(
                                Icons.phone_android,
                                color: AppTheme.primaryColor,
                              ),
                              prefixText: '+91 ',
                              prefixStyle: AppTheme.bodyLarge.copyWith(
                                fontWeight: FontWeight.w600,
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
                            ),
                            enabled: !_isLoading,
                          ),
                          SizedBox(height: AppTheme.spaceLarge),

                          // Send OTP button
                          ElevatedButton(
                            onPressed: _isLoading ? null : _sendOtp,
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
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Colors.white,
                                      ),
                                    ),
                                  )
                                : Text('Send OTP', style: AppTheme.buttonText),
                          ),
                        ],
                      ),
                    ),

                    SizedBox(height: MediaQuery.of(context).size.height * 0.1),

                    // Terms text
                    Text(
                      'By continuing, you agree to our\nTerms of Service and Privacy Policy',
                      style: AppTheme.caption.copyWith(
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: AppTheme.spaceMedium),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
