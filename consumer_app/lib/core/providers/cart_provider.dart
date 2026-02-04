import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../features/items/models/item_model.dart';

class CartItem {
  final ItemModel item;
  int quantity;

  CartItem({required this.item, this.quantity = 1});

  double get totalPrice => item.price * quantity;

  Map<String, dynamic> toJson() => {
    'item': {
      'id': item.id,
      'name': item.name,
      'price': item.price,
      'imageUrl': item.imageUrl,
      'categoryId': item.categoryId,
      'stock': item.stock,
    },
    'quantity': quantity,
  };

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      item: ItemModel(
        id: json['item']['id'],
        categoryId: json['item']['categoryId'],
        name: json['item']['name'],
        price: (json['item']['price'] as num).toDouble(),
        imageUrl: json['item']['imageUrl'],
        stock: json['item']['stock'] ?? 0,
        isActive: true,
      ),
      quantity: json['quantity'],
    );
  }
}

class CartProvider with ChangeNotifier {
  final List<CartItem> _items = [];
  static const String _storageKey = 'cart_items';

  List<CartItem> get items => _items;

  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  double get itemTotal =>
      _items.fold(0, (sum, item) => sum + item.totalPrice);

  double get totalAmount => itemTotal; // Alias for backward compatibility if needed

  double get deliveryFee => itemTotal > 499 ? 0 : 40;

  double get tax => itemTotal * 0.05;

  double get grandTotal => itemTotal + deliveryFee + tax;

  bool get isEmpty => _items.isEmpty;

  // Load cart from storage
  Future<void> loadCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartJson = prefs.getString(_storageKey);
      if (cartJson != null) {
        final List<dynamic> cartList = json.decode(cartJson);
        _items.clear();
        _items.addAll(cartList.map((item) => CartItem.fromJson(item)));
        notifyListeners();
      }
    } catch (e) {
      // Error loading cart - silent fail to not disrupt user experience
    }
  }

  // Save cart to storage
  Future<void> _saveCart() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cartJson = json.encode(
        _items.map((item) => item.toJson()).toList(),
      );
      await prefs.setString(_storageKey, cartJson);
    } catch (e) {
      // Error saving cart - silent fail
    }
  }

  // Add item to cart
  void addItem(ItemModel item, {int quantity = 1}) {
    final existingIndex = _items.indexWhere(
      (cartItem) => cartItem.item.id == item.id,
    );

    if (existingIndex >= 0) {
      _items[existingIndex].quantity += quantity;
    } else {
      _items.add(CartItem(item: item, quantity: quantity));
    }

    _saveCart();
    notifyListeners();
  }

  // Remove item from cart
  void removeItem(int itemId) {
    _items.removeWhere((cartItem) => cartItem.item.id == itemId);
    _saveCart();
    notifyListeners();
  }

  // Update quantity
  void updateQuantity(int itemId, int newQuantity) {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    final index = _items.indexWhere((cartItem) => cartItem.item.id == itemId);
    if (index >= 0) {
      _items[index].quantity = newQuantity;
      _saveCart();
      notifyListeners();
    }
  }

  // Clear cart
  void clearCart() {
    _items.clear();
    _saveCart();
    notifyListeners();
  }

  // Check if item is in cart
  bool isInCart(int itemId) {
    return _items.any((cartItem) => cartItem.item.id == itemId);
  }

  // Get item quantity in cart
  int getItemQuantity(int itemId) {
    final cartItem = _items.firstWhere(
      (cartItem) => cartItem.item.id == itemId,
      orElse: () => CartItem(
        item: ItemModel(
          id: 0,
          categoryId: 0,
          name: '',
          price: 0,
          stock: 0,
          isActive: true,
        ),
        quantity: 0,
      ),
    );
    return cartItem.quantity;
  }
}
