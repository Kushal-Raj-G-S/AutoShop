import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/vendor_api.dart';
import '../../core/api/api_service.dart';
import '../dashboard/dashboard_screen.dart';
import '../auth/phone_input_screen.dart';

class PendingApprovalScreen extends StatefulWidget {
  const PendingApprovalScreen({super.key});

  @override
  State<PendingApprovalScreen> createState() => _PendingApprovalScreenState();
}

class _PendingApprovalScreenState extends State<PendingApprovalScreen> {
  final VendorApi _vendorApi = VendorApi();
  Timer? _pollTimer;
  String _status = 'pending';
  bool _isChecking = false;

  @override
  void initState() {
    super.initState();
    _checkStatus();
    // Poll every 30 seconds
    _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) => _checkStatus());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _checkStatus() async {
    if (_isChecking) return;
    
    setState(() => _isChecking = true);
    
    // Debug print
    debugPrint('🔄 Checking vendor status...');
    
    final result = await _vendorApi.getProfile();
    debugPrint('📦 Full Vendor Profile Response: $result');
    
    // Robust extraction for malformed/nested responses
    String status = 'pending';
    
    // Helper to find status recursively
    String? findStatus(dynamic data) {
      if (data is Map) {
        // Direct check
        if (data['status'] != null && data['status'] is String) {
           final s = data['status'].toString().toLowerCase();
           if (['pending', 'approved', 'rejected', 'blocked'].contains(s)) {
             return s;
           }
        }
        
        // Recursive search in values
        for (var key in data.keys) {
          if (data[key] is Map || data[key] is List) {
             // Avoid recursion loops if any
             if (key == 'data' || key == 'vendor' || key == 'message' || key == 'user') {
                final found = findStatus(data[key]);
                if (found != null) return found;
             }
          }
        }
      }
      return null;
    }

     if (result['success'] == true) {
       status = findStatus(result) ?? 'pending';
       debugPrint('✅ Deep extracted status: $status');
    } else {
      debugPrint('❌ Failed to get profile: ${result['message']}');
    }
    
    setState(() {
      _status = status;
      _isChecking = false;
    });
    
    if (status == 'approved' && mounted) {
      debugPrint('🚀 Status is APPROVED! Navigating to dashboard...');
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (c) => const DashboardScreen()),
      );
    }
  }

  Future<void> _logout() async {
    await ApiService().logout();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (c) => const PhoneInputScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              
              // Icon
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: AppTheme.accentColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _status == 'rejected' ? Icons.cancel : Icons.hourglass_top,
                  size: 80,
                  color: _status == 'rejected' ? AppTheme.errorColor : AppTheme.accentColor,
                ),
              ),
              
              const SizedBox(height: 40),
              
              // Title
              Text(
                _status == 'rejected' 
                    ? 'Registration Rejected'
                    : 'Pending Approval',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Description
              Text(
                _status == 'rejected'
                    ? 'Your vendor registration was rejected. Please contact support for more information.'
                    : 'Your store registration is under review.\nYou\'ll be notified once approved.',
                style: TextStyle(
                  fontSize: 16,
                  color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 40),
              
              // Status Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkSurface : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? AppTheme.darkBorder : AppTheme.borderColor,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (_isChecking) ...[
                      SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppTheme.accentColor,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Checking status...',
                        style: TextStyle(
                          color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
                        ),
                      ),
                    ] else ...[
                      Icon(
                        _status == 'pending' ? Icons.pending : Icons.check_circle,
                        color: _status == 'pending' ? AppTheme.warningColor : AppTheme.successColor,
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Status: ${_status.toUpperCase()}',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              
              const Spacer(),
              
              // Refresh Button
              OutlinedButton.icon(
                onPressed: _isChecking ? null : _checkStatus,
                icon: const Icon(Icons.refresh),
                label: const Text('Check Status'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.accentColor,
                  side: BorderSide(color: AppTheme.accentColor),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Logout option
              TextButton(
                onPressed: _logout,
                child: Text(
                  'Logout',
                  style: TextStyle(
                    color: isDark ? AppTheme.darkTextSecondary : AppTheme.textSecondary,
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
