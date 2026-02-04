import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// NotificationService - Infrastructure for push notifications
///
/// This service provides the foundation for push notifications.
/// To fully enable, you need to:
/// 1. Create a Firebase project and add firebase_core & firebase_messaging packages
/// 2. Add google-services.json (Android) and GoogleService-Info.plist (iOS)
/// 3. Call NotificationService.initialize() in main.dart
///
class NotificationService {
  static const String _fcmTokenKey = 'fcm_token';
  static const String _notificationsEnabledKey = 'notifications_enabled';

  static bool _initialized = false;

  /// Initialize the notification service
  /// Call this in main.dart after runApp
  static Future<void> initialize() async {
    if (_initialized) return;

    try {
      // TODO: Uncomment when Firebase is configured
      // await Firebase.initializeApp();
      // await _requestPermission();
      // await _getToken();
      // _setupForegroundHandler();

      _initialized = true;
      debugPrint('📱 NotificationService: Initialized (Firebase pending)');
    } catch (e) {
      debugPrint('❌ NotificationService: Init failed - $e');
    }
  }

  /// Request notification permissions
  static Future<bool> requestPermission() async {
    // TODO: Implement with firebase_messaging
    // final messaging = FirebaseMessaging.instance;
    // final settings = await messaging.requestPermission(
    //   alert: true,
    //   announcement: false,
    //   badge: true,
    //   carPlay: false,
    //   criticalAlert: false,
    //   provisional: false,
    //   sound: true,
    // );
    // return settings.authorizationStatus == AuthorizationStatus.authorized;

    debugPrint('📱 NotificationService: Permission request (Firebase pending)');
    return true;
  }

  /// Get FCM token for this device
  static Future<String?> getToken() async {
    // TODO: Implement with firebase_messaging
    // final messaging = FirebaseMessaging.instance;
    // final token = await messaging.getToken();
    // if (token != null) {
    //   await _saveToken(token);
    //   // Send token to your backend
    //   await _sendTokenToServer(token);
    // }
    // return token;

    debugPrint('📱 NotificationService: Get token (Firebase pending)');
    return null;
  }

  /// Get saved FCM token
  static Future<String?> getSavedToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_fcmTokenKey);
  }

  /// Check if notifications are enabled
  static Future<bool> areNotificationsEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_notificationsEnabledKey) ?? true;
  }

  /// Toggle notifications on/off
  static Future<void> setNotificationsEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_notificationsEnabledKey, enabled);

    if (enabled) {
      await requestPermission();
    }
  }

  /// Handle foreground notifications
  static void setupForegroundHandler() {
    // TODO: Implement with firebase_messaging
    // FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    //   debugPrint('Got a message whilst in the foreground!');
    //   debugPrint('Message data: ${message.data}');
    //   if (message.notification != null) {
    //     _showLocalNotification(message);
    //   }
    // });

    debugPrint('📱 NotificationService: Foreground handler (Firebase pending)');
  }

  /// Show a local notification
  static Future<void> showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    // TODO: Implement with flutter_local_notifications
    // final FlutterLocalNotificationsPlugin plugin = FlutterLocalNotificationsPlugin();
    // const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
    //   'autoshop_channel',
    //   'AutoShop Notifications',
    //   channelDescription: 'Order updates and offers',
    //   importance: Importance.max,
    //   priority: Priority.high,
    // );
    // const NotificationDetails details = NotificationDetails(android: androidDetails);
    // await plugin.show(0, title, body, details, payload: payload);

    debugPrint('📱 Local notification: $title - $body');
  }

  /// Subscribe to a topic (for broadcast notifications)
  static Future<void> subscribeToTopic(String topic) async {
    // TODO: Implement with firebase_messaging
    // await FirebaseMessaging.instance.subscribeToTopic(topic);
    debugPrint(
      '📱 NotificationService: Subscribed to $topic (Firebase pending)',
    );
  }

  /// Unsubscribe from a topic
  static Future<void> unsubscribeFromTopic(String topic) async {
    // TODO: Implement with firebase_messaging
    // await FirebaseMessaging.instance.unsubscribeFromTopic(topic);
    debugPrint(
      '📱 NotificationService: Unsubscribed from $topic (Firebase pending)',
    );
  }
}

/// Extension to easily send notification token to backend
extension NotificationServiceBackend on NotificationService {
  static Future<void> sendTokenToServer(String token, String userId) async {
    // TODO: Implement API call to save token
    // await http.post(
    //   Uri.parse('$baseUrl/users/notification-token'),
    //   headers: {'Authorization': 'Bearer $jwt', 'Content-Type': 'application/json'},
    //   body: jsonEncode({'token': token, 'userId': userId}),
    // );
    debugPrint('📱 Would send FCM token to server for user: $userId');
  }
}
