import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../../features/orders/models/order_model.dart';
import 'api_service.dart';

class OrdersApi {
  static String get baseUrl => AppConfig.baseUrl;
  final ApiService _apiService = ApiService();

  // Create new order
  Future<Map<String, dynamic>> createOrder(OrderModel order) async {
    try {
      final token = await _apiService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.post(
        Uri.parse('$baseUrl/orders'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(order.toJson()),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': data['message'] ?? 'Order placed successfully',
          'data': OrderModel.fromJson(data['data']),
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to create order',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Get all orders for user
  Future<Map<String, dynamic>> getOrders() async {
    try {
      final token = await _apiService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.get(
        Uri.parse('$baseUrl/orders'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final List<OrderModel> orders = (data['data'] as List? ?? [])
            .map((json) => OrderModel.fromJson(json))
            .toList();
        return {'success': true, 'data': orders};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to fetch orders',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Get single order by ID
  Future<Map<String, dynamic>> getOrderById(String orderId) async {
    try {
      final token = await _apiService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.get(
        Uri.parse('$baseUrl/orders/$orderId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final order = OrderModel.fromJson(data['data']);
        return {'success': true, 'data': order};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to fetch order',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Cancel order
  Future<Map<String, dynamic>> cancelOrder(String orderId) async {
    try {
      final token = await _apiService.getToken();
      if (token == null) {
        return {'success': false, 'message': 'Not authenticated'};
      }

      final response = await http.patch(
        Uri.parse('$baseUrl/orders/$orderId/cancel'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'Order cancelled successfully',
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to cancel order',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }
}
