import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/providers/cart_provider.dart';
import '../../core/providers/address_provider.dart';
import '../../core/api/api_service.dart';
import '../../core/api/orders_api.dart';
import '../address/address_selection_screen.dart';
import '../address/models/address_model.dart';
import '../orders/models/order_model.dart';
import 'order_success_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final ApiService _apiService = ApiService();
  final OrdersApi _ordersApi = OrdersApi();
  final TextEditingController _instructionsController = TextEditingController();

  AddressModel? _selectedAddress;
  String _selectedPaymentMethod = 'cod';
  bool _isPlacingOrder = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final addressProvider = context.read<AddressProvider>();
      setState(() {
        _selectedAddress = addressProvider.defaultAddress;
      });
    });
  }

  @override
  void dispose() {
    _instructionsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Checkout'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        centerTitle: true,
      ),
      body: Consumer<CartProvider>(
        builder: (context, cart, child) {
          if (cart.isEmpty) {
            return _buildEmptyCart();
          }

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSectionTitle('Delivery Address'),
                      const SizedBox(height: 12),
                      _selectedAddress != null
                          ? _buildAddressCard()
                          : _buildAddAddressCard(),

                      const SizedBox(height: 24),
                      _buildSectionTitle('Payment Method'),
                      const SizedBox(height: 12),
                      _buildPaymentMethods(),

                      const SizedBox(height: 24),
                      _buildSectionTitle('Delivery Options'),
                      const SizedBox(height: 12),
                      _buildInstructionsField(),

                      const SizedBox(height: 24),
                      _buildSectionTitle('Order Summary'),
                      const SizedBox(height: 12),
                      _buildOrderSummary(cart),

                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
              _buildBottomBar(cart),
            ],
          );
        },
      ),
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.shopping_cart_outlined,
              size: 60,
              color: Colors.grey[400],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Your cart is empty',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            child: const Text('Continue Shopping'),
          ),
        ],
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

  Widget _buildAddressCard() {
    return Container(
      decoration: _cardDecoration(),
      child: InkWell(
        onTap: _selectAddress,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.location_on,
                  color: Theme.of(context).primaryColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          _selectedAddress!.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            _selectedAddress!.addressType.toUpperCase(),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey[700],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _selectedAddress!.fullAddress,
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 13,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _selectedAddress!.phoneNumber,
                      style: TextStyle(
                        color: Colors.grey[800],
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.grey[400]),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAddAddressCard() {
    return Container(
      decoration: _cardDecoration(borderColor: Theme.of(context).primaryColor),
      child: InkWell(
        onTap: _selectAddress,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.add_location,
                  color: Theme.of(context).primaryColor,
                ),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Add Delivery Address',
                    style: TextStyle(
                      color: Theme.of(context).primaryColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Please choose a destination',
                    style: TextStyle(color: Colors.grey[500], fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentMethods() {
    return Container(
      decoration: _cardDecoration(),
      child: Column(
        children: [
          _buildPaymentOption(
            'cod',
            'Cash on Delivery',
            Icons.money,
            'Pay when order arrives',
          ),
          const Divider(height: 1, indent: 56),
          _buildPaymentOption(
            'upi',
            'UPI Payment',
            Icons.qr_code_2,
            'Google Pay, PhonePe, Paytm',
          ),
          const Divider(height: 1, indent: 56),
          _buildPaymentOption(
            'card',
            'Credit/Debit Card',
            Icons.credit_card,
            'Visa, Mastercard, RuPay',
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentOption(
    String value,
    String title,
    IconData icon,
    String subtitle,
  ) {
    final isSelected = _selectedPaymentMethod == value;
    return RadioListTile<String>(
      value: value,
      toggleable: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(fontSize: 12, color: Colors.grey[500]),
      ),
      secondary: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isSelected
              ? Theme.of(context).primaryColor.withValues(alpha: 0.1)
              : Colors.grey[100],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          color: isSelected ? Theme.of(context).primaryColor : Colors.grey[600],
          size: 20,
        ),
      ),
    );
  }

  Widget _buildInstructionsField() {
    return Container(
      decoration: _cardDecoration(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: TextField(
        controller: _instructionsController,
        decoration: const InputDecoration(
          hintText: 'Add instructions (e.g., Leave at door)',
          border: InputBorder.none,
          icon: Icon(Icons.notes, color: Colors.grey),
        ),
        maxLines: 2,
        minLines: 1,
      ),
    );
  }

  Widget _buildOrderSummary(CartProvider cart) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        children: [
          _buildSummaryRow('Subtotal', cart.itemTotal),
          const SizedBox(height: 12),
          _buildSummaryRow('Delivery Fee', cart.deliveryFee),
          const SizedBox(height: 12),
          _buildSummaryRow('Tax (5%)', cart.tax),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(height: 1),
          ),
          _buildSummaryRow('Total Amount', cart.grandTotal, isTotal: true),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, double amount, {bool isTotal = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            color: isTotal ? Colors.black : Colors.grey[600],
          ),
        ),
        Text(
          '₹${amount.toStringAsFixed(2)}',
          style: TextStyle(
            fontSize: isTotal ? 18 : 14,
            fontWeight: isTotal ? FontWeight.bold : FontWeight.w500,
            color: isTotal ? Theme.of(context).primaryColor : Colors.black87,
          ),
        ),
      ],
    );
  }

  BoxDecoration _cardDecoration({Color? borderColor}) {
    return BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: borderColor != null ? Border.all(color: borderColor) : null,
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.05),
          blurRadius: 10,
          offset: const Offset(0, 4),
        ),
      ],
    );
  }

  Widget _buildBottomBar(CartProvider cart) {
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
          height: 56,
          child: ElevatedButton(
            onPressed: _selectedAddress != null && !_isPlacingOrder
                ? _placeOrder
                : null,
            style: ElevatedButton.styleFrom(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 4,
              shadowColor: Theme.of(
                context,
              ).primaryColor.withValues(alpha: 0.4),
            ),
            child: _isPlacingOrder
                ? const SizedBox(
                    height: 24,
                    width: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Place Order',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '₹${cart.grandTotal.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Future<void> _selectAddress() async {
    final result = await Navigator.push<AddressModel>(
      context,
      MaterialPageRoute(
        builder: (context) =>
            const AddressSelectionScreen(isSelectionMode: true),
      ),
    );

    if (result != null) {
      setState(() {
        _selectedAddress = result;
      });
    }
  }

  Future<void> _placeOrder() async {
    if (_selectedAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a delivery address'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isPlacingOrder = true;
    });

    try {
      final cart = context.read<CartProvider>();
      final userData = await _apiService.getUserData();
      if (userData == null) {
        throw Exception('User not authenticated');
      }

      final order = OrderModel(
        userId: userData['id'].toString(),
        items: cart.items
            .map(
              (cartItem) => OrderItem(
                itemId: cartItem.item.id.toString(),
                name: cartItem.item.name,
                price: cartItem.item.price,
                quantity: cartItem.quantity,
                imageUrl: cartItem.item.imageUrl,
              ),
            )
            .toList(),
        addressId: _selectedAddress!.id!,
        deliveryAddress: DeliveryAddress(
          name: _selectedAddress!.name,
          phoneNumber: _selectedAddress!.phoneNumber,
          addressLine1: _selectedAddress!.addressLine1,
          addressLine2: _selectedAddress!.addressLine2,
          city: _selectedAddress!.city,
          state: _selectedAddress!.state,
          pincode: _selectedAddress!.pincode,
          landmark: _selectedAddress!.landmark,
        ),
        subtotal: cart.itemTotal,
        deliveryFee: cart.deliveryFee,
        tax: cart.tax,
        discount: 0,
        totalAmount: cart.grandTotal,
        paymentMethod: _selectedPaymentMethod,
        deliveryInstructions: _instructionsController.text.trim().isEmpty
            ? null
            : _instructionsController.text.trim(),
      );

      final result = await _ordersApi.createOrder(order);

      if (!mounted) return;

      setState(() {
        _isPlacingOrder = false;
      });

      if (result['success']) {
        cart.clearCart();
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => OrderSuccessScreen(order: result['data']),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Failed to place order'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _isPlacingOrder = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
