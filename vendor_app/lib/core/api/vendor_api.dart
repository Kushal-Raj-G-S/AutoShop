import 'api_service.dart';

class VendorApi {
  final ApiService _api = ApiService();
  
  /// Register as vendor
  Future<Map<String, dynamic>> register({
    required String storeName,
    required String ownerName,
    required String phone,
    required String documentUrl,
    required String storeAddress,
    required String pincode,
    required double latitude,
    required double longitude,
    String? gstNumber,
    String? panNumber,
    List<String>? serviceAreas,
  }) async {
    return await _api.post('/vendor/register', {
      'storeName': storeName,
      'ownerName': ownerName,
      'phone': phone,
      'documentUrl': documentUrl,
      'storeAddress': storeAddress,
      'pincode': pincode,
      'latitude': latitude,
      'longitude': longitude,
      if (gstNumber != null) 'gstNumber': gstNumber,
      if (panNumber != null) 'panNumber': panNumber,
      if (serviceAreas != null) 'serviceAreas': serviceAreas,
    });
  }
  
  /// Get vendor profile
  Future<Map<String, dynamic>> getProfile() async {
    final result = await _api.get('/vendor/me');
    
    // Cache vendor data
    if (result['success'] == true && result['data'] != null) {
      await _api.saveVendorData(result['data']);
    }
    
    return result;
  }
  
  /// Update vendor profile
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> updates) async {
    return await _api.put('/vendor/update', updates);
  }
  
  /// Check if vendor is approved
  Future<String> getApprovalStatus() async {
    final result = await getProfile();
    if (result['success'] == true && result['data'] != null) {
      return result['data']['status'] ?? 'pending';
    }
    return 'pending';
  }
}
