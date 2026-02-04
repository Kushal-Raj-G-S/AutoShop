import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/api_service.dart';
import '../../core/providers/locale_provider.dart';
import '../../core/providers/theme_provider.dart';
import '../../l10n/app_strings.dart';
import '../address/address_list_screen.dart';
import '../orders/screens/order_list_screen.dart';
import '../auth/phone_input_screen.dart';
import 'garage_screen.dart';
import 'wishlist_screen.dart';
import 'notifications_screen.dart';
import 'help_support_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _userData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    try {
      final userData = await _apiService.getUserData();
      if (mounted) {
        setState(() {
          _userData = userData;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Logout', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await _apiService.logout();
      if (mounted) {
        // Navigate to login screen and clear all previous routes
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const PhoneInputScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Watch for locale changes
    context.watch<LocaleProvider>();
    final strings = AppStrings.of(context);
    
    // Extract user info from saved data
    final userName = _userData?['name'] ?? 'User';
    final phoneNumber = _userData?['phoneNumber'] ?? '';
    final email = _userData?['email'];
    final role = _userData?['role'] ?? 'customer';

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text(strings.myAccount),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(AppTheme.spaceLarge),
              child: Column(
                children: [
                  // User Header
                  Center(
                    child: Column(
                      children: [
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppTheme.primaryColor.withValues(alpha: 0.1),
                            border: Border.all(color: AppTheme.primaryColor, width: 2),
                          ),
                          child: Icon(Icons.person, size: 50, color: AppTheme.primaryColor),
                        ),
                        SizedBox(height: AppTheme.spaceMedium),
                        Text(
                          userName.isNotEmpty ? userName : 'Set up your profile',
                          style: AppTheme.heading2,
                        ),
                        SizedBox(height: AppTheme.spaceSmall),
                        Text(phoneNumber, style: AppTheme.bodyMedium),
                        if (email != null && email.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(email, style: AppTheme.bodySmall),
                          ),
                        if (role == 'admin' || role == 'vendor')
                          Container(
                            margin: const EdgeInsets.only(top: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.accentColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              role.toUpperCase(),
                              style: TextStyle(
                                color: AppTheme.accentColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  SizedBox(height: AppTheme.spaceXLarge),

                  // Options
                  _buildProfileOption(
                    context,
                    icon: Icons.shopping_bag_outlined,
                    title: strings.myOrders,
                    subtitle: 'Track current and past orders',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (c) => const OrderListScreen())),
                  ),
                  _buildProfileOption(
                    context,
                    icon: Icons.location_on_outlined,
                    title: strings.deliveryAddresses,
                    subtitle: 'Manage shipping locations',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (c) => const AddressListScreen())),
                  ),
                  _buildProfileOption(
                    context,
                    icon: Icons.directions_car_outlined,
                    title: strings.myGarage,
                    subtitle: 'Manage your vehicles',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (c) => const GarageScreen())),
                  ),
                  _buildProfileOption(
                    context,
                    icon: Icons.favorite_border,
                    title: strings.wishlist,
                    subtitle: 'Saved items for later',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (c) => const WishlistScreen())),
                  ),
                  _buildProfileOption(
                    context,
                    icon: Icons.notifications_none,
                    title: strings.notifications,
                    subtitle: 'Offers and order updates',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (c) => const NotificationsScreen())),
                  ),
                  // Theme Toggle
                  _buildThemeOption(context),
                  // Language Switcher
                  _buildLanguageOption(context),
                  _buildProfileOption(
                    context,
                    icon: Icons.help_outline,
                    title: strings.helpSupport,
                    subtitle: 'FAQs and Customer Care',
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (c) => const HelpSupportScreen())),
                  ),

                  SizedBox(height: AppTheme.spaceLarge),
                  OutlinedButton(
                    onPressed: _handleLogout,
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: AppTheme.errorColor),
                      foregroundColor: AppTheme.errorColor,
                      minimumSize: const Size(double.infinity, 50),
                    ),
                    child: const Text('Log Out'),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildProfileOption(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.accentColor.withValues(alpha: 0.2) : Colors.white,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: isDark ? AppTheme.accentColor : AppTheme.primaryColor),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
                    )),
                    const SizedBox(height: 2),
                    Text(subtitle, style: TextStyle(
                      fontSize: 12,
                      color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
                    )),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThemeOption(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final isDark = themeProvider.isDarkMode;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.accentColor.withValues(alpha: 0.2) : Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                isDark ? Icons.dark_mode : Icons.light_mode,
                color: isDark ? AppTheme.accentColor : AppTheme.primaryColor,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Appearance', style: AppTheme.heading3.copyWith(fontSize: 16)),
                  const SizedBox(height: 2),
                  Text(
                    isDark ? 'Dark Mode' : 'Light Mode',
                    style: AppTheme.bodySmall,
                  ),
                ],
              ),
            ),
            // Theme Switch
            Switch(
              value: isDark,
              onChanged: (value) => themeProvider.setDarkMode(value),
              activeThumbColor: AppTheme.accentColor,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLanguageOption(BuildContext context) {
    final localeProvider = context.watch<LocaleProvider>();
    final lang = localeProvider.languageCode;
    
    String getLanguageName() {
      switch (lang) {
        case 'hi': return 'हिंदी';
        case 'kn': return 'ಕನ್ನಡ';
        default: return 'English';
      }
    }
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark 
                    ? AppTheme.accentColor.withValues(alpha: 0.2) 
                    : Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Icons.language, color: AppTheme.accentColor),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Language / भाषा / ಭಾಷೆ', style: AppTheme.heading3.copyWith(fontSize: 16)),
                  const SizedBox(height: 2),
                  Text(
                    getLanguageName(),
                    style: AppTheme.bodySmall,
                  ),
                ],
              ),
            ),
            // Language Selector
            Container(
              decoration: BoxDecoration(
                color: AppTheme.accentColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildLangButton(localeProvider, 'en', 'EN', lang == 'en'),
                  _buildLangButton(localeProvider, 'hi', 'हि', lang == 'hi'),
                  _buildLangButton(localeProvider, 'kn', 'ಕ', lang == 'kn'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildLangButton(LocaleProvider provider, String langCode, String label, bool isSelected) {
    return GestureDetector(
      onTap: () => provider.setLocale(Locale(langCode)),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.accentColor : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppTheme.accentColor,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}

