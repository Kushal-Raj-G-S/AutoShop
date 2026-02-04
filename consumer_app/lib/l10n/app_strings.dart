import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/providers/locale_provider.dart';
import 'app_strings_en.dart';
import 'app_strings_hi.dart';
import 'app_strings_kn.dart';

/// Localization helper class for easy string access
class AppStrings {
  final BuildContext context;
  
  AppStrings(this.context);
  
  static AppStrings of(BuildContext context) => AppStrings(context);
  
  String get _lang => context.watch<LocaleProvider>().languageCode;
  
  String _get(String en, String hi, String kn) {
    switch (_lang) {
      case 'hi': return hi;
      case 'kn': return kn;
      default: return en;
    }
  }
  
  // Navigation
  String get home => _get(AppStringsEn.home, AppStringsHi.home, AppStringsKn.home);
  String get categories => _get(AppStringsEn.categories, AppStringsHi.categories, AppStringsKn.categories);
  String get cart => _get(AppStringsEn.cart, AppStringsHi.cart, AppStringsKn.cart);
  String get orders => _get(AppStringsEn.orders, AppStringsHi.orders, AppStringsKn.orders);
  String get profile => _get(AppStringsEn.profile, AppStringsHi.profile, AppStringsKn.profile);
  
  // Common actions
  String get addToCart => _get(AppStringsEn.addToCart, AppStringsHi.addToCart, AppStringsKn.addToCart);
  String get buyNow => _get(AppStringsEn.buyNow, AppStringsHi.buyNow, AppStringsKn.buyNow);
  String get checkout => _get(AppStringsEn.checkout, AppStringsHi.checkout, AppStringsKn.checkout);
  String get placeOrder => _get(AppStringsEn.placeOrder, AppStringsHi.placeOrder, AppStringsKn.placeOrder);
  String get continueText => _get(AppStringsEn.continueText, AppStringsHi.continueText, AppStringsKn.continueText);
  String get cancel => _get(AppStringsEn.cancel, AppStringsHi.cancel, AppStringsKn.cancel);
  String get save => _get(AppStringsEn.save, AppStringsHi.save, AppStringsKn.save);
  String get delete => _get(AppStringsEn.delete, AppStringsHi.delete, AppStringsKn.delete);
  String get edit => _get(AppStringsEn.edit, AppStringsHi.edit, AppStringsKn.edit);
  String get search => _get(AppStringsEn.search, AppStringsHi.search, AppStringsKn.search);
  String get apply => _get(AppStringsEn.apply, AppStringsHi.apply, AppStringsKn.apply);
  String get clear => _get(AppStringsEn.clear, AppStringsHi.clear, AppStringsKn.clear);
  String get done => _get(AppStringsEn.done, AppStringsHi.done, AppStringsKn.done);
  String get retry => _get(AppStringsEn.retry, AppStringsHi.retry, AppStringsKn.retry);
  String get viewAll => _get(AppStringsEn.viewAll, AppStringsHi.viewAll, AppStringsKn.viewAll);
  
  // Home
  String get searchProducts => _get(AppStringsEn.searchProducts, AppStringsHi.searchProducts, AppStringsKn.searchProducts);
  String get popularParts => _get(AppStringsEn.popularParts, AppStringsHi.popularParts, AppStringsKn.popularParts);
  String get shopByCategory => _get(AppStringsEn.shopByCategory, AppStringsHi.shopByCategory, AppStringsKn.shopByCategory);
  String get dealsOfTheDay => _get(AppStringsEn.dealsOfTheDay, AppStringsHi.dealsOfTheDay, AppStringsKn.dealsOfTheDay);
  String get trendingNow => _get(AppStringsEn.trendingNow, AppStringsHi.trendingNow, AppStringsKn.trendingNow);
  
