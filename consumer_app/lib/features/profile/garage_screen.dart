import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class GarageScreen extends StatelessWidget {
  const GarageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Garage'),
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
                  color: AppTheme.primaryColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.directions_car,
                  size: 64,
                  color: AppTheme.primaryColor,
                ),
              ),
              const SizedBox(height: 24),
              Text('No Vehicles Added', style: AppTheme.heading2),
              const SizedBox(height: 8),
              Text(
                'Add your vehicles to get personalized parts recommendations',
                textAlign: TextAlign.center,
                style: AppTheme.bodyMedium,
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Coming soon!')),
                  );
                },
                icon: const Icon(Icons.add),
                label: const Text('Add Vehicle'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
