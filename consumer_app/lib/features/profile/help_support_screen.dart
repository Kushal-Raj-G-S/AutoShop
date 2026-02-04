import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? AppTheme.darkBackground : const Color(0xFFEAEDED),
      appBar: AppBar(
        title: const Text('Help & Support'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero Section - Amazon Style
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.primaryColor,
                    AppTheme.primaryColor.withValues(alpha: 0.8),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Column(
                children: [
                  const Icon(Icons.support_agent, size: 64, color: Colors.white),
                  const SizedBox(height: 12),
                  const Text(
                    'How can we help you?',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '24/7 Customer Support',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withValues(alpha: 0.8),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Quick Actions Grid - Amazon Style
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkSurface : Colors.white,
                borderRadius: BorderRadius.circular(8),
                boxShadow: isDark ? null : AppTheme.cardShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.flash_on, color: AppTheme.accentColor, size: 20),
                      const SizedBox(width: 8),
                      Text('Quick Actions', style: AppTheme.heading3.copyWith(fontSize: 16)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: _buildQuickAction(context, Icons.local_shipping, 'Track\nOrder', isDark)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildQuickAction(context, Icons.replay, 'Returns &\nRefunds', isDark)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildQuickAction(context, Icons.payment, 'Payment\nIssues', isDark)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildQuickAction(context, Icons.cancel_outlined, 'Cancel\nOrder', isDark)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildQuickAction(context, Icons.account_circle_outlined, 'Account\nSettings', isDark)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildQuickAction(context, Icons.security, 'Security\nHelp', isDark)),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Contact Options - Amazon Style
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkSurface : Colors.white,
                borderRadius: BorderRadius.circular(8),
                boxShadow: isDark ? null : AppTheme.cardShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Contact Us', style: AppTheme.heading3.copyWith(fontSize: 16)),
                  const SizedBox(height: 16),
                  _buildContactTile(
                    context,
                    icon: Icons.chat_bubble,
                    iconColor: Colors.green,
                    title: 'Chat with Us',
                    subtitle: 'Available 24/7 • Avg. wait: 2 min',
                    isRecommended: true,
                    isDark: isDark,
                    onTap: () => _showComingSoon(context),
                  ),
                  const Divider(height: 24),
                  _buildContactTile(
                    context,
                    icon: Icons.phone,
                    iconColor: AppTheme.flipkartBlue,
                    title: 'Call Us',
                    subtitle: '+91 1800-123-4567 (Toll Free)',
                    isDark: isDark,
                    onTap: () => _showComingSoon(context),
                  ),
                  const Divider(height: 24),
                  _buildContactTile(
                    context,
                    icon: Icons.email_outlined,
                    iconColor: AppTheme.accentColor,
                    title: 'Email Support',
                    subtitle: 'support@autoshop.com • Response in 24h',
                    isDark: isDark,
                    onTap: () => _showComingSoon(context),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 12),
            
            // FAQs - Amazon Style Expandable
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkSurface : Colors.white,
                borderRadius: BorderRadius.circular(8),
                boxShadow: isDark ? null : AppTheme.cardShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Frequently Asked Questions', style: AppTheme.heading3.copyWith(fontSize: 16)),
                      TextButton(
                        onPressed: () {},
                        child: Text('View All', style: TextStyle(color: AppTheme.flipkartBlue)),
                      ),
                    ],
                  ),
                  _buildFaqTile('How do I track my order?', 
                    'Go to "My Orders" in your profile and tap on any order to see real-time tracking updates.', isDark),
                  _buildFaqTile('What is your return policy?', 
                    'We offer 7-day easy returns for most products. Check the product page for specific return policies.', isDark),
                  _buildFaqTile('How do I cancel an order?', 
                    'You can cancel orders before they are shipped. Go to "My Orders" → Select Order → Cancel.', isDark),
                  _buildFaqTile('What payment methods are accepted?', 
                    'We accept UPI, Credit/Debit Cards, Net Banking, Wallets, and Cash on Delivery.', isDark),
                ],
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Legal Links - Amazon Style
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 12),
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkSurface : Colors.white,
                borderRadius: BorderRadius.circular(8),
                boxShadow: isDark ? null : AppTheme.cardShadow,
              ),
              child: Column(
                children: [
                  _buildLegalTile(context, 'Terms & Conditions', Icons.description_outlined, isDark),
                  const Divider(height: 1, indent: 56),
                  _buildLegalTile(context, 'Privacy Policy', Icons.privacy_tip_outlined, isDark),
                  const Divider(height: 1, indent: 56),
                  _buildLegalTile(context, 'Refund Policy', Icons.monetization_on_outlined, isDark),
                  const Divider(height: 1, indent: 56),
                  _buildLegalTile(context, 'Shipping Policy', Icons.local_shipping_outlined, isDark),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // App Version Footer
            Center(
              child: Column(
                children: [
                  Text('AutoShop', style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
                  )),
                  const SizedBox(height: 4),
                  Text('Version 1.0.0', style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
                  )),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
  
  void _showComingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Coming soon!'),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppTheme.primaryColor,
      ),
    );
  }

  Widget _buildQuickAction(BuildContext context, IconData icon, String label, bool isDark) {
    return GestureDetector(
      onTap: () => _showComingSoon(context),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.darkBackground : const Color(0xFFF7F8F8),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isDark ? AppTheme.darkBorder : AppTheme.borderColor),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppTheme.accentColor, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactTile(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    bool isRecommended = false,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(title, style: TextStyle(
                      fontWeight: FontWeight.w600, 
                      fontSize: 15,
                      color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
                    )),
                    if (isRecommended) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.green.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'RECOMMENDED',
                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.green),
                        ),
                      ),
                    ],
                  ],
                ),
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
    );
  }

  Widget _buildFaqTile(String question, String answer, bool isDark) {
    return Theme(
      data: ThemeData().copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: EdgeInsets.zero,
        title: Text(question, style: TextStyle(
          fontSize: 14, 
          fontWeight: FontWeight.w500,
          color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
        )),
        iconColor: AppTheme.accentColor,
        collapsedIconColor: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Text(answer, style: TextStyle(
              fontSize: 13, 
              color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
              height: 1.5,
            )),
          ),
        ],
      ),
    );
  }

  Widget _buildLegalTile(BuildContext context, String title, IconData icon, bool isDark) {
    return ListTile(
      leading: Icon(icon, color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary),
      title: Text(title, style: TextStyle(
        fontSize: 14,
        color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
      )),
      trailing: Icon(Icons.chevron_right, color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary, size: 20),
      onTap: () => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$title - Coming soon')),
      ),
    );
  }
}