  // Product
  String get inStock => _get(AppStringsEn.inStock, AppStringsHi.inStock, AppStringsKn.inStock);
  String get outOfStock => _get(AppStringsEn.outOfStock, AppStringsHi.outOfStock, AppStringsKn.outOfStock);
  String get lowStock => _get(AppStringsEn.lowStock, AppStringsHi.lowStock, AppStringsKn.lowStock);
  String get freeDelivery => _get(AppStringsEn.freeDelivery, AppStringsHi.freeDelivery, AppStringsKn.freeDelivery);
  String get description => _get(AppStringsEn.description, AppStringsHi.description, AppStringsKn.description);
  String get specifications => _get(AppStringsEn.specifications, AppStringsHi.specifications, AppStringsKn.specifications);
  String get reviews => _get(AppStringsEn.reviews, AppStringsHi.reviews, AppStringsKn.reviews);
  String get similarProducts => _get(AppStringsEn.similarProducts, AppStringsHi.similarProducts, AppStringsKn.similarProducts);
  
  // Cart
  String get yourCart => _get(AppStringsEn.yourCart, AppStringsHi.yourCart, AppStringsKn.yourCart);
  String get emptyCart => _get(AppStringsEn.emptyCart, AppStringsHi.emptyCart, AppStringsKn.emptyCart);
  String get cartSubtotal => _get(AppStringsEn.cartSubtotal, AppStringsHi.cartSubtotal, AppStringsKn.cartSubtotal);
  String get deliveryFee => _get(AppStringsEn.deliveryFee, AppStringsHi.deliveryFee, AppStringsKn.deliveryFee);
  String get tax => _get(AppStringsEn.tax, AppStringsHi.tax, AppStringsKn.tax);
  String get total => _get(AppStringsEn.total, AppStringsHi.total, AppStringsKn.total);
  String get proceedToCheckout => _get(AppStringsEn.proceedToCheckout, AppStringsHi.proceedToCheckout, AppStringsKn.proceedToCheckout);
  String get applyCoupon => _get(AppStringsEn.applyCoupon, AppStringsHi.applyCoupon, AppStringsKn.applyCoupon);
  String get couponApplied => _get(AppStringsEn.couponApplied, AppStringsHi.couponApplied, AppStringsKn.couponApplied);
  
  // Orders
  String get myOrders => _get(AppStringsEn.myOrders, AppStringsHi.myOrders, AppStringsKn.myOrders);
  String get orderDetails => _get(AppStringsEn.orderDetails, AppStringsHi.orderDetails, AppStringsKn.orderDetails);
  String get orderPlaced => _get(AppStringsEn.orderPlaced, AppStringsHi.orderPlaced, AppStringsKn.orderPlaced);
  String get orderConfirmed => _get(AppStringsEn.orderConfirmed, AppStringsHi.orderConfirmed, AppStringsKn.orderConfirmed);
  String get shipped => _get(AppStringsEn.shipped, AppStringsHi.shipped, AppStringsKn.shipped);
  String get outForDelivery => _get(AppStringsEn.outForDelivery, AppStringsHi.outForDelivery, AppStringsKn.outForDelivery);
  String get delivered => _get(AppStringsEn.delivered, AppStringsHi.delivered, AppStringsKn.delivered);
  String get cancelled => _get(AppStringsEn.cancelled, AppStringsHi.cancelled, AppStringsKn.cancelled);
  String get trackOrder => _get(AppStringsEn.trackOrder, AppStringsHi.trackOrder, AppStringsKn.trackOrder);
  String get reorder => _get(AppStringsEn.reorder, AppStringsHi.reorder, AppStringsKn.reorder);
  String get contactSupport => _get(AppStringsEn.contactSupport, AppStringsHi.contactSupport, AppStringsKn.contactSupport);
  
  // Profile  
  String get myAccount => _get(AppStringsEn.myAccount, AppStringsHi.myAccount, AppStringsKn.myAccount);
  String get deliveryAddresses => _get(AppStringsEn.deliveryAddresses, AppStringsHi.deliveryAddresses, AppStringsKn.deliveryAddresses);
  String get myGarage => _get(AppStringsEn.myGarage, AppStringsHi.myGarage, AppStringsKn.myGarage);
  String get wishlist => _get(AppStringsEn.wishlist, AppStringsHi.wishlist, AppStringsKn.wishlist);
  String get notifications => _get(AppStringsEn.notifications, AppStringsHi.notifications, AppStringsKn.notifications);
  String get helpSupport => _get(AppStringsEn.helpSupport, AppStringsHi.helpSupport, AppStringsKn.helpSupport);
  String get logout => _get(AppStringsEn.logout, AppStringsHi.logout, AppStringsKn.logout);
  String get language => _get(AppStringsEn.language, AppStringsHi.language, AppStringsKn.language);
  String get english => 'English';
  String get hindi => 'हिंदी';
  String get kannada => 'ಕನ್ನಡ';
  
