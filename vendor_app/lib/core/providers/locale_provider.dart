import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocaleProvider with ChangeNotifier {
  static const String _localeKey = 'vendor_app_locale';
  
  Locale _locale = const Locale('en');
  
  Locale get locale => _locale;
  String get languageCode => _locale.languageCode;
  bool get isEnglish => _locale.languageCode == 'en';
  bool get isHindi => _locale.languageCode == 'hi';
  bool get isKannada => _locale.languageCode == 'kn';
  
  static const List<Locale> supportedLocales = [
    Locale('en'),
    Locale('hi'),
    Locale('kn'),
  ];
  
  LocaleProvider() {
    _loadLocale();
  }
  
  Future<void> _loadLocale() async {
    final prefs = await SharedPreferences.getInstance();
    final langCode = prefs.getString(_localeKey) ?? 'en';
    _locale = Locale(langCode);
    notifyListeners();
  }
  
  Future<void> setLocale(Locale locale) async {
    _locale = locale;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_localeKey, locale.languageCode);
    notifyListeners();
  }
}
