import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/providers/address_provider.dart';
import '../../core/api/api_service.dart';
import 'models/address_model.dart';

class AddressFormScreen extends StatefulWidget {
  final AddressModel? address;

  const AddressFormScreen({super.key, this.address});

  @override
  State<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends State<AddressFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _apiService = ApiService();

  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _addressLine1Controller;
  late TextEditingController _addressLine2Controller;
  late TextEditingController _cityController;
  late TextEditingController _stateController;
  late TextEditingController _pincodeController;
  late TextEditingController _landmarkController;

  String _addressType = 'home';
  bool _isDefault = false;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.address?.name ?? '');
    _phoneController = TextEditingController(
      text: widget.address?.phoneNumber ?? '',
    );
    _addressLine1Controller = TextEditingController(
      text: widget.address?.addressLine1 ?? '',
    );
    _addressLine2Controller = TextEditingController(
      text: widget.address?.addressLine2 ?? '',
    );
    _cityController = TextEditingController(text: widget.address?.city ?? '');
    _stateController = TextEditingController(text: widget.address?.state ?? '');
    _pincodeController = TextEditingController(
      text: widget.address?.pincode ?? '',
    );
    _landmarkController = TextEditingController(
      text: widget.address?.landmark ?? '',
    );

    if (widget.address != null) {
      _addressType = widget.address!.addressType;
      _isDefault = widget.address!.isDefault;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressLine1Controller.dispose();
    _addressLine2Controller.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    _landmarkController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(
          widget.address == null ? 'Add New Address' : 'Edit Address',
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  _buildSectionTitle('Contact Details'),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _nameController,
                    label: 'Full Name',
                    icon: Icons.person_outline,
                    validator: (v) =>
                        v!.trim().length < 2 ? 'Enter a valid name' : null,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _phoneController,
                    label: 'Phone Number',
                    icon: Icons.phone_outlined,
                    isPhone: true,
                    validator: (v) =>
                        v!.length != 10 ? 'Enter valid 10-digit number' : null,
                  ),

                  const SizedBox(height: 24),
                  _buildSectionTitle('Address Details'),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _addressLine1Controller,
                    label: 'House No., Building Name',
                    icon: Icons.home_outlined,
                    validator: (v) => v!.trim().length < 3 ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _addressLine2Controller,
                    label: 'Road Name, Area (Optional)',
                    icon: Icons.map_outlined,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _landmarkController,
                    label: 'Landmark',
                    icon: Icons.flag_outlined,
                    validator: (v) => v!.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                          controller: _cityController,
                          label: 'City',
                          icon: Icons.location_city_outlined,
                          validator: (v) =>
                              v!.trim().isEmpty ? 'Required' : null,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildTextField(
                          controller: _stateController,
                          label: 'State',
                          icon: Icons.map,
                          validator: (v) =>
                              v!.trim().isEmpty ? 'Required' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _pincodeController,
                    label: 'Pincode',
                    icon: Icons.pin_drop_outlined,
                    isNumber: true,
                    maxLength: 6,
                    validator: (v) => v!.length != 6 ? 'Invalid Pincode' : null,
                  ),

                  const SizedBox(height: 24),
                  _buildSectionTitle('Save Address As'),
                  const SizedBox(height: 12),
                  _buildAddressTypeSelector(),

                  const SizedBox(height: 24),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: SwitchListTile(
                      title: const Text('Make this my default address'),
                      subtitle: const Text('Use for all future orders'),
                      value: _isDefault,
                      onChanged: (val) => setState(() => _isDefault = val),
                      activeThumbColor: Theme.of(context).primaryColor,
                    ),
                  ),
                ],
              ),
            ),
            _buildBottomBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: Colors.black87,
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool isPhone = false,
    bool isNumber = false,
    int? maxLength,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: isPhone || isNumber
          ? TextInputType.number
          : TextInputType.text,
      inputFormatters: [
        if (isPhone || isNumber) FilteringTextInputFormatter.digitsOnly,
        if (maxLength != null) LengthLimitingTextInputFormatter(maxLength),
      ],
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: Colors.grey[600]),
        prefixText: isPhone ? '+91 ' : null,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: Theme.of(context).primaryColor,
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red),
        ),
      ),
    );
  }

  Widget _buildAddressTypeSelector() {
    return Row(
      children: [
        _buildTypeChip('home', 'Home', Icons.home),
        const SizedBox(width: 12),
        _buildTypeChip('work', 'Work', Icons.work),
        const SizedBox(width: 12),
        _buildTypeChip('other', 'Other', Icons.location_on),
      ],
    );
  }

  Widget _buildTypeChip(String type, String label, IconData icon) {
    final isSelected = _addressType == type;
    final primaryColor = Theme.of(context).primaryColor;

    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _addressType = type),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? primaryColor.withValues(alpha: 0.1)
                : Colors.white,
            border: Border.all(
              color: isSelected ? primaryColor : Colors.grey.shade300,
              width: isSelected ? 2 : 1,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: isSelected ? primaryColor : Colors.grey[600],
                size: 20,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? primaryColor : Colors.grey[600],
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _saveAddress,
            style: ElevatedButton.styleFrom(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: _isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : const Text(
                    'Save Address',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
          ),
        ),
      ),
    );
  }

  Future<void> _saveAddress() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      final provider = context.read<AddressProvider>();
      final userData = await _apiService.getUserData();

      if (userData == null) throw Exception('User not authenticated');
      final userId = userData['id']?.toString();
      if (userId == null || userId.isEmpty) {
        throw Exception('User ID not found');
      }

      final address = AddressModel(
        id: widget.address?.id,
        userId: userId,
        name: _nameController.text.trim(),
        phoneNumber: _phoneController.text.trim(),
        addressLine1: _addressLine1Controller.text.trim(),
        addressLine2: _addressLine2Controller.text.trim().isEmpty
            ? null
            : _addressLine2Controller.text.trim(),
        city: _cityController.text.trim(),
        state: _stateController.text.trim(),
        pincode: _pincodeController.text.trim(),
        landmark: _landmarkController.text.trim(),
        addressType: _addressType,
        isDefault: _isDefault,
      );

      final success = widget.address == null
          ? await provider.addAddress(address)
          : await provider.updateAddress(address);

      if (!mounted) return;
      setState(() => _isSubmitting = false);

      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.address == null ? 'Address added' : 'Address updated',
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.error ?? 'Failed to save'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }
}
