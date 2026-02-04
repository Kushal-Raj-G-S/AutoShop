import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleProvider with ChangeNotifier {
  static const String _localeKey = 'app_locale';
  
  Locale _locale = const Locale('en');
  
  Locale get locale => _locale;
  
  bool get isHindi => _locale.languageCode == 'hi';
  bool get isKannada => _locale.languageCode == 'kn';
  String get languageCode => _locale.languageCode;
  
  // Supported locales
  static const List<Locale> supportedLocales = [
    Locale('en'), // English
    Locale('hi'), // Hindi
    Locale('kn'), // Kannada
  ];
  
  LocaleProvider() {
    _loadLocale();
  }
  
  Future<void> _loadLocale() async {
    final prefs = await SharedPreferences.getInstance();
    final localeCode = prefs.getString(_localeKey) ?? 'en';
    _locale = Locale(localeCode);
    notifyListeners();
  }
  
  Future<void> setLocale(Locale locale) async {
    if (!supportedLocales.contains(locale)) return;
    
    _locale = locale;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_localeKey, locale.languageCode);
    notifyListeners();
  }
  
  void toggleLocale() {
    if (_locale.languageCode == 'en') {
      setLocale(const Locale('hi'));
    } else {
      setLocale(const Locale('en'));
    }
  }
}
