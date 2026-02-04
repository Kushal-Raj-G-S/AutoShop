import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class ItemsApi {
  static String get baseUrl => AppConfig.baseUrl;

  /// Fetch items by category ID from real backend
  Future<List<Map<String, dynamic>>> getItemsByCategory(int categoryId) async {
    try {
      String url = '$baseUrl/items';
      if (categoryId > 0) {
        url += '?categoryId=$categoryId';
      }

      final response = await http.get(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonResponse = json.decode(response.body);

        if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
          final List<dynamic> items =
              jsonResponse['data']['items'] ?? jsonResponse['data'];
          return items.cast<Map<String, dynamic>>();
        }
      }
      return [];
    } catch (e) {
      debugPrint('ItemsApi getItemsByCategory Error: $e');
      return [];
    }
  }

  /// Fetch all items from real backend
  Future<List<Map<String, dynamic>>> getAllItems() async {
    return getItemsByCategory(0); // 0 = no filter, get all
  }

  /// Search items by query from real backend
  Future<List<Map<String, dynamic>>> searchItems(String query) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/items?q=${Uri.encodeComponent(query)}'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonResponse = json.decode(response.body);

        if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
          final List<dynamic> items =
              jsonResponse['data']['items'] ?? jsonResponse['data'];
          return items.cast<Map<String, dynamic>>();
        }
      }
      return [];
    } catch (e) {
      debugPrint('ItemsApi searchItems Error: $e');
      return [];
    }
  }
}
