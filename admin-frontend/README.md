# Admin Panel Frontend

A production-grade Admin Panel built with Next.js 15, TypeScript, TailwindCSS, and ShadCN UI.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **TailwindCSS**
- **ShadCN UI** components
- **Axios** for API calls
- **TanStack React Query** for data fetching and caching
- **React Hook Form** + **Zod** for form validation
- **JWT** authentication

## Features

### Authentication
- Phone number OTP-based admin authentication
- JWT token-based authorization
- Role-based access control (admin only)
- Automatic token refresh and validation

### Dashboard
- Real-time statistics display
- Pending/Active vendors count
- Total categories and items
- Order metrics (total and today's orders)
- Recent orders table

### Vendor Management
- List all vendors with filters (pending/approved/rejected)
- View vendor details
- Approve or reject vendors
- Search vendors by name, phone, or email
- Pagination support

### Category Management
- CRUD operations for categories
- Active/Inactive status toggle
- Category listing with filters
- Image URL support

### Item Management
- CRUD operations for items
- Category assignment
- Price and stock management
- Active/Inactive status
- Search and filter by category

### Order Management
- View all orders with pagination
- Filter by status (pending/assigned/in-progress/completed/cancelled)
- View detailed order information
- Force assign orders to vendors
- Cancel orders with reason
- Assignment history tracking
- Order items breakdown

## Project Structure

```
admin-frontend/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   └── page.tsx             # Dashboard home with stats
│   ├── vendors/
│   │   ├── page.tsx             # Vendor list
│   │   └── [id]/
│   │       └── page.tsx         # Vendor detail and approval
│   ├── categories/
│   │   ├── page.tsx             # Category list
│   │   ├── new/
│   │   │   └── page.tsx         # Create category
│   │   └── [id]/
│   │       └── page.tsx         # Edit category
│   ├── items/
│   │   ├── page.tsx             # Item list
│   │   ├── new/
│   │   │   └── page.tsx         # Create item
│   │   └── [id]/
│   │       └── page.tsx         # Edit item
│   ├── orders/
│   │   ├── page.tsx             # Order list
│   │   └── [id]/
│   │       └── page.tsx         # Order detail
│   ├── login/
│   │   └── page.tsx             # Admin login
│   ├── layout.tsx               # Root layout with QueryClient
│   ├── page.tsx                 # Home page (redirects to login)
│   └── globals.css              # Global styles
├── components/
│   └── ui/                      # ShadCN UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── table.tsx
│       └── badge.tsx
├── lib/
│   ├── api/                     # API client modules
│   │   ├── axios.ts             # Axios instance with interceptors
│   │   ├── auth.ts              # Auth API calls
│   │   ├── vendors.ts           # Vendor API calls
│   │   ├── categories.ts        # Category API calls
│   │   ├── items.ts             # Item API calls
│   │   └── orders.ts            # Order API calls
│   ├── utils/
│   │   └── validateRole.ts      # JWT role validation
│   └── utils.ts                 # Utility functions
├── hooks/
│   └── useAuth.ts               # Authentication hook
├── middleware.ts                # Route protection middleware
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## Environment Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure backend URL:**
   Update the `baseURL` in `lib/api/axios.ts` if your backend is not running on `http://localhost:5000/api`

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:3000`

## API Endpoints Used

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and get token

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/vendors` - Get vendor list
- `GET /api/admin/vendors/:id` - Get vendor details
- `PATCH /api/admin/vendors/:id/approve` - Approve vendor
- `PATCH /api/admin/vendors/:id/reject` - Reject vendor
- `GET /api/admin/categories` - Get categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `GET /api/admin/items` - Get items
- `POST /api/admin/items` - Create item
- `PUT /api/admin/items/:id` - Update item
- `DELETE /api/admin/items/:id` - Delete item
- `GET /api/admin/orders` - Get orders
- `GET /api/admin/orders/:id` - Get order details
- `POST /api/admin/orders/:id/force-assign` - Force assign order
- `POST /api/admin/orders/:id/cancel` - Cancel order

## Authentication Flow

1. User enters phone number
2. Backend sends OTP
3. User enters OTP
4. Backend verifies and returns JWT token
5. Token is stored in localStorage
6. All subsequent requests include `Authorization: Bearer <token>` header
7. If token expires or is invalid (401), user is redirected to login

## Key Features

### Automatic Token Management
- Axios interceptor automatically attaches JWT token to all requests
- Handles 401 responses by clearing token and redirecting to login

### Role Validation
- JWT token is decoded to verify `role === "admin"`
- Non-admin users are denied access

### React Query Caching
- All data fetching uses React Query for optimal performance
- Automatic cache invalidation on mutations
- Stale data refetching

### Form Validation
- Zod schemas for type-safe validation
- React Hook Form integration
- Real-time error display

### Responsive Design
- TailwindCSS utility classes
- Mobile-friendly layouts
- Sidebar navigation

## Production Build

```bash
npm run build
npm start
```

## Development Tips

1. **Hot Reload:** The development server supports hot module replacement
2. **Type Safety:** All API responses are typed with TypeScript interfaces
3. **Error Handling:** API errors are caught and displayed to users
4. **Loading States:** All async operations show loading indicators
5. **Optimistic Updates:** React Query handles optimistic UI updates

## Security

- Admin role validation on every protected route
- Token expiration checking
- Secure localStorage token storage
- HTTPS recommended for production
- Input validation on all forms

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
