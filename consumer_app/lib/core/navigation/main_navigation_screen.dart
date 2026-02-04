import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:badges/badges.dart' as badges;
import '../providers/cart_provider.dart';
import '../providers/locale_provider.dart';
import '../../features/home/home_screen.dart';
import '../../features/cart/cart_screen.dart';
import '../../features/orders/screens/order_list_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../l10n/app_strings.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    CartScreen(),
    OrderListScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    // Watch locale to rebuild when language changes
    context.watch<LocaleProvider>();
    final strings = AppStrings.of(context);
    
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          type: BottomNavigationBarType.fixed,
          selectedItemColor: Theme.of(context).primaryColor,
          unselectedItemColor: Colors.grey,
          selectedFontSize: 12,
          unselectedFontSize: 12,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600),
          items: [
            BottomNavigationBarItem(
              icon: const Icon(Icons.home_outlined),
              activeIcon: const Icon(Icons.home),
              label: strings.home,
            ),
            BottomNavigationBarItem(
              icon: Consumer<CartProvider>(
                builder: (context, cart, child) {
                  return badges.Badge(
                    badgeContent: Text(
                      '${cart.itemCount}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    showBadge: cart.itemCount > 0,
                    position: badges.BadgePosition.topEnd(top: -8, end: -8),
                    badgeStyle: badges.BadgeStyle(
                      badgeColor: Colors.red,
                      padding: const EdgeInsets.all(5),
                    ),
                    child: const Icon(Icons.shopping_cart_outlined),
                  );
                },
              ),
              activeIcon: Consumer<CartProvider>(
                builder: (context, cart, child) {
                  return badges.Badge(
                    badgeContent: Text(
                      '${cart.itemCount}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    showBadge: cart.itemCount > 0,
                    position: badges.BadgePosition.topEnd(top: -8, end: -8),
                    badgeStyle: badges.BadgeStyle(
                      badgeColor: Colors.red,
                      padding: const EdgeInsets.all(5),
                    ),
                    child: const Icon(Icons.shopping_cart),
                  );
                },
              ),
              label: strings.cart,
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.receipt_long_outlined),
              activeIcon: const Icon(Icons.receipt_long),
              label: strings.orders,
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.person_outline),
              activeIcon: const Icon(Icons.person),
              label: strings.profile,
            ),
          ],
        ),
      ),
    );
  }
}
