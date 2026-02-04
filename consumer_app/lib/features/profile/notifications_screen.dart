import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        elevation: 0,
        actions: [
          TextButton(
            onPressed: () {},
            child: Text('Mark all read', style: TextStyle(color: AppTheme.accentColor)),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildNotification(
            icon: Icons.local_shipping,
            title: 'Order Shipped',
            message: 'Your order #12345 has been shipped and is on the way.',
            time: '2 hours ago',
            isRead: false,
          ),
          _buildNotification(
            icon: Icons.local_offer,
            title: '20% Off on Engine Parts',
            message: 'Limited time offer! Get 20% off on all engine parts.',
            time: '1 day ago',
            isRead: true,
          ),
          _buildNotification(
            icon: Icons.check_circle,
            title: 'Order Delivered',
            message: 'Your order #12344 has been delivered successfully.',
            time: '3 days ago',
            isRead: true,
          ),
        ],
      ),
    );
  }

  Widget _buildNotification({
    required IconData icon,
    required String title,
    required String message,
    required String time,
    required bool isRead,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isRead ? Colors.white : AppTheme.accentColor.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppTheme.primaryColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTheme.heading3.copyWith(fontSize: 14)),
                const SizedBox(height: 4),
                Text(message, style: AppTheme.bodySmall),
                const SizedBox(height: 8),
                Text(time, style: TextStyle(color: AppTheme.textSecondary, fontSize: 11)),
              ],
            ),
          ),
          if (!isRead)
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: AppTheme.accentColor,
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
    );
  }
}
