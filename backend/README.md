# Autoshop Backend - Auth Module

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Push database schema:**
   ```bash
   npm run db:push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── schema.js          # Drizzle schema
│   │   └── index.js           # Database connection
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.service.js    # Business logic
│   │       ├── auth.controller.js # Request handlers
│   │       └── auth.routes.js     # Route definitions
│   ├── middleware/
│   │   └── auth.middleware.js     # JWT & role middleware
│   ├── utils/
│   │   ├── jwt.js             # JWT helpers
│   │   └── response.js        # Response formatter
│   └── server.js              # Main server file
├── drizzle.config.js          # Drizzle ORM config
├── package.json
└── .env.example
```

## API Endpoints

### 1. Send OTP
**POST** `/api/auth/send-otp`

Request:
```json
{
  "phoneNumber": "+919876543210"
}
```

Response:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otp": "123456"
  }
}
```

### 2. Verify OTP & Login
**POST** `/api/auth/verify-otp`

Request:
```json
{
  "phoneNumber": "+919876543210",
  "otp": "123456",
  "role": "customer"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "phoneNumber": "+919876543210",
      "name": null,
      "email": null,
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get Profile (Protected)
**GET** `/api/auth/profile`

Headers:
```
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "id": "uuid",
      "phoneNumber": "+919876543210",
      "name": null,
      "email": null,
      "role": "customer",
      "isActive": "true",
      "createdAt": "2025-12-03T10:00:00.000Z"
    }
  }
}
```

## Middleware Usage

### Protect routes with JWT:
```javascript
import { verifyToken } from '../../middleware/auth.middleware.js';

router.get('/protected', verifyToken, controller.method);
```

### Restrict by role:
```javascript
import { verifyToken, requireRole } from '../../middleware/auth.middleware.js';

// Admin only
router.post('/admin-only', verifyToken, requireRole('admin'), controller.method);

// Vendor or Admin
router.get('/vendors', verifyToken, requireRole('vendor', 'admin'), controller.method);
```

## Database Tables

### users
- id (uuid, primary key)
- phoneNumber (varchar, unique)
- name (varchar, nullable)
- email (varchar, nullable)
- role (enum: customer/vendor/admin)
- isActive (varchar, default: 'true')
- createdAt (timestamp)
- updatedAt (timestamp)

### otp_verifications
- id (uuid, primary key)
- phoneNumber (varchar)
- otp (varchar, 6 digits)
- expiresAt (timestamp)
- isUsed (varchar, default: 'false')
- createdAt (timestamp)
