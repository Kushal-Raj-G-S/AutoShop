import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../../core/providers/cart_provider.dart';
import '../../core/theme/app_theme.dart';
import 'models/item_model.dart';
import '../../core/api/items_api.dart';

class ItemDetailScreen extends StatefulWidget {
  final ItemModel item;

  const ItemDetailScreen({super.key, required this.item});

  @override
  State<ItemDetailScreen> createState() => _ItemDetailScreenState();
}

class _ItemDetailScreenState extends State<ItemDetailScreen> {
  int _quantity = 1;
  final ItemsApi _itemsApi = ItemsApi();
  List<ItemModel> _similarItems = [];

  @override
  void initState() {
    super.initState();
    _loadSimilarItems();
  }

  Future<void> _loadSimilarItems() async {
    try {
      // For similar products, we could filter by category.
      // For now, fetching all and taking a few excluding current.
      final itemsMap = await _itemsApi.getAllItems();
      final allItems = itemsMap.map((e) => ItemModel.fromJson(e)).toList();

      if (mounted) {
        setState(() {
          _similarItems = allItems
              .where(
                (i) =>
                    i.id != widget.item.id &&
                    i.categoryId == widget.item.categoryId,
              )
              .take(5)
              .toList();
        });
      }
    } catch (e) {
      if (mounted) setState(() {});
    }
  }

  void _incrementQuantity() {
    if (_quantity < widget.item.stock) {
      setState(() => _quantity++);
    }
  }

  void _decrementQuantity() {
    if (_quantity > 1) {
      setState(() => _quantity--);
    }
  }

