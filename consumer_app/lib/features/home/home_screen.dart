import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:carousel_slider/carousel_slider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/providers/address_provider.dart';
import '../../core/providers/locale_provider.dart';
import '../../l10n/app_strings.dart';
import '../address/address_list_screen.dart';
import '../../core/api/categories_api.dart';
import '../../core/api/items_api.dart';
import '../../core/models/category.dart';
import '../items/models/item_model.dart';
import '../items/item_detail_screen.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../search/search_screen.dart';
import '../items/category_items_screen.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final CategoriesApi _categoriesApi = CategoriesApi();
  final ItemsApi _itemsApi = ItemsApi(); // Added
  List<Category> _featuredCategories = [];
  List<ItemModel> _trendingItems = []; // Added
  bool _isLoading = true;

  final List<String> _bannerImages = [
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=1000', // Car parts flatlay
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1000', // Engine detail
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=1000', // Mechanic
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final categoriesFuture = _categoriesApi.getCategories();
      final itemsFuture = _itemsApi.getAllItems();

      final results = await Future.wait([categoriesFuture, itemsFuture]);

      if (mounted) {
        setState(() {
          _featuredCategories = (results[0] as List<Category>).take(8).toList();
          final itemsData = results[1] as List<Map<String, dynamic>>;
          _trendingItems = itemsData
              .map((e) => ItemModel.fromJson(e))
              .take(5)
              .toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Watch locale for language changes
    context.watch<LocaleProvider>();
    final strings = AppStrings.of(context);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // 1. Sticky Header
            SliverPersistentHeader(
              pinned: true,
              delegate: _HomeHeaderDelegate(
                child: _buildHeader(context),
                maxHeight: 140,
                minHeight: 140,
              ),
            ),

            // 2. Banners
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: CarouselSlider(
                  options: CarouselOptions(
                    height: 160,
                    autoPlay: true,
                    enlargeCenterPage: true,
                    aspectRatio: 16 / 9,
                    viewportFraction: 0.85,
                    autoPlayInterval: const Duration(seconds: 4),
                  ),
                  items: _bannerImages.map((i) {
                    return Builder(
                      builder: (BuildContext context) {
                        return Container(
                          width: MediaQuery.of(context).size.width,
                          margin: const EdgeInsets.symmetric(horizontal: 5.0),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            image: DecorationImage(
                              image: CachedNetworkImageProvider(i),
                              fit: BoxFit.cover,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                        );
                      },
                    );
                  }).toList(),
                ),
              ),
            ),

            // 3. Categories Title
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      strings.shopByCategory,
                      style: AppTheme.heading3.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 4. Categories Grid
            _isLoading
                ? const SliverToBoxAdapter(
                    child: Center(child: CircularProgressIndicator()),
                  )
                : SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 4,
                            mainAxisSpacing: 16,
                            crossAxisSpacing: 16,
                            childAspectRatio: 0.75,
                          ),
                      delegate: SliverChildBuilderDelegate((context, index) {
                        if (index >= _featuredCategories.length) return null;
                        return _buildCategoryItem(_featuredCategories[index]);
                      }, childCount: _featuredCategories.length),
                    ),
                  ),

            // 5. Trending Title
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      strings.popularParts,
                      style: AppTheme.heading3.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextButton(
                      onPressed: () {},
                      child: Text(
                        strings.viewAll,
                        style: TextStyle(color: AppTheme.accentColor),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 6. Trending Horizontal List
            SliverToBoxAdapter(
              child: SizedBox(
                height: 240,
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        scrollDirection: Axis.horizontal,
                        itemCount: _trendingItems.length,
                        itemBuilder: (context, index) {
                          return _buildProductItem(_trendingItems[index]);
                        },
                      ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  // ... _buildHeader and _buildCategoryItem remain mostly same ...
  // Re-pasting _buildHeader to be safe with replace
  Widget _buildHeader(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final strings = AppStrings.of(context);

    return Container(
      color: Theme.of(context).cardColor,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.location_on, color: AppTheme.accentColor, size: 28),
              const SizedBox(width: 8),
              Expanded(
                child: Consumer<AddressProvider>(
                  builder: (context, provider, child) {
                    final address = provider.defaultAddress;
                    return InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const AddressListScreen(),
                          ),
                        );
                      },
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            children: [
                              Text(
                                address?.addressType.toUpperCase() ?? 'HOME',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: isDark
                                      ? AppTheme.darkTextPrimary
                                      : AppTheme.textPrimary,
                                ),
                              ),
                              Icon(
                                Icons.keyboard_arrow_down,
                                size: 20,
                                color: isDark
                                    ? AppTheme.darkTextPrimary
                                    : AppTheme.textPrimary,
                              ),
                            ],
                          ),
                          Text(
                            address?.shortAddress ?? 'Select Location',
                            style: TextStyle(
                              color: isDark
                                  ? AppTheme.darkTextSecondary
                                  : AppTheme.textSecondary,
                              fontSize: 12,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (c) => const ProfileScreen()),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isDark
                        ? AppTheme.accentColor.withValues(alpha: 0.2)
                        : AppTheme.backgroundColor,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.person_outline,
                    color: isDark ? AppTheme.accentColor : AppTheme.textPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Search Bar
          InkWell(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SearchScreen()),
              );
            },
            child: Container(
              height: 48,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkSurface : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? AppTheme.darkBorder : AppTheme.borderColor,
                ),
                boxShadow: isDark
                    ? null
                    : [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
              ),
              child: Row(
                children: [
                  Icon(Icons.search, color: AppTheme.accentColor),
                  const SizedBox(width: 12),
                  Text(
                    strings.searchProducts,
                    style: TextStyle(
                      color: isDark
                          ? AppTheme.darkTextSecondary
                          : AppTheme.textSecondary,
                      fontSize: 14,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      vertical: 4,
                      horizontal: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.accentColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Icon(
                      Icons.mic,
                      size: 16,
                      color: AppTheme.accentColor,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryItem(Category category) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => CategoryItemsScreen(
              categoryId: category.id,
              categoryName: category.name,
            ),
          ),
        );
      },
      child: Column(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(16),
                image: category.imageUrl != null
                    ? DecorationImage(
                        image: CachedNetworkImageProvider(category.imageUrl!),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: category.imageUrl == null
                  ? Icon(Icons.category, color: Theme.of(context).primaryColor)
                  : null,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            category.name,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildProductItem(ItemModel item) {
    return Container(
      width: 160,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
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
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16),
                  ),
                  image: item.imageUrl != null
                      ? DecorationImage(
                          image: CachedNetworkImageProvider(item.imageUrl!),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: item.imageUrl == null
                    ? Center(
                        child: Icon(
                          Icons.image_not_supported,
                          color: Colors.grey[300],
                        ),
                      )
                    : null,
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.stockStatus, // Assuming '250g' or unit is part of name or handled elsewhere
                    style: TextStyle(color: Colors.grey[500], fontSize: 12),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '₹${item.price}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: Theme.of(context).primaryColor,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Theme.of(
                            context,
                          ).primaryColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          Icons.add,
                          size: 16,
                          color: Theme.of(context).primaryColor,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeHeaderDelegate extends SliverPersistentHeaderDelegate {
  // ... same as before
  final Widget child;
  final double maxHeight;
  final double minHeight;

  _HomeHeaderDelegate({
    required this.child,
    required this.maxHeight,
    required this.minHeight,
  });

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return SizedBox.expand(child: child);
  }

  @override
  double get maxExtent => maxHeight;

  @override
  double get minExtent => minHeight;

  @override
  bool shouldRebuild(_HomeHeaderDelegate oldDelegate) {
    return maxHeight != oldDelegate.maxHeight ||
        minHeight != oldDelegate.minHeight ||
        child != oldDelegate.child;
  }
}
