import 'package:flutter/foundation.dart';
import '../../features/address/models/address_model.dart';
import '../api/address_api.dart';

class AddressProvider with ChangeNotifier {
  final AddressApi _addressApi = AddressApi();

  List<AddressModel> _addresses = [];
  bool _isLoading = false;
  String? _error;

  List<AddressModel> get addresses => _addresses;
  bool get isLoading => _isLoading;
  String? get error => _error;

  AddressModel? get defaultAddress {
    try {
      return _addresses.firstWhere((address) => address.isDefault);
    } catch (e) {
      return _addresses.isNotEmpty ? _addresses.first : null;
    }
  }

  Future<void> loadAddresses() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _addressApi.getAddresses();
      if (result['success']) {
        _addresses = result['data'] as List<AddressModel>;
      } else {
        _error = result['message'];
      }
    } catch (e) {
      _error = 'Failed to load addresses: ${e.toString()}';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addAddress(AddressModel address) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _addressApi.createAddress(address);
      if (result['success']) {
        await loadAddresses(); // Reload to get updated list
        return true;
      } else {
        _error = result['message'];
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Failed to add address: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateAddress(AddressModel address) async {
    if (address.id == null) {
      _error = 'Address ID is required for update';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _addressApi.updateAddress(address.id!, address);
      if (result['success']) {
        await loadAddresses(); // Reload to get updated list
        return true;
      } else {
        _error = result['message'];
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Failed to update address: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteAddress(String addressId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _addressApi.deleteAddress(addressId);
      if (result['success']) {
        _addresses.removeWhere((addr) => addr.id == addressId);
        notifyListeners();
        return true;
      } else {
        _error = result['message'];
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Failed to delete address: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> setDefaultAddress(String addressId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _addressApi.setDefaultAddress(addressId);
      if (result['success']) {
        // Update local state
        _addresses = _addresses.map((addr) {
          return addr.copyWith(isDefault: addr.id == addressId);
        }).toList();
        notifyListeners();
        return true;
      } else {
        _error = result['message'];
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Failed to set default address: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
