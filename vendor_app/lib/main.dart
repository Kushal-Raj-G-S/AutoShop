import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/theme/app_theme.dart';
import 'core/providers/theme_provider.dart';
import 'core/providers/locale_provider.dart';
import 'core/api/api_service.dart';
import 'core/api/vendor_api.dart';
import 'features/auth/phone_input_screen.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/approval/pending_approval_screen.dart';
import 'features/registration/registration_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => LocaleProvider()),
      ],
      child: const VendorApp(),
    ),
  );
}

class VendorApp extends StatelessWidget {
  const VendorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<ThemeProvider, LocaleProvider>(
      builder: (context, themeProvider, localeProvider, child) {
        return MaterialApp(
          title: 'AutoShop Vendor',
          debugShowCheckedModeBanner: false,
          themeMode: themeProvider.themeMode,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          locale: localeProvider.locale,
          supportedLocales: LocaleProvider.supportedLocales,
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: const AuthCheckScreen(),
        );
      },
    );
  }
}

/// Checks authentication status and routes to appropriate screen
class AuthCheckScreen extends StatefulWidget {
  const AuthCheckScreen({super.key});

  @override
  State<AuthCheckScreen> createState() => _AuthCheckScreenState();
}

class _AuthCheckScreenState extends State<AuthCheckScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    try {
      final api = ApiService();
      await api.init();
      
      // DEBUG: Force logout once if needed to clear stuck state
      // await api.logout(); 

      final isLoggedIn = await api.isLoggedIn();
      debugPrint('🔐 Is Logged In: $isLoggedIn');
      debugPrint('🔐 Token: ${api.token?.substring(0, 10) ?? "null"}...');

      // Not logged in - go to phone input
      if (!isLoggedIn) {
        debugPrint('➡️ Going to PhoneInputScreen (not logged in)');
        _navigateTo(const PhoneInputScreen());
        return;
      }

      // Logged in - check vendor status with timeout
      final vendorApi = VendorApi();

      try {
        final result = await vendorApi.getProfile().timeout(
          const Duration(seconds: 5),
          onTimeout: () => {'success': false, 'message': 'Timeout'},
        );

        debugPrint('📋 Vendor API result: $result');

        if (result['success'] == true) {
           // Helper to find status recursively (same logic as PendingApprovalScreen)
          String? findStatus(dynamic data) {
            if (data is Map) {
              if (data['status'] != null && data['status'] is String) {
                final s = data['status'].toString().toLowerCase();
                if (['pending', 'approved', 'rejected', 'blocked'].contains(s)) {
                  return s;
                }
              }
              for (var key in data.keys) {
                if (data[key] is Map || data[key] is List) {
                   if (key == 'data' || key == 'vendor' || key == 'message' || key == 'user') {
                      final found = findStatus(data[key]);
                      if (found != null) return found;
                   }
                }
              }
            }
            return null;
          }

          final status = findStatus(result) ?? '';
          debugPrint('📋 Extracted status: $status');

          if (status == 'approved') {
            debugPrint('➡️ Going to DashboardScreen (approved)');
            _navigateTo(const DashboardScreen());
          } else if (status == 'pending') {
            debugPrint('➡️ Going to PendingApprovalScreen (pending)');
            _navigateTo(const PendingApprovalScreen());
          } else if (status == 'rejected') {
            debugPrint('➡️ Going to PendingApprovalScreen (rejected)');
            _navigateTo(const PendingApprovalScreen());
          } else {
            // Has account but no vendor profile yet
            debugPrint(
              '➡️ Going to RegistrationScreen (logged in but not a vendor)',
            );
            _navigateTo(const RegistrationScreen());
          }
        } else {
          // API failed - clear token and go to login
          debugPrint('➡️ API failed, going to PhoneInputScreen');
          await api.logout();
          _navigateTo(const PhoneInputScreen());
        }
      } catch (e) {
        // Timeout or error - clear token and go to login
        debugPrint('❌ Error checking vendor: $e');
        await api.logout();
        _navigateTo(const PhoneInputScreen());
      }
    } catch (e) {
      debugPrint('❌ Auth check error: $e');
      _navigateTo(const PhoneInputScreen());
    }
  }

  void _navigateTo(Widget screen) {
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (c) => screen),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
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
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).brightness == Brightness.dark
                    ? AppTheme.darkTextPrimary
                    : AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 32),
            CircularProgressIndicator(color: AppTheme.accentColor),
          ],
        ),
      ),
    );
  }
}
