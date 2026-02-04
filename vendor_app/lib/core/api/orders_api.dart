import 'api_service.dart';

class OrdersApi {
  final ApiService _api = ApiService();
  
  /// Get vendor's orders (incoming/active/history)
  Future<Map<String, dynamic>> getOrders({String? status}) async {
    // Note: Backend seems to use /orders for listing, handled by controller based on role
    // But currently backend listOrders might be customer only?
    // Let's assume /orders lists orders for the logged in user.
    // If user is vendor, it should return vendor orders.
    
    String endpoint = '/orders';
    if (status != null) {
      endpoint += '?status=$status';
    }
    
    final result = await _api.get(endpoint);
    
    // Fix for paginated response where data contains { orders: [], meta: ... }
    if (result['success'] == true && result['data'] != null) {
       if (result['data'] is Map && result['data']['orders'] != null) {
          result['data'] = result['data']['orders'];
       }
    }
    
    return result;
  }
  
  /// Get single order details
  Future<Map<String, dynamic>> getOrder(String orderId) async {
    return await _api.get('/orders/$orderId');
  }
  
  /// Accept order (HTTP fallback - prefer Socket.io)
  Future<Map<String, dynamic>> acceptOrder(String orderId) async {
    return await _api.post('/vendor/orders/$orderId/accept', {});
  }
  
  /// Reject order (HTTP fallback - prefer Socket.io)
  Future<Map<String, dynamic>> rejectOrder(String orderId, {String? reason}) async {
    return await _api.post('/vendor/orders/$orderId/reject', {
      if (reason != null) 'reason': reason,
    });
  }
  
  /// Update order status
  Future<Map<String, dynamic>> updateStatus(String orderId, String status) async {
    return await _api.patch('/vendor/orders/$orderId/status', {
      'status': status,
    });
  }
  
  /// Get vendor dashboard stats
  Future<Map<String, dynamic>> getDashboardStats() async {
    // This will aggregate data from orders
    final result = await getOrders();
    
    if (result['success'] == true) {
      final orders = result['data'] as List? ?? [];
      
      int todayOrders = 0;
      int pendingOrders = 0;
      int completedOrders = 0;
      double todayEarnings = 0;
      
      final today = DateTime.now();
      
      for (var order in orders) {
        final createdAt = DateTime.tryParse(order['createdAt'] ?? '');
        final status = order['status'] ?? '';
        final total = (order['totalAmount'] ?? 0).toDouble();
        
        if (createdAt != null && 
            createdAt.year == today.year &&
            createdAt.month == today.month &&
            createdAt.day == today.day) {
          todayOrders++;
          if (status == 'delivered') {
            todayEarnings += total;
          }
        }
        
        if (status == 'pending' || status == 'accepted') {
          pendingOrders++;
        }
        if (status == 'delivered') {
          completedOrders++;
        }
      }
      
      return {
        'success': true,
        'data': {
          'todayOrders': todayOrders,
          'pendingOrders': pendingOrders,
          'completedOrders': completedOrders,
          'todayEarnings': todayEarnings,
        },
      };
    }
    
    return result;
  }
}