  void _addToCart() {
    final cart = Provider.of<CartProvider>(context, listen: false);
    cart.addItem(widget.item, quantity: _quantity);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${widget.item.name} added to cart'),
        backgroundColor: AppTheme.successColor,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isInStock = widget.item.stock > 0;

    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          // App Bar with Image
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: AppTheme.primaryColor,
            flexibleSpace: FlexibleSpaceBar(
              background: Hero(
                tag: 'item-${widget.item.id}',
                child: CachedNetworkImage(
                  imageUrl: widget.item.imageUrl ?? '',
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    color: AppTheme.surfaceColor,
                    child: Center(
                      child: CircularProgressIndicator(
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: AppTheme.surfaceColor,
                    child: Icon(
                      Icons.shopping_bag,
                      size: 80,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title & Price Section
                Container(
                  padding: EdgeInsets.all(AppTheme.spaceLarge),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.item.name, style: AppTheme.heading2),
                      SizedBox(height: AppTheme.spaceSmall),
                      Row(
                        children: [
                          Text(
                            '₹${widget.item.price.toStringAsFixed(2)}',
                            style: AppTheme.heading1.copyWith(
                              color: AppTheme.primaryColor,
                              fontSize: 28,
                            ),
                          ),
                          const Spacer(),
                          Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: AppTheme.spaceSmall,
                              vertical: AppTheme.spaceXSmall,
                            ),
                            decoration: BoxDecoration(
                              color: isInStock
                                  ? AppTheme.successColor.withValues(alpha: 0.1)
                                  : AppTheme.errorColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(
                                AppTheme.radiusSmall,
                              ),
                            ),
                            child: Text(
                              isInStock ? 'In Stock' : 'Out of Stock',
                              style: AppTheme.bodySmall.copyWith(
                                color: isInStock
                                    ? AppTheme.successColor
                                    : AppTheme.errorColor,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                Divider(height: 1, color: AppTheme.borderColor),

                // Description
                if (widget.item.description != null &&
                    widget.item.description!.isNotEmpty)
                  Padding(
                    padding: EdgeInsets.all(AppTheme.spaceLarge),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Description', style: AppTheme.heading3),
                        SizedBox(height: AppTheme.spaceSmall),
                        Text(
                          widget.item.description!,
                          style: AppTheme.bodyLarge.copyWith(
                            color: AppTheme.textSecondary,
                            height: 1.6,
                          ),
                        ),
                      ],
                    ),
                  ),

                Divider(height: 1, color: AppTheme.borderColor),

                // Stock Info
                Padding(
                  padding: EdgeInsets.all(AppTheme.spaceLarge),
                  child: Row(
                    children: [
                      Icon(
                        Icons.inventory_2_outlined,
                        color: AppTheme.primaryColor,
                        size: 20,
                      ),
                      SizedBox(width: AppTheme.spaceSmall),
                      Text(
                        'Available Stock: ${widget.item.stock} units',
                        style: AppTheme.bodyMedium.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),

                SizedBox(height: AppTheme.spaceLarge),

                // Reviews
                _buildReviewsSection(),

                // Similar Products
                _buildSimilarProducts(),

                SizedBox(height: AppTheme.spaceLarge),
              ],
            ),
          ),
        ],
      ),

      // Bottom Bar
      bottomNavigationBar: Container(
        padding: EdgeInsets.all(AppTheme.spaceMedium),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              // Quantity Selector
              if (isInStock) ...[
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: AppTheme.borderColor),
                    borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: _decrementQuantity,
                        icon: const Icon(Icons.remove),
                        color: AppTheme.primaryColor,
                      ),
                      Text(
                        '$_quantity',
                        style: AppTheme.bodyLarge.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      IconButton(
                        onPressed: _incrementQuantity,
                        icon: const Icon(Icons.add),
                        color: AppTheme.primaryColor,
                      ),
                    ],
                  ),
                ),
                SizedBox(width: AppTheme.spaceMedium),
              ],

              // Add to Cart Button
              Expanded(
                child: ElevatedButton(
                  onPressed: isInStock ? _addToCart : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(
                      vertical: AppTheme.spaceMedium,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(
                        AppTheme.radiusMedium,
                      ),
                    ),
                    elevation: 0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.shopping_cart),
                      SizedBox(width: AppTheme.spaceSmall),
                      Text(
                        isInStock ? 'Add to Cart' : 'Out of Stock',
                        style: AppTheme.buttonText,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReviewsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Divider(height: 1, color: AppTheme.borderColor),
        Padding(
          padding: EdgeInsets.all(AppTheme.spaceLarge),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Ratings & Reviews', style: AppTheme.heading3),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.successColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Text(
                          '4.5',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: AppTheme.successColor,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.star,
                          size: 14,
                          color: AppTheme.successColor,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildReviewItem(
                'Rahul Kumar',
                5,
                'Great quality, fresh and timely delivery!',
              ),
              const SizedBox(height: 12),
              _buildReviewItem(
                'Priya Sharma',
                4,
                'Good product but packaging could be better.',
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReviewItem(String name, double rating, String comment) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppTheme.successColor,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Row(
                children: [
                  Text(
                    rating.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 2),
                  const Icon(Icons.star, size: 10, color: Colors.white),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              name,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(comment, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
      ],
    );
  }

  Widget _buildSimilarProducts() {
    if (_similarItems.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Divider(height: 1, color: AppTheme.borderColor),
        Padding(
          padding: EdgeInsets.all(AppTheme.spaceLarge),
          child: Text('Similar Products', style: AppTheme.heading3),
        ),
        SizedBox(
          height: 220,
          child: ListView.builder(
            padding: EdgeInsets.fromLTRB(
              AppTheme.spaceLarge,
              0,
              AppTheme.spaceLarge,
              16,
            ),
            scrollDirection: Axis.horizontal,
            itemCount: _similarItems.length,
            itemBuilder: (context, index) {
              final item = _similarItems[index];
              return Container(
                width: 140,
                margin: const EdgeInsets.only(right: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: AppTheme.borderColor),
                  borderRadius: BorderRadius.circular(12),
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(12),
                          ),
                          child: CachedNetworkImage(
                            imageUrl: item.imageUrl ?? '',
                            fit: BoxFit.cover,
                            width: double.infinity,
                            placeholder: (c, u) =>
                                Container(color: Colors.grey[100]),
                            errorWidget: (c, u, e) => const Icon(Icons.image),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '₹${item.price}',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
