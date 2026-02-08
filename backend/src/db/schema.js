import { pgTable, uuid, varchar, timestamp, pgEnum, serial, integer, doublePrecision, text, boolean, jsonb } from 'drizzle-orm/pg-core';

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['customer', 'vendor', 'admin']);

// Enum for vendor status
export const vendorStatusEnum = pgEnum('vendor_status', ['pending', 'approved', 'rejected', 'blocked']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: varchar('phone_number', { length: 15 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  role: userRoleEnum('role').notNull().default('customer'),
  isActive: varchar('is_active', { length: 10 }).notNull().default('true'),
  isBlocked: boolean('is_blocked').notNull().default(false),
  blockedAt: timestamp('blocked_at'),
  blockedBy: uuid('blocked_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// OTP Verifications table
export const otpVerifications = pgTable('otp_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: varchar('phone_number', { length: 15 }).notNull(),
  otp: varchar('otp', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: varchar('is_used', { length: 10 }).notNull().default('false'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Vendors table
export const vendors = pgTable('vendors', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  storeName: varchar('store_name', { length: 80 }).notNull(),
  ownerName: varchar('owner_name', { length: 80 }).notNull(),
  phone: varchar('phone', { length: 15 }).notNull(),
  documentUrl: text('document_url').notNull(),
  storeAddress: text('store_address'),
  pincode: varchar('pincode', { length: 10 }),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  serviceAreas: jsonb('service_areas').$type().default([]), // Array of pincodes/area names
  bankDetails: jsonb('bank_details').$type(), // { accountNumber, ifscCode, accountHolderName, bankName, branchName }
  adminNotes: jsonb('admin_notes').$type().default([]), // Array of { note, timestamp, addedBy? }
  requiredDocuments: jsonb('required_documents').$type().default([]), // Array of { name, status: 'pending'|'submitted'|'verified', url?, note? }
  status: vendorStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 80 }).notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Sub-Categories table
export const subCategories = pgTable('sub_categories', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Units table
export const units = pgTable('units', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(), // e.g., "Pieces", "Box", "Carton"
  abbreviation: varchar('abbreviation', { length: 20 }).notNull().unique(), // e.g., "pcs", "box", "carton"
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Items table
export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  subCategoryId: integer('sub_category_id').references(() => subCategories.id, { onDelete: 'set null' }),
  unitId: integer('unit_id').references(() => units.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 140 }).notNull().unique(),
  sku: varchar('sku', { length: 50 }), // SKU/Part Number
  brand: varchar('brand', { length: 100 }), // Brand
  subCategory: varchar('sub_category', { length: 100 }), // Legacy field - keeping for backward compatibility
  description: text('description'),
  price: varchar('price', { length: 20 }).notNull(),
  tax: varchar('tax', { length: 10 }).default('0'), // Tax percentage
  serviceTime: integer('service_time').default(0), // Service/Lead time in minutes
  unitType: varchar('unit_type', { length: 20 }).default('pcs'), // Legacy field - keeping for backward compatibility
  imageUrl: text('image_url'),
  isActive: varchar('is_active', { length: 10 }).notNull().default('true'),
  stock: integer('stock').notNull().default(0),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Address Type Enum
export const addressTypeEnum = pgEnum('address_type', ['home', 'work', 'other']);

// Addresses table
export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 15 }).notNull(),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  pincode: varchar('pincode', { length: 10 }).notNull(),
  landmark: varchar('landmark', { length: 255 }).notNull(),
  addressType: addressTypeEnum('address_type').notNull().default('home'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// System Configuration table
export const systemConfig = pgTable('system_config', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // 'assignment', 'pricing', 'order', 'general'
  dataType: varchar('data_type', { length: 20 }).notNull().default('string'), // 'string', 'number', 'boolean', 'json'
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Activity Action Enum
export const activityActionEnum = pgEnum('activity_action', [
  'create', 'update', 'delete', 'approve', 'reject', 'block', 'unblock',
  'login', 'logout', 'export', 'upload', 'download', 'view', 'assign'
]);

// Activity Entity Enum
export const activityEntityEnum = pgEnum('activity_entity', [
  'user', 'vendor', 'category', 'subcategory', 'unit', 'item', 
  'order', 'payment', 'report', 'settings'
]);

// Activity Logs table
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: activityActionEnum('action').notNull(),
  entity: activityEntityEnum('entity').notNull(),
  entityId: varchar('entity_id', { length: 50 }), // Can be UUID or integer as string
  description: text('description').notNull(),
  metadata: jsonb('metadata').$type(), // Additional context data
  ipAddress: varchar('ip_address', { length: 45 }), // IPv4 or IPv6
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Import and re-export orders module schemas
export {
  orders,
  orderItems,
  orderAssignments,
  payments,
  orderLogs,
  orderStatusEnum,
  paymentStatusEnum,
  paymentMethodEnum,
  assignmentStatusEnum,
} from '../modules/orders/schema.js';
