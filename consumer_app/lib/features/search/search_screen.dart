import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/api/items_api.dart';
import '../items/models/item_model.dart';
import '../items/item_detail_screen.dart';
import 'package:cached_network_image/cached_network_image.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final ItemsApi _itemsApi = ItemsApi();
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();

  List<ItemModel> _allResults = []; // Store original results
  List<ItemModel> _searchResults = []; // Store filtered results
  bool _isLoading = false;
  bool _hasSearched = false;

  // Filter State
  RangeValues _currentPriceRange = const RangeValues(0, 10000);
  bool _inStockOnly = false;

  // Debounce logic could be added here for production

  void _performSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() {
        _allResults = [];
        _searchResults = [];
        _hasSearched = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _hasSearched = true;
    });

    try {
      final results = await _itemsApi.searchItems(query);
      if (mounted) {
        setState(() {
          _allResults = results.map((e) => ItemModel.fromJson(e)).toList();
          _isLoading = false;
        });
        _applyFilters();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _allResults = [];
          _searchResults = [];
        });
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Search failed: $e')));
      }
    }
  }

  void _applyFilters() {
    setState(() {
      _searchResults = _allResults.where((item) {
        final matchesPrice =
            item.price >= _currentPriceRange.start &&
            item.price <= _currentPriceRange.end;
        return matchesPrice;
      }).toList();
    });
  }

  void _showFilterModal() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Filters', style: AppTheme.heading2),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Price Range: ₹${_currentPriceRange.start.round()} - ₹${_currentPriceRange.end.round()}',
                    style: AppTheme.heading3,
                  ),
                  RangeSlider(
                    values: _currentPriceRange,
                    min: 0,
                    max: 10000,
                    divisions: 20,
                    labels: RangeLabels(
                      '₹${_currentPriceRange.start.round()}',
                      '₹${_currentPriceRange.end.round()}',
                    ),
                    onChanged: (values) {
                      setModalState(() => _currentPriceRange = values);
                      _applyFilters();
                    },
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('In Stock Only', style: AppTheme.heading3),
                      Switch(
                        value: _inStockOnly,
                        activeThumbColor: AppTheme.accentColor,
                        onChanged: (val) {
                          setModalState(() => _inStockOnly = val);
                          _applyFilters();
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text('Apply Filters'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  void initState() {
    super.initState();
    // Auto-focus the search field when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _searchFocusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        title: TextField(
          controller: _searchController,
          focusNode: _searchFocusNode,
          onChanged: (value) {
            // Simple debounce by waiting/canceling could be better,
            // but for MVP immediate or onSubmitted is fine.
            // Let's search on submit or debounce manually if typed.
            // For now, let's search on 'Field Submitted' to avoid too many API calls
            // or perform search if query length > 2
            if (value.length > 2) {
              _performSearch(value);
            }
          },
          onSubmitted: _performSearch,
          decoration: InputDecoration(
            hintText: 'Search "Brake Pads", "Oil"...',
            border: InputBorder.none,
            hintStyle: TextStyle(color: Colors.grey[400]),
          ),
          style: const TextStyle(fontSize: 16),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.filter_list, color: AppTheme.primaryColor),
            onPressed: _showFilterModal,
          ),
          if (_searchController.text.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.clear, color: Colors.grey),
              onPressed: () {
                _searchController.clear();
                _performSearch('');
              },
            ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(
        child: CircularProgressIndicator(color: Theme.of(context).primaryColor),
      );
    }

    if (!_hasSearched) {
      return _buildRecentSearches(); // Or empty state
    }

    if (_searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              'No results found',
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _searchResults.length,
      itemBuilder: (context, index) {
        return _buildResultItem(_searchResults[index]);
      },
    );
  }

  Widget _buildRecentSearches() {
    // Hardcoded for MVP aesthetics
    final recents = ['Brake Pads', 'Oil 5W-30', 'Tires', 'Battery'];

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Recent Searches',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: recents
                .map(
                  (term) => ActionChip(
                    label: Text(term),
                    backgroundColor: Colors.grey[100],
                    onPressed: () {
                      _searchController.text = term;
                      _performSearch(term);
                    },
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildResultItem(ItemModel item) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => ItemDetailScreen(item: item)),
        );
      },
      leading: Container(
        width: 60,
        height: 60,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          image: item.imageUrl != null
              ? DecorationImage(
                  image: CachedNetworkImageProvider(item.imageUrl!),
                  fit: BoxFit.cover,
                )
              : null,
          color: Colors.grey[200],
        ),
        child: item.imageUrl == null ? const Icon(Icons.image, size: 20) : null,
      ),
      title: Text(
        item.name,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 4),
          Text(
            item.stockStatus,
            style: TextStyle(color: Colors.grey[500], fontSize: 12),
          ),
        ],
      ),
      trailing: Text(
        '₹${item.price}',
        style: TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 15,
          color: AppTheme.primaryColor,
        ),
      ),
    );
  }
}
