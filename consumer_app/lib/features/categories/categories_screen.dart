import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/api/categories_api.dart';
import '../../core/models/category.dart';
import '../../core/theme/app_theme.dart';
import '../items/category_items_screen.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  final CategoriesApi _categoriesApi = CategoriesApi();
  List<Category> _categories = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final categories = await _categoriesApi.getCategories();
      setState(() {
        _categories = List<Category>.from(categories);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Center(
        child: CircularProgressIndicator(color: AppTheme.primaryColor),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: EdgeInsets.all(AppTheme.spaceLarge),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: AppTheme.errorColor),
              SizedBox(height: AppTheme.spaceMedium),
              Text(
                'Failed to load categories',
                style: AppTheme.heading3,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: AppTheme.spaceSmall),
              Text(
                _errorMessage!,
                style: AppTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: AppTheme.spaceLarge),
              ElevatedButton.icon(
                onPressed: _loadCategories,
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

    if (_categories.isEmpty) {
      return Center(
        child: Padding(
          padding: EdgeInsets.all(AppTheme.spaceLarge),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.category_outlined,
                size: 64,
                color: AppTheme.textSecondary,
              ),
              SizedBox(height: AppTheme.spaceMedium),
              Text(
                'No categories available',
                style: AppTheme.heading3,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: AppTheme.spaceSmall),
              Text(
                'Check back later for new categories',
                style: AppTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadCategories,
      color: AppTheme.primaryColor,
      child: GridView.builder(
        padding: EdgeInsets.all(AppTheme.spaceMedium),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.85,
        ),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final category = _categories[index];
          return _buildCategoryCard(category);
        },
      ),
    );
  }

  Widget _buildCategoryCard(Category category) {
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
      child: Card(
        elevation: AppTheme.elevationLow,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusMedium),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Category Image
            Expanded(
              flex: 3,
              child: ClipRRect(
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(AppTheme.radiusMedium),
                  topRight: Radius.circular(AppTheme.radiusMedium),
                ),
                child:
                    category.imageUrl != null && category.imageUrl!.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: category.imageUrl!,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          color: AppTheme.surfaceColor,
                          child: Center(
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppTheme.primaryColor,
                            ),
                          ),
                        ),
                        errorWidget: (context, url, error) => Container(
                          color: AppTheme.primaryColor.withValues(alpha: 0.1),
                          child: Icon(
                            Icons.category,
                            size: 40,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                      )
                    : Container(
                        color: AppTheme.primaryColor.withValues(alpha: 0.1),
                        child: Icon(
                          Icons.category,
                          size: 40,
                          color: AppTheme.primaryColor,
                        ),
                      ),
              ),
            ),
            // Category Info
            Expanded(
              flex: 2,
              child: Padding(
                padding: EdgeInsets.all(AppTheme.spaceSmall),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      category.name,
                      style: AppTheme.bodyLarge.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: AppTheme.spaceXSmall),
                    Text(
                      category.description,
                      style: AppTheme.bodySmall.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
