class AppConfig {
  // 🔥 CHANGE THIS ONCE - IT UPDATES EVERYWHERE

  // Option 1: Use your computer's IP (changes when network changes)
  // static const String backendHost = '192.168.1.109';

  // Option 2: Use your computer's network name (more stable)
  // Find it by running: hostname
  // static const String backendHost = 'YOUR-PC-NAME.local';

  // Option 3: Use ngrok for public URL (best for testing on any network)
  // Download ngrok.com, run: ngrok http 5000
  // Use the URL it gives you (e.g., https://abc123.ngrok.io)
  static const String backendHost = '192.168.0.104'; // 👈 CHANGE THIS

  static const String backendPort = '5000';

  // Auto-generated URLs - Don't change these
  static const String baseUrl = 'http://$backendHost:$backendPort/api';
  static const String wsUrl = 'ws://$backendHost:$backendPort';

  // Helper to get current IP dynamically
  static String getCurrentIP() {
    // You can update this at runtime if needed
    return backendHost;
  }
}

/* 
📱 HOW TO USE:

1. QUICK FIX (Manual IP update):
   - Run: ipconfig (Windows) or ifconfig (Mac/Linux)
   - Find your IPv4 address (e.g., 192.168.1.109)
   - Update backendHost above
   - Hot reload app

2. BETTER FIX (Use computer name):
   - Run: hostname
   - Replace backendHost with: 'YOUR-PC-NAME.local'
   - Works across network changes (same WiFi only)

3. BEST FIX (Use ngrok - works anywhere):
   - Download: https://ngrok.com/download
   - Run: ngrok http 5000
   - Copy URL: https://abc123.ngrok-free.app
   - Update backendHost to: 'abc123.ngrok-free.app'
   - Change baseUrl to use https:// instead of http://
   - Works even on mobile data!

4. PRODUCTION (Deploy backend to cloud):
   - Deploy to: Railway, Render, Heroku, AWS
   - Update backendHost to: 'api.yourapp.com'
*/