  // Address
  String get addAddress => _get(AppStringsEn.addAddress, AppStringsHi.addAddress, AppStringsKn.addAddress);
  String get editAddress => _get(AppStringsEn.editAddress, AppStringsHi.editAddress, AppStringsKn.editAddress);
  String get selectAddress => _get(AppStringsEn.selectAddress, AppStringsHi.selectAddress, AppStringsKn.selectAddress);
  String get addressType => _get(AppStringsEn.addressType, AppStringsHi.addressType, AppStringsKn.addressType);
  String get setAsDefault => _get(AppStringsEn.setAsDefault, AppStringsHi.setAsDefault, AppStringsKn.setAsDefault);
  
  // Auth
  String get enterPhone => _get(AppStringsEn.enterPhone, AppStringsHi.enterPhone, AppStringsKn.enterPhone);
  String get enterOtp => _get(AppStringsEn.enterOtp, AppStringsHi.enterOtp, AppStringsKn.enterOtp);
  String get sendOtp => _get(AppStringsEn.sendOtp, AppStringsHi.sendOtp, AppStringsKn.sendOtp);
  String get verifyOtp => _get(AppStringsEn.verifyOtp, AppStringsHi.verifyOtp, AppStringsKn.verifyOtp);
  String get resendOtp => _get(AppStringsEn.resendOtp, AppStringsHi.resendOtp, AppStringsKn.resendOtp);
  
  // Filters
  String get filters => _get(AppStringsEn.filters, AppStringsHi.filters, AppStringsKn.filters);
  String get priceRange => _get(AppStringsEn.priceRange, AppStringsHi.priceRange, AppStringsKn.priceRange);
  String get inStockOnly => _get(AppStringsEn.inStockOnly, AppStringsHi.inStockOnly, AppStringsKn.inStockOnly);
  String get sortBy => _get(AppStringsEn.sortBy, AppStringsHi.sortBy, AppStringsKn.sortBy);
  String get priceLowToHigh => _get(AppStringsEn.priceLowToHigh, AppStringsHi.priceLowToHigh, AppStringsKn.priceLowToHigh);
  String get priceHighToLow => _get(AppStringsEn.priceHighToLow, AppStringsHi.priceHighToLow, AppStringsKn.priceHighToLow);
  String get rating => _get(AppStringsEn.rating, AppStringsHi.rating, AppStringsKn.rating);
  
  // Messages
  String get addedToCart => _get(AppStringsEn.addedToCart, AppStringsHi.addedToCart, AppStringsKn.addedToCart);
  String get itemsAddedToCart => _get(AppStringsEn.itemsAddedToCart, AppStringsHi.itemsAddedToCart, AppStringsKn.itemsAddedToCart);
  String get orderPlacedSuccess => _get(AppStringsEn.orderPlacedSuccess, AppStringsHi.orderPlacedSuccess, AppStringsKn.orderPlacedSuccess);
  String get addressSaved => _get(AppStringsEn.addressSaved, AppStringsHi.addressSaved, AppStringsKn.addressSaved);
  String get addressDeleted => _get(AppStringsEn.addressDeleted, AppStringsHi.addressDeleted, AppStringsKn.addressDeleted);
  String get logoutConfirm => _get(AppStringsEn.logoutConfirm, AppStringsHi.logoutConfirm, AppStringsKn.logoutConfirm);
  String get comingSoon => _get(AppStringsEn.comingSoon, AppStringsHi.comingSoon, AppStringsKn.comingSoon);
}

/// Extension for easy access via context
extension AppStringsExtension on BuildContext {
  AppStrings get strings => AppStrings.of(this);
}
