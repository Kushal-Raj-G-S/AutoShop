import { pgTable, uuid, varchar, timestamp, pgEnum, serial, integer, doublePrecision, text, boolean } from 'drizzle-orm/pg-core';

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['customer', 'vendor', 'admin']);

// Enum for vendor status
export const vendorStatusEnum = pgEnum('vendor_status', ['pending', 'approved', 'rejected']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: varchar('phone_number', { length: 15 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  role: userRoleEnum('role').notNull().default('customer'),
  isActive: varchar('is_active', { length: 10 }).notNull().default('true'),
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
  status: vendorStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 80 }).notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Items table
export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 120 }).notNull(),
  slug: varchar('slug', { length: 140 }).notNull().unique(),
  sku: varchar('sku', { length: 50 }), // SKU/Part Number
  brand: varchar('brand', { length: 100 }), // Brand
  subCategory: varchar('sub_category', { length: 100 }), // Sub-category
  description: text('description'),
  price: varchar('price', { length: 20 }).notNull(),
  tax: varchar('tax', { length: 10 }).default('0'), // Tax percentage
  serviceTime: integer('service_time').default(0), // Service/Lead time in minutes
  unitType: varchar('unit_type', { length: 20 }).default('pcs'), // pcs|box|carton
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
