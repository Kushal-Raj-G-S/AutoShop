import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class ApiService {
  // Use config for backend URL
  static String get baseUrl => AppConfig.baseUrl;
  
  // VENDOR-SPECIFIC key (different from consumer app)
  static const String _tokenKey = 'vendor_auth_token';
  static const String _vendorDataKey = 'vendor_profile_data';
  
  String? _token;
  
  // Singleton
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();
  
  /// Initialize - load token from storage
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
  }
  
  /// Set auth token
  Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }
  
  /// Get current token
  String? get token => _token;
  
  /// Check if logged in
  Future<bool> isLoggedIn() async {
    if (_token == null) {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString(_tokenKey);
    }
    return _token != null && _token!.isNotEmpty;
  }
  
  /// Logout - clear vendor-specific data
  Future<void> logout() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_vendorDataKey);
  }
  
  /// Save vendor data locally
  Future<void> saveVendorData(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('vendor_data', jsonEncode(data));
  }
  
  /// Get saved vendor data
  Future<Map<String, dynamic>?> getVendorData() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString('vendor_data');
    if (data != null) {
      return jsonDecode(data);
    }
    return null;
  }
  
  /// Headers with auth
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };
  
  /// GET request
  Future<Map<String, dynamic>> get(String endpoint) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers,
      );
      return _handleResponse(response);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
  
  /// POST request
  Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> body) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers,
        body: jsonEncode(body),
      );
      return _handleResponse(response);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
  
  /// PUT request
  Future<Map<String, dynamic>> put(String endpoint, Map<String, dynamic> body) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers,
        body: jsonEncode(body),
      );
      return _handleResponse(response);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
  
  /// PATCH request
  Future<Map<String, dynamic>> patch(String endpoint, Map<String, dynamic> body) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl$endpoint'),
        headers: _headers,
        body: jsonEncode(body),
      );
      return _handleResponse(response);
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
  
  /// Handle HTTP response
  Map<String, dynamic> _handleResponse(http.Response response) {
    final body = jsonDecode(response.body);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return {
        'success': true,
        'data': body['data'] ?? body,
        'message': body['message'],
      };
    } else {
      return {
        'success': false,
        'message': body['message'] ?? 'Request failed',
        'statusCode': response.statusCode,
      };
    }
  }
}
