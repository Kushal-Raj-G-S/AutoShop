import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/providers/address_provider.dart';
import 'address_list_screen.dart';

class AddressSelectionScreen extends StatefulWidget {
  final bool isSelectionMode; // true when selecting for checkout

  const AddressSelectionScreen({super.key, this.isSelectionMode = false});

  @override
  State<AddressSelectionScreen> createState() => _AddressSelectionScreenState();
}

class _AddressSelectionScreenState extends State<AddressSelectionScreen> {
  String? selectedAddressId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<AddressProvider>();
      provider.loadAddresses();
      // Pre-select default address
      if (provider.defaultAddress != null) {
        setState(() {
          selectedAddressId = provider.defaultAddress!.id;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.isSelectionMode ? 'Select Delivery Address' : 'My Addresses',
        ),
        elevation: 0,
      ),
      body: Consumer<AddressProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.addresses.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.addresses.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.location_off, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'No addresses found',
                    style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const AddressListScreen(),
                        ),
                      );
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('Add Address'),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: provider.addresses.length,
                  itemBuilder: (context, index) {
                    final address = provider.addresses[index];
                    final isSelected =
                        widget.isSelectionMode &&
                        selectedAddressId == address.id;

                    return InkWell(
                      onTap: widget.isSelectionMode
                          ? () {
                              setState(() {
                                selectedAddressId = address.id;
                              });
                            }
                          : null,
                      child: Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        elevation: isSelected ? 4 : 1,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                          side: BorderSide(
                            color: isSelected
                                ? Theme.of(context).primaryColor
                                : Colors.transparent,
                            width: 2,
                          ),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  if (widget.isSelectionMode)
                                    Radio<String>(
                                      value: address.id!,
                                      toggleable: true,
                                    ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: address.addressType == 'home'
                                          ? Colors.green.shade100
                                          : address.addressType == 'work'
                                          ? Colors.blue.shade100
                                          : Colors.orange.shade100,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      address.addressType.toUpperCase(),
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: address.addressType == 'home'
                                            ? Colors.green.shade800
                                            : address.addressType == 'work'
                                            ? Colors.blue.shade800
                                            : Colors.orange.shade800,
                                      ),
                                    ),
                                  ),
                                  if (address.isDefault) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.amber.shade100,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(
                                            Icons.star,
                                            size: 14,
                                            color: Colors.amber.shade800,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            'DEFAULT',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.amber.shade800,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                address.name,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                address.phoneNumber,
                                style: TextStyle(color: Colors.grey[600]),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                address.fullAddress,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[700],
                                  height: 1.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              if (widget.isSelectionMode && selectedAddressId != null)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 4,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        final selectedAddress = provider.addresses.firstWhere(
                          (addr) => addr.id == selectedAddressId,
                        );
                        Navigator.pop(context, selectedAddress);
                      },
                      style: ElevatedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'Deliver to this Address',
                        style: TextStyle(fontSize: 16),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
      floatingActionButton: !widget.isSelectionMode
          ? FloatingActionButton.extended(
              onPressed: () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const AddressListScreen(),
                  ),
                );
              },
              icon: const Icon(Icons.add),
              label: const Text('Add Address'),
            )
          : null,
    );
  }
}
