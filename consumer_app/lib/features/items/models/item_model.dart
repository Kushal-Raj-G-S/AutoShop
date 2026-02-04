class ItemModel {
  final int id;
  final String name;
  final String? description;
  final double price;
  final int stock;
  final String? imageUrl;
  final int categoryId;
  final bool isActive;

  ItemModel({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.stock,
    this.imageUrl,
    required this.categoryId,
    required this.isActive,
  });

  /// Check if item is in stock
  bool get isInStock => stock > 0;

  /// Get stock status text
  String get stockStatus {
    if (stock > 10) {
      return 'In Stock';
    } else if (stock > 0) {
      return 'Low Stock ($stock left)';
    } else {
      return 'Out of Stock';
    }
  }

  /// Factory constructor to create ItemModel from JSON
  factory ItemModel.fromJson(Map<String, dynamic> json) {
    return ItemModel(
      id: _parseInt(json['id']),
      name: json['name']?.toString() ?? 'Unknown Item',
      description: json['description']?.toString(),
      price: _parseDouble(json['price']),
      stock: _parseInt(json['stock']),
      imageUrl: json['imageUrl']?.toString() ?? json['image_url']?.toString(),
      categoryId: _parseInt(json['categoryId']) != 0
          ? _parseInt(json['categoryId'])
          : _parseInt(json['category_id']),
      isActive: _parseBool(json['isActive'] ?? json['is_active']),
    );
  }

  /// Helper to parse int from dynamic (handles both String and num, with null safety)
  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) {
      if (value.isEmpty) return 0;
      return int.tryParse(value) ?? 0;
    }
    if (value is num) return value.toInt();
    return 0;
  }

  /// Helper to parse double from dynamic (handles both String and num, with null safety)
  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is String) {
      if (value.isEmpty) return 0.0;
      return double.tryParse(value) ?? 0.0;
    }
    if (value is num) return value.toDouble();
    return 0.0;
  }

  /// Helper to parse bool from dynamic (handles bool, String, int, with null safety)
  static bool _parseBool(dynamic value) {
    if (value == null) return true;
    if (value is bool) return value;
    if (value is String) {
      final lower = value.toLowerCase();
      if (lower == 'true' || lower == '1') return true;
      if (lower == 'false' || lower == '0') return false;
      return true; // Default to true if unclear
    }
    if (value is int) return value == 1;
    return true; // Default to true
  }

  /// Convert ItemModel to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'stock': stock,
      'imageUrl': imageUrl,
      'categoryId': categoryId,
      'isActive': isActive,
    };
  }
}
