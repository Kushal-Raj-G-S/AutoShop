import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Wishlist'),
        elevation: 0,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.favorite_outline,
                  size: 64,
                  color: Colors.red,
                ),
              ),
              const SizedBox(height: 24),
              Text('Your Wishlist is Empty', style: AppTheme.heading2),
              const SizedBox(height: 8),
              Text(
                'Save items you love by tapping the heart icon',
                textAlign: TextAlign.center,
                style: AppTheme.bodyMedium,
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
                child: const Text('Start Shopping'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
