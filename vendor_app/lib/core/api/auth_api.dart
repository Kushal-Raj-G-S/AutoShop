import 'api_service.dart';

class AuthApi {
  final ApiService _api = ApiService();
  
  /// Send OTP to phone number
  Future<Map<String, dynamic>> sendOtp(String phone) async {
    return await _api.post('/auth/send-otp', {
      'phoneNumber': phone,
    });
  }
  
  /// Verify OTP and get token
  Future<Map<String, dynamic>> verifyOtp(String phone, String otp) async {
    final result = await _api.post('/auth/verify-otp', {
      'phoneNumber': phone,
      'otp': otp,
    });
    
    // Save token if successful
    if (result['success'] == true && result['data'] != null) {
      final token = result['data']['token'];
      if (token != null) {
        await _api.setToken(token);
      }
      
      // Save user data
      final user = result['data']['user'];
      if (user != null) {
        await _api.saveVendorData(user);
      }
    }
    
    return result;
  }
  
  /// Get current user profile
  Future<Map<String, dynamic>> getProfile() async {
    return await _api.get('/auth/profile');
  }
}
