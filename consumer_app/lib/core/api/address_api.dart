import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../../features/address/models/address_model.dart';
import 'api_service.dart';

class AddressApi {
  static String get baseUrl => AppConfig.baseUrl;
  final ApiService _apiService = ApiService();

  // Get all addresses for the logged-in user
  Future<Map<String, dynamic>> getAddresses() async {
    try {
      final token = await _apiService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.get(
        Uri.parse('$baseUrl/addresses'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final List<AddressModel> addresses = (data['data'] as List)
            .map((json) => AddressModel.fromJson(json))
            .toList();
        return {'success': true, 'data': addresses};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to fetch addresses',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Get a single address by ID
  Future<Map<String, dynamic>> getAddressById(String addressId) async {
    try {
      final token = await _apiService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.get(
        Uri.parse('$baseUrl/addresses/$addressId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final address = AddressModel.fromJson(data['data']);
        return {'success': true, 'data': address};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to fetch address',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Create a new address
  Future<Map<String, dynamic>> createAddress(AddressModel address) async {
    try {
      final token = await _apiService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.post(
        Uri.parse('$baseUrl/addresses'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(address.toJson()),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': data['message'] ?? 'Address created successfully',
          'data': AddressModel.fromJson(data['data']),
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to create address',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Update an existing address
  Future<Map<String, dynamic>> updateAddress(
    String addressId,
    AddressModel address,
  ) async {
    try {
      final token = await _apiService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.put(
        Uri.parse('$baseUrl/addresses/$addressId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(address.toJson()),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Address updated successfully',
          'data': AddressModel.fromJson(data['data']),
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to update address',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Delete an address
  Future<Map<String, dynamic>> deleteAddress(String addressId) async {
    try {
      final token = await _apiService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.delete(
        Uri.parse('$baseUrl/addresses/$addressId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Address deleted successfully',
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to delete address',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Set default address
  Future<Map<String, dynamic>> setDefaultAddress(String addressId) async {
    try {
      final token = await _apiService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.patch(
        Uri.parse('$baseUrl/addresses/$addressId/default'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Default address updated successfully',
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to set default address',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }
}
