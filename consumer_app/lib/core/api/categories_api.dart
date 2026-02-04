import 'dart:convert';
import 'package:flutter/foundation.dart' hide Category;
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/category.dart';

class CategoriesApi {
  static String get baseUrl => AppConfig.baseUrl;

  /// Fetch all categories from the real backend
  Future<List<Category>> getCategories() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/categories'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonResponse = json.decode(response.body);

        if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
          final List<dynamic> categoriesJson =
              jsonResponse['data']['categories'] ?? jsonResponse['data'];
          return categoriesJson.map((json) => Category.fromJson(json)).toList();
        }
      }

      // Fallback: return empty list if API fails
      return [];
    } catch (e) {
      debugPrint('CategoriesApi Error: $e');
      return [];
    }
  }
}
