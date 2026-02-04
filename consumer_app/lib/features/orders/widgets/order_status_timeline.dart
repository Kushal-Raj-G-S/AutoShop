import 'package:flutter/material.dart';

class OrderStatusTimeline extends StatelessWidget {
  final String currentStatus;
  final List<String> history;

  const OrderStatusTimeline({
    super.key,
    required this.currentStatus,
    this.history = const [],
  });

  @override
  Widget build(BuildContext context) {
    final steps = [
      {'status': 'pending', 'title': 'Order Placed', 'icon': Icons.shopping_bag_outlined},
      {'status': 'confirmed', 'title': 'Confirmed', 'icon': Icons.check_circle_outline},
      {'status': 'processing', 'title': 'Preparing', 'icon': Icons.soup_kitchen_outlined},
      {'status': 'out_for_delivery', 'title': 'On the Way', 'icon': Icons.delivery_dining_outlined},
      {'status': 'delivered', 'title': 'Delivered', 'icon': Icons.home_work_outlined},
    ];

    int currentIndex = steps.indexWhere((s) => s['status'] == currentStatus.toLowerCase());
    if (currentIndex == -1) currentIndex = 0; // Default to first if unknown

    return Column(
      children: List.generate(steps.length, (index) {
        final step = steps[index];
        final isCompleted = index <= currentIndex;
        final isCurrent = index == currentIndex;
        final isLast = index == steps.length - 1;

        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Timeline line and dot
              Column(
                children: [
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: isCompleted ? (isCurrent ? Theme.of(context).primaryColor : Colors.green) : Colors.grey[200],
                      shape: BoxShape.circle,
                      border: isCurrent ? Border.all(color: Theme.of(context).primaryColor.withValues(alpha:  0.3), width: 4) : null,
                    ),
                    child: Icon(
                      step['icon'] as IconData,
                      size: 16,
                      color: isCompleted ? Colors.white : Colors.grey[400],
                    ),
                  ),
                  if (!isLast)
                    Expanded(
                      child: Container(
                        width: 2,
                        color: index < currentIndex ? Colors.green : Colors.grey[200],
                        margin: const EdgeInsets.symmetric(vertical: 4),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 16),
              // Content
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        step['title'] as String,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: isCompleted ? FontWeight.bold : FontWeight.w500,
                          color: isCompleted ? Colors.black87 : Colors.grey[500],
                        ),
                      ),
                      if (isCurrent) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Your order is being processed.',
                          style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                        ),
                      ],
                      if (isCompleted && !isCurrent) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Completed', // Could accept timestamps here
                          style: TextStyle(fontSize: 12, color: Colors.green[700], fontWeight: FontWeight.w500),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
