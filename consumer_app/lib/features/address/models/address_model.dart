class AddressModel {
  final String? id;
  final String userId;
  final String name;
  final String phoneNumber;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String state;
  final String pincode;
  final String landmark;
  final String addressType; // 'home', 'work', 'other'
  final bool isDefault;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  AddressModel({
    this.id,
    required this.userId,
    required this.name,
    required this.phoneNumber,
    required this.addressLine1,
    this.addressLine2,
    required this.city,
    required this.state,
    required this.pincode,
    required this.landmark,
    required this.addressType,
    this.isDefault = false,
    this.createdAt,
    this.updatedAt,
  });

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['id']?.toString(),
      userId: json['userId']?.toString() ?? json['user_id']?.toString() ?? '',
      name: json['name'] ?? '',
      phoneNumber: json['phoneNumber'] ?? json['phone_number'] ?? '',
      addressLine1: json['addressLine1'] ?? json['address_line1'] ?? '',
      addressLine2: json['addressLine2'] ?? json['address_line2'],
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      pincode: json['pincode'] ?? '',
      landmark: json['landmark'] ?? '',
      addressType: json['addressType'] ?? json['address_type'] ?? 'home',
      isDefault: json['isDefault'] ?? json['is_default'] ?? false,
      createdAt: json['createdAt'] != null || json['created_at'] != null
          ? DateTime.parse(json['createdAt'] ?? json['created_at'])
          : null,
      updatedAt: json['updatedAt'] != null || json['updated_at'] != null
          ? DateTime.parse(json['updatedAt'] ?? json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'userId': userId,
      'name': name,
      'phoneNumber': phoneNumber,
      'addressLine1': addressLine1,
      if (addressLine2 != null) 'addressLine2': addressLine2,
      'city': city,
      'state': state,
      'pincode': pincode,
      'landmark': landmark,
      'addressType': addressType,
      'isDefault': isDefault,
    };
  }

  AddressModel copyWith({
    String? id,
    String? userId,
    String? name,
    String? phoneNumber,
    String? addressLine1,
    String? addressLine2,
    String? city,
    String? state,
    String? pincode,
    String? landmark,
    String? addressType,
    bool? isDefault,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return AddressModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      addressLine1: addressLine1 ?? this.addressLine1,
      addressLine2: addressLine2 ?? this.addressLine2,
      city: city ?? this.city,
      state: state ?? this.state,
      pincode: pincode ?? this.pincode,
      landmark: landmark ?? this.landmark,
      addressType: addressType ?? this.addressType,
      isDefault: isDefault ?? this.isDefault,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
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

  String get shortAddress {
    return '$addressLine1, $city - $pincode';
  }
}
