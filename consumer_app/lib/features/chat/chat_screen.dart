import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class ChatScreen extends StatefulWidget {
  final String orderId;
  const ChatScreen({super.key, required this.orderId});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<Map<String, dynamic>> _messages = [
    {
      'isMe': false,
      'text': 'Hello! How can we help you with your order?',
      'time': DateTime.now().subtract(const Duration(minutes: 5)),
    },
  ];
  bool _isTyping = false;

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;

    final text = _messageController.text;
    setState(() {
      _messages.add({
        'isMe': true,
        'text': text,
        'time': DateTime.now(),
      });
      _messageController.clear();
      _isTyping = true;
    });
    _scrollToBottom();

    // Simulate Vendor Reply
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isTyping = false;
          _messages.add({
            'isMe': false,
            'text': _getAutoReply(text),
            'time': DateTime.now(),
          });
        });
        _scrollToBottom();
      }
    });
  }

  String _getAutoReply(String userMessage) {
    userMessage = userMessage.toLowerCase();
    if (userMessage.contains('late') || userMessage.contains('where')) {
      return 'Your order for ${widget.orderId} is currently on the way. The driver is 10 mins away.';
    } else if (userMessage.contains('damage') || userMessage.contains('broken')) {
      return 'We are sorry to hear that. Please upload a photo and we will process a replacement immediately.';
    } else if (userMessage.contains('thank')) {
      return 'You are welcome! Drive safe.';
    }
    return 'Thanks for reaching out. An agent will be with you shortly.';
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Support Chat', style: TextStyle(fontSize: 16)),
            Text('Order #${widget.orderId}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal)),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.phone), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length) {
                  return _buildTypingIndicator();
                }
                final msg = _messages[index];
                return _buildMessageBubble(msg['isMe'], msg['text'], msg['time']);
              },
            ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(bool isMe, String text, DateTime time) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isMe ? AppTheme.primaryColor : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isMe ? const Radius.circular(16) : Radius.zero,
            bottomRight: isMe ? Radius.zero : const Radius.circular(16),
          ),
          boxShadow: [
             BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              text,
              style: TextStyle(
                color: isMe ? Colors.white : AppTheme.textPrimary,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${time.hour}:${time.minute.toString().padLeft(2, '0')}',
              style: TextStyle(
                color: isMe ? Colors.white.withValues(alpha: 0.7) : AppTheme.textSecondary,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _dot(0),
            const SizedBox(width: 4),
            _dot(1),
            const SizedBox(width: 4),
            _dot(2),
          ],
        ),
      ),
    );
  }
  
  Widget _dot(int index) {
     return Container(
       width: 6,
       height: 6,
       decoration: BoxDecoration(color: Colors.grey[400], shape: BoxShape.circle),
     );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -4)),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            IconButton(icon: const Icon(Icons.add_circle_outline), onPressed: () {}),
            Expanded(
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: 'Type a message...',
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: Colors.grey[100],
                ),
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
            const SizedBox(width: 8),
            FloatingActionButton(
              onPressed: _sendMessage,
              mini: true,
              backgroundColor: AppTheme.primaryColor,
              child: const Icon(Icons.send, color: Colors.white, size: 18),
            ),
          ],
        ),
      ),
    );
  }
}
