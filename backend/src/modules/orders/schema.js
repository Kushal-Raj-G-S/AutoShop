import { pgTable, serial, uuid, integer, varchar, text, numeric, timestamp, pgEnum, doublePrecision, boolean } from 'drizzle-orm/pg-core';
import { users, vendors, items } from '../../db/schema.js';

// Enums
export const orderStatusEnum = pgEnum('order_status', [
  'pending_payment',
  'payment_failed',
  'awaiting_assignment',
  'assigned',
  'vendor_accepted',
  'in_progress',
  'completed',
  'cancelled',
  'refunded'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'initiated',
  'success',
  'failed',
  'refunded'
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'razorpay',
  'cod',
  'wallet'
]);

export const assignmentStatusEnum = pgEnum('assignment_status', [
  'PUSHED',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED'
]);

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderId: varchar('order_id', { length: 50 }).notNull().unique(), // e.g., ORD-2025-001
  userId: uuid('user_id').notNull().references(() => users.id),
  
  // Address (denormalized for order history)
  deliveryAddress: text('delivery_address').notNull(),
  deliveryLatitude: doublePrecision('delivery_latitude').notNull(),
  deliveryLongitude: doublePrecision('delivery_longitude').notNull(),
  deliveryPhone: varchar('delivery_phone', { length: 15 }).notNull(),
  
  // Order details
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: numeric('tax', { precision: 10, scale: 2 }).default('0'),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  
  // Status
  status: orderStatusEnum('status').notNull().default('pending_payment'),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  
  // Assignment
  assignedVendorId: integer('assigned_vendor_id').references(() => vendors.id),
  assignedAt: timestamp('assigned_at'),
  acceptedAt: timestamp('accepted_at'),
  
  // Completion
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  // Cancellation
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: uuid('cancelled_by').references(() => users.id),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Order Items table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  itemId: integer('item_id').notNull().references(() => items.id),
  
  // Snapshot at order time
  itemName: varchar('item_name', { length: 120 }).notNull(),
  itemPrice: numeric('item_price', { precision: 10, scale: 2 }).notNull(),
  itemImageUrl: text('item_image_url'),
  
  quantity: integer('quantity').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Order Assignments table (tracks vendor assignment attempts)
export const orderAssignments = pgTable('order_assignments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  vendorId: integer('vendor_id').notNull().references(() => vendors.id),
  
  status: assignmentStatusEnum('status').notNull().default('PUSHED'),
  
  // Timestamps
  pushedAt: timestamp('pushed_at').notNull().defaultNow(),
  respondedAt: timestamp('responded_at'),
  expiresAt: timestamp('expires_at'),
  
  // Metadata (JSONB for flexible data)
  meta: text('meta'), // Stored as JSON string: { distance: 5.2, batchNumber: 1, rejectionReason: "..." }
});

// Payments table
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  
  // Razorpay details
  razorpayOrderId: varchar('razorpay_order_id', { length: 100 }),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 100 }),
  razorpaySignature: varchar('razorpay_signature', { length: 255 }),
  
  // Payment details
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('INR'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  
  // Metadata
  providerResponse: text('provider_response'), // JSON string
  failureReason: text('failure_reason'),
  
  // Refund
  refundedAmount: numeric('refunded_amount', { precision: 10, scale: 2 }).default('0'),
  refundedAt: timestamp('refunded_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Order Logs table (audit trail)
export const orderLogs = pgTable('order_logs', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  
  action: varchar('action', { length: 50 }).notNull(), // e.g., created, payment_success, assigned, accepted, started, completed, cancelled
  actor: varchar('actor', { length: 20 }).notNull(), // customer, vendor, admin, system
  actorId: uuid('actor_id'), // references users.id or null for system
  
  metadata: text('metadata'), // JSON string with additional context
  message: text('message'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
