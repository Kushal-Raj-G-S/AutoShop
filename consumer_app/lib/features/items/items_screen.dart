import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class ItemsScreen extends StatelessWidget {
  final int categoryId;
  final String categoryName;

  const ItemsScreen({
    super.key,
    required this.categoryId,
    required this.categoryName,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(categoryName),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(AppTheme.spaceLarge),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.construction,
                  size: 50,
                  color: AppTheme.primaryColor,
                ),
              ),
              SizedBox(height: AppTheme.spaceLarge),
              Text(
                'Items Coming Soon',
                style: AppTheme.heading2,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: AppTheme.spaceMedium),
              Text(
                'Category: $categoryName (ID: $categoryId)',
                style: AppTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: AppTheme.spaceSmall),
              Text(
                'The items list for this category will be available soon.',
                style: AppTheme.bodySmall.copyWith(
                  color: AppTheme.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
