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
            padding: EdgeInsets.all(AppTheme.spaceLarge),
            physics: const BouncingScrollPhysics(),
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
    return Container(
      margin: EdgeInsets.only(bottom: AppTheme.spaceLarge),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusLarge),
        boxShadow: AppTheme.cardShadow,
        border: Border.all(
          color: AppTheme.borderColor.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ItemDetailScreen(item: item),
            ),
          );
        },
        borderRadius: BorderRadius.circular(AppTheme.radiusLarge),
        child: Padding(
          padding: EdgeInsets.all(AppTheme.spaceLarge),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Item Image with Hero animation
              Hero(
                tag: 'item-${item.id}',
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
                  child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: item.imageUrl!,
                          width: 100,
                          height: 100,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(
                            width: 100,
                            height: 100,
                            color: AppTheme.backgroundColor,
                            child: Center(
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppTheme.accentColor,
                              ),
                            ),
                          ),
                          errorWidget: (context, url, error) => Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  AppTheme.primaryColor.withValues(alpha: 0.1),
                                  AppTheme.accentColor.withValues(alpha: 0.1),
                                ],
                              ),
                            ),
                            child: Icon(
                              Icons.broken_image_outlined,
                              color: AppTheme.textSecondary,
                              size: 40,
                            ),
                          ),
                        )
                      : Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppTheme.primaryColor.withValues(alpha: 0.1),
                                AppTheme.accentColor.withValues(alpha: 0.1),
                              ],
                            ),
                          ),
                          child: Icon(
                            Icons.shopping_bag_outlined,
                            color: AppTheme.textSecondary,
                            size: 40,
                          ),
                        ),
                ),
              ),
              SizedBox(width: AppTheme.spaceLarge),

              // Item Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Item Name
                        Text(
                          item.name,
                          style: AppTheme.heading3.copyWith(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        SizedBox(height: AppTheme.spaceSmall),

                        // Stock Status Badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: item.isInStock
                                ? AppTheme.successColor.withValues(alpha: 0.1)
                                : AppTheme.errorColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: item.isInStock
                                  ? AppTheme.successColor
                                  : AppTheme.errorColor,
                              width: 1,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                item.isInStock
                                    ? Icons.check_circle
                                    : Icons.cancel,
                                size: 14,
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
                        ),
                      ],
                    ),
                    SizedBox(height: AppTheme.spaceMedium),

                    // Price
                    Text(
                      '₹${item.price.toStringAsFixed(2)}',
                      style: AppTheme.priceStyle.copyWith(
                        fontSize: 20,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  ],
                ),
              ),

              // Arrow Icon
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 18,
                color: AppTheme.textSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
