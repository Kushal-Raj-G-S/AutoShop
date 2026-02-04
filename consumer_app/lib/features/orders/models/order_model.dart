class OrderModel {
  final String? id;
  final String userId;
  final List<OrderItem> items;
  final String addressId;
  final DeliveryAddress deliveryAddress;
  final double subtotal;
  final double deliveryFee;
  final double tax;
  final double discount;
  final double totalAmount;
  final String paymentMethod; // 'cod', 'upi', 'card'
  final String paymentStatus; // 'pending', 'completed', 'failed'
  final String orderStatus; // 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
  
  String get status => orderStatus;

  final String? deliveryInstructions;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? deliveredAt;

  OrderModel({
    this.id,
    required this.userId,
    required this.items,
    required this.addressId,
    required this.deliveryAddress,
    required this.subtotal,
    required this.deliveryFee,
    required this.tax,
    required this.discount,
    required this.totalAmount,
    required this.paymentMethod,
    this.paymentStatus = 'pending',
    this.orderStatus = 'pending',
    this.deliveryInstructions,
    this.createdAt,
    this.updatedAt,
    this.deliveredAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id']?.toString(),
      userId: json['userId']?.toString() ?? json['user_id']?.toString() ?? '',
      items:
          (json['items'] as List?)
              ?.map((item) => OrderItem.fromJson(item))
              .toList() ??
          [],
      addressId:
          json['addressId']?.toString() ?? json['address_id']?.toString() ?? '',
      deliveryAddress: DeliveryAddress.fromJson(
        json['deliveryAddress'] ?? json['delivery_address'] ?? {},
      ),
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      deliveryFee:
          (json['deliveryFee'] as num?)?.toDouble() ??
          (json['delivery_fee'] as num?)?.toDouble() ??
          0.0,
      tax: (json['tax'] as num?)?.toDouble() ?? 0.0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      totalAmount:
          (json['totalAmount'] as num?)?.toDouble() ??
          (json['total_amount'] as num?)?.toDouble() ??
          0.0,
      paymentMethod: json['paymentMethod'] ?? json['payment_method'] ?? 'cod',
      paymentStatus:
          json['paymentStatus'] ?? json['payment_status'] ?? 'pending',
      orderStatus: json['orderStatus'] ?? json['order_status'] ?? 'pending',
      deliveryInstructions:
          json['deliveryInstructions'] ?? json['delivery_instructions'],
      createdAt: json['createdAt'] != null || json['created_at'] != null
          ? DateTime.parse(json['createdAt'] ?? json['created_at'])
          : null,
      updatedAt: json['updatedAt'] != null || json['updated_at'] != null
          ? DateTime.parse(json['updatedAt'] ?? json['updated_at'])
          : null,
      deliveredAt: json['deliveredAt'] != null || json['delivered_at'] != null
          ? DateTime.parse(json['deliveredAt'] ?? json['delivered_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'userId': userId,
      'items': items.map((item) => item.toJson()).toList(),
      'addressId': addressId,
      'deliveryAddress': deliveryAddress.toJson(),
      'subtotal': subtotal,
      'deliveryFee': deliveryFee,
      'tax': tax,
      'discount': discount,
      'totalAmount': totalAmount,
      'paymentMethod': paymentMethod,
      'paymentStatus': paymentStatus,
      'orderStatus': orderStatus,
      if (deliveryInstructions != null)
        'deliveryInstructions': deliveryInstructions,
    };
  }

  String get statusText {
    switch (orderStatus) {
      case 'pending':
        return 'Order Placed';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }
}

class OrderItem {
  final String itemId;
  final String name;
  final double price;
  final int quantity;
  final String? imageUrl;

  OrderItem({
    required this.itemId,
    required this.name,
    required this.price,
    required this.quantity,
    this.imageUrl,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      itemId: json['itemId']?.toString() ?? json['item_id']?.toString() ?? '',
      name: json['name'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      quantity: json['quantity'] ?? 0,
      imageUrl: json['imageUrl'] ?? json['image_url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'itemId': itemId,
      'name': name,
      'price': price,
      'quantity': quantity,
      if (imageUrl != null) 'imageUrl': imageUrl,
    };
  }

  double get totalPrice => price * quantity;
}

class DeliveryAddress {
  final String name;
  final String phoneNumber;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String state;
  final String pincode;
  final String landmark;

  DeliveryAddress({
    required this.name,
    required this.phoneNumber,
    required this.addressLine1,
    this.addressLine2,
    required this.city,
    required this.state,
    required this.pincode,
    required this.landmark,
  });

  factory DeliveryAddress.fromJson(Map<String, dynamic> json) {
    return DeliveryAddress(
      name: json['name'] ?? '',
      phoneNumber: json['phoneNumber'] ?? json['phone_number'] ?? '',
      addressLine1: json['addressLine1'] ?? json['address_line1'] ?? '',
      addressLine2: json['addressLine2'] ?? json['address_line2'],
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      pincode: json['pincode'] ?? '',
      landmark: json['landmark'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'phoneNumber': phoneNumber,
      'addressLine1': addressLine1,
      if (addressLine2 != null) 'addressLine2': addressLine2,
      'city': city,
      'state': state,
      'pincode': pincode,
      'landmark': landmark,
    };
  }

  String get fullAddress {
    final parts = [
      addressLine1,
      if (addressLine2 != null && addressLine2!.isNotEmpty) addressLine2,
      landmark,
      city,
      state,
      pincode,
    ];
    return parts.join(', ');
  }
}
