import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../api/api_service.dart';
import '../config/app_config.dart';

/// Real-time socket service for vendor order events
class SocketService {
  static String get socketUrl => AppConfig.wsUrl;

  io.Socket? _socket;
  bool _isConnected = false;

  // Callbacks
  Function(Map<String, dynamic>)? onNewOrder;
  Function(Map<String, dynamic>)? onOrderAcceptSuccess;
  Function(Map<String, dynamic>)? onOrderAcceptFailed;
  Function(Map<String, dynamic>)? onOrderStatusUpdate;
  Function()? onConnected;
  Function()? onDisconnected;

  // Singleton
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  bool get isConnected => _isConnected;

  /// Connect to socket server
  Future<void> connect() async {
    if (_socket != null && _isConnected) {
      debugPrint('🔌 Socket already connected');
      return;
    }

    final api = ApiService();
    final token = api.token;

    if (token == null) {
      debugPrint('❌ Cannot connect socket: No auth token');
      return;
    }

    debugPrint('🔌 Connecting to socket: $socketUrl');

    _socket = io.io(
      socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .build(),
    );

    _setupListeners();
    _socket!.connect();
  }

  /// Setup socket event listeners
  void _setupListeners() {
    _socket!.onConnect((_) {
      debugPrint('✅ Socket connected: ${_socket!.id}');
      _isConnected = true;
      onConnected?.call();
    });

    _socket!.onDisconnect((_) {
      debugPrint('🔌 Socket disconnected');
      _isConnected = false;
      onDisconnected?.call();
    });

    _socket!.onConnectError((error) {
      debugPrint('❌ Socket connection error: $error');
      _isConnected = false;
    });

    // New order available
    _socket!.on('NEW_ORDER', (data) {
      debugPrint('📦 New order received: $data');
      onNewOrder?.call(Map<String, dynamic>.from(data));
    });

    // Order accept success
    _socket!.on('ACCEPT_ORDER_SUCCESS', (data) {
      debugPrint('✅ Order accepted: $data');
      onOrderAcceptSuccess?.call(Map<String, dynamic>.from(data));
    });

    // Also listen for ACCEPT_RESULT (for compatibility)
    _socket!.on('ACCEPT_RESULT', (data) {
      final result = Map<String, dynamic>.from(data);
      if (result['winner'] == true) {
        debugPrint('🏆 Won order race: $data');
        onOrderAcceptSuccess?.call(result);
      } else {
        debugPrint('❌ Lost order race: $data');
        onOrderAcceptFailed?.call(result);
      }
    });

    // Order accept failed (another vendor won)
    _socket!.on('ACCEPT_ORDER_FAILED', (data) {
      debugPrint('❌ Order accept failed: $data');
      onOrderAcceptFailed?.call(Map<String, dynamic>.from(data));
    });

    // Order status updated
    _socket!.on('ORDER_STATUS_UPDATE', (data) {
      debugPrint('📋 Order status update: $data');
      onOrderStatusUpdate?.call(Map<String, dynamic>.from(data));
    });

    // Update status success
    _socket!.on('UPDATE_STATUS_SUCCESS', (data) {
      debugPrint('✅ Status update success: $data');
    });

    // Update status failed
    _socket!.on('UPDATE_STATUS_FAILED', (data) {
      debugPrint('❌ Status update failed: $data');
    });
  }

  /// Accept an order (with Redis lock)
  void acceptOrder(String orderId) {
    if (_socket == null || !_isConnected) {
      debugPrint('❌ Cannot accept: Socket not connected');
      return;
    }

    debugPrint('🤝 Sending ACCEPT_ORDER for: $orderId');
    _socket!.emit('ACCEPT_ORDER', {'orderId': orderId});
  }

  /// Reject an order
  void rejectOrder(String orderId, {String? reason}) {
    if (_socket == null || !_isConnected) {
      debugPrint('❌ Cannot reject: Socket not connected');
      return;
    }

    debugPrint('👎 Sending REJECT_ORDER for: $orderId');
    _socket!.emit('REJECT_ORDER', {
      'orderId': orderId,
      if (reason != null) 'reason': reason,
    });
  }

  /// Update order status
  void updateOrderStatus(String orderId, String status) {
    if (_socket == null || !_isConnected) {
      debugPrint('❌ Cannot update: Socket not connected');
      return;
    }

    debugPrint('📝 Sending UPDATE_ORDER_STATUS: $orderId -> $status');
    _socket!.emit('UPDATE_ORDER_STATUS', {
      'orderId': orderId,
      'status': status,
    });
  }

  /// Disconnect from socket
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    debugPrint('🔌 Socket disconnected and disposed');
  }
}
