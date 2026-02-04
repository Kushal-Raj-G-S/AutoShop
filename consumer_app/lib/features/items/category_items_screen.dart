import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:badges/badges.dart' as badges;
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/api/items_api.dart';
import '../../core/theme/app_theme.dart';
import '../../core/providers/cart_provider.dart';
import 'models/item_model.dart';
import 'item_detail_screen.dart';

class CategoryItemsScreen extends StatefulWidget {
  final int categoryId;
  final String categoryName;

  const CategoryItemsScreen({
    super.key,
    required this.categoryId,
    required this.categoryName,
  });

  @override
  State<CategoryItemsScreen> createState() => _CategoryItemsScreenState();
}

class _CategoryItemsScreenState extends State<CategoryItemsScreen> {
  final ItemsApi _itemsApi = ItemsApi();
  late Future<List<ItemModel>> _itemsFuture;

  @override
  void initState() {
    super.initState();
    _loadItems();
  }

  void _loadItems() {
    setState(() {
      _itemsFuture = _fetchItems();
    });
  }

  Future<List<ItemModel>> _fetchItems() async {
    try {
      final itemsData = await _itemsApi.getItemsByCategory(widget.categoryId);
      return itemsData.map((json) => ItemModel.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to load items: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.categoryName),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          // Cart Icon with Badge
          Consumer<CartProvider>(
            builder: (context, cart, child) {
              return badges.Badge(
                badgeContent: Text(
                  '${cart.itemCount}',
                  style: const TextStyle(color: Colors.white, fontSize: 10),
                ),
                showBadge: cart.itemCount > 0,
                position: badges.BadgePosition.topEnd(top: 0, end: 3),
                child: IconButton(
                  icon: const Icon(Icons.shopping_cart),
                  onPressed: () {
                    // Cart is accessible via bottom navigation
                  },
                ),
              );
            },
          ),
        ],
      ),
      body: FutureBuilder<List<ItemModel>>(
        future: _itemsFuture,
        builder: (context, snapshot) {
          // Loading state
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: AppTheme.primaryColor),
                  SizedBox(height: AppTheme.spaceMedium),
                  Text('Loading items...', style: AppTheme.bodyMedium),
                ],
              ),
            );
          }

          // Error state
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: EdgeInsets.all(AppTheme.spaceLarge),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 64,
                      color: AppTheme.errorColor,
                    ),
                    SizedBox(height: AppTheme.spaceMedium),
                    Text(
                      'Failed to load items',
                      style: AppTheme.heading3,
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: AppTheme.spaceSmall),
                    Text(
                      snapshot.error.toString(),
                      style: AppTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: AppTheme.spaceLarge),
                    ElevatedButton.icon(
                      onPressed: _loadItems,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          // Empty state
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return Center(
              child: Padding(
                padding: EdgeInsets.all(AppTheme.spaceLarge),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.inventory_2_outlined,
                      size: 80,
                      color: AppTheme.textSecondary,
                    ),
                    SizedBox(height: AppTheme.spaceMedium),
                    Text(
                      'No items available',
                      style: AppTheme.heading3,
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: AppTheme.spaceSmall),
                    Text(
                      'No items found in this category',
                      style: AppTheme.bodyMedium.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          // Success state - display items
          final items = snapshot.data!;
          return ListView.builder(
            padding: EdgeInsets.all(AppTheme.spaceMedium),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final item = items[index];
              return _buildItemCard(item);
            },
          );
        },
      ),
    );
  }

  Widget _buildItemCard(ItemModel item) {
    return Card(
      margin: EdgeInsets.only(bottom: AppTheme.spaceMedium),
      elevation: AppTheme.elevationLow,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
      ),
      child: InkWell(
        onTap: () {
          // Navigate to item details screen
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ItemDetailScreen(item: item),
            ),
          );
        },
        borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
        child: Padding(
          padding: EdgeInsets.all(AppTheme.spaceMedium),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Item Image
              ClipRRect(
                borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: item.imageUrl!,
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          width: 80,
                          height: 80,
                          color: AppTheme.surfaceColor,
                          child: Center(
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppTheme.primaryColor,
                            ),
                          ),
                        ),
                        errorWidget: (context, url, error) => Container(
                          width: 80,
                          height: 80,
                          color: AppTheme.surfaceColor,
                          child: Icon(
                            Icons.broken_image,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      )
                    : Container(
                        width: 80,
                        height: 80,
                        color: AppTheme.surfaceColor,
                        child: Icon(
                          Icons.image_not_supported,
                          color: AppTheme.textSecondary,
                        ),
                      ),
              ),
              SizedBox(width: AppTheme.spaceMedium),

              // Item Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Item Name
                    Text(
                      item.name,
                      style: AppTheme.bodyLarge.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: AppTheme.spaceXSmall),

                    // Price
                    Text(
                      '₹${item.price.toStringAsFixed(2)}',
                      style: AppTheme.heading3.copyWith(
                        color: AppTheme.primaryColor,
                      ),
                    ),
                    SizedBox(height: AppTheme.spaceXSmall),

                    // Stock Status
                    Row(
                      children: [
                        Icon(
                          item.isInStock ? Icons.check_circle : Icons.cancel,
                          size: 16,
                          color: item.isInStock
                              ? AppTheme.successColor
                              : AppTheme.errorColor,
                        ),
                        SizedBox(width: AppTheme.spaceXSmall),
                        Text(
                          item.stockStatus,
                          style: AppTheme.bodySmall.copyWith(
                            color: item.isInStock
                                ? AppTheme.successColor
                                : AppTheme.errorColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Arrow Icon
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: AppTheme.textSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
