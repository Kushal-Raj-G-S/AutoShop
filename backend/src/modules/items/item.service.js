import { db } from '../../db/index.js';
import { items, categories, orderItems } from '../../db/schema.js';
import { eq, and, sql, ilike, or, gte, lte, desc, asc } from 'drizzle-orm';
import { generateSlug, ensureUniqueSlug } from '../../utils/slug.js';
import { uploadItemImage, deleteItemImage, isSupabaseConfigured } from '../../utils/supabase.js';

// Helper to convert DB string 'true'/'false' to boolean
const parseIsActive = (value) => value === 'true';

class ItemService {
  /**
   * Create a new item (admin only)
   */
  async createItem(payload, actor) {
    // Authorization check
    if (actor.role !== 'admin') {
      throw new Error('FORBIDDEN: Only admins can create items');
    }

    const { 
      categoryId, 
      name, 
      sku,
      brand,
      subCategory,
      description, 
      price, 
      tax,
      serviceTime,
      unitType,
      imageUrl, 
      stock, 
      metadata 
    } = payload;

    // Validate category exists
    const categoryExists = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (categoryExists.length === 0) {
      throw new Error('VALIDATION: Category not found');
    }

    // Validate price
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      throw new Error('VALIDATION: Price must be a non-negative number');
    }

    // Validate tax
    if (tax !== undefined && (isNaN(parseFloat(tax)) || parseFloat(tax) < 0 || parseFloat(tax) > 100)) {
      throw new Error('VALIDATION: Tax must be between 0 and 100');
    }

    // Validate service time
    if (serviceTime !== undefined && (isNaN(parseInt(serviceTime)) || parseInt(serviceTime) < 0)) {
      throw new Error('VALIDATION: Service time must be a non-negative integer');
    }

    // Validate stock
    if (stock !== undefined && (isNaN(parseInt(stock)) || parseInt(stock) < 0)) {
      throw new Error('VALIDATION: Stock must be a non-negative integer');
    }

    // Generate unique slug
    const baseSlug = generateSlug(name);
    const uniqueSlug = await ensureUniqueSlug(baseSlug, items);

    // Handle image upload to Supabase if configured and imageUrl is base64
    let finalImageUrl = imageUrl || null;
    if (imageUrl && imageUrl.startsWith('data:') && isSupabaseConfigured()) {
      try {
        console.log('📤 Uploading image to Supabase for new item...');
        
        // Get category name for folder structure
        const [category] = await db
          .select({ name: categories.name })
          .from(categories)
          .where(eq(categories.id, categoryId))
          .limit(1);
        
        const categoryName = category?.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'uncategorized';
        const itemNameSlug = name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const fileName = `items/${categoryName}/${itemNameSlug}/${Date.now()}.jpg`;
        
        finalImageUrl = await uploadItemImage(imageUrl, fileName);
        console.log('✅ Image uploaded to Supabase:', finalImageUrl);
      } catch (error) {
        console.error('⚠️  Supabase upload failed, falling back to base64:', error);
        // Fallback to base64 if upload fails
        finalImageUrl = imageUrl;
      }
    }

    // Create item in transaction
    const result = await db.transaction(async (tx) => {
      const [newItem] = await tx.insert(items).values({
        categoryId,
        name,
        sku: sku || null,
        brand: brand || null,
        subCategory: subCategory || null,
        slug: uniqueSlug,
        description: description || null,
        price: price.toString(),
        tax: tax !== undefined ? tax.toString() : '0',
        serviceTime: serviceTime || 0,
        unitType: unitType || 'pcs',
        imageUrl: finalImageUrl,
        stock: stock !== undefined ? stock : 0,
        metadata: metadata || null,
        isActive: 'true', // Store as string
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return newItem;
    });

    return result;
  }

  /**
   * Update an existing item (admin only)
   */
  async updateItem(id, payload, actor) {
    // Authorization check
    if (actor.role !== 'admin') {
      throw new Error('FORBIDDEN: Only admins can update items');
    }

    // Check if item exists
    const existingItem = await db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1);

    if (existingItem.length === 0) {
      throw new Error('NOT_FOUND: Item not found');
    }

    const updateData = { updatedAt: new Date() };

    // Handle name change -> update slug
    if (payload.name && payload.name !== existingItem[0].name) {
      const baseSlug = generateSlug(payload.name);
      updateData.slug = await ensureUniqueSlug(baseSlug, items, id);
      updateData.name = payload.name;
    }

    // Validate and update other fields
    if (payload.categoryId !== undefined) {
      const categoryExists = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, payload.categoryId))
        .limit(1);

      if (categoryExists.length === 0) {
        throw new Error('VALIDATION: Category not found');
      }
      updateData.categoryId = payload.categoryId;
    }

    if (payload.description !== undefined) {
      updateData.description = payload.description;
    }

    if (payload.sku !== undefined) {
      updateData.sku = payload.sku;
    }

    if (payload.brand !== undefined) {
      updateData.brand = payload.brand;
    }

    if (payload.subCategory !== undefined) {
      updateData.subCategory = payload.subCategory;
    }

    if (payload.price !== undefined) {
      if (isNaN(parseFloat(payload.price)) || parseFloat(payload.price) < 0) {
        throw new Error('VALIDATION: Price must be a non-negative number');
      }
      updateData.price = payload.price.toString();
    }

    if (payload.tax !== undefined) {
      if (isNaN(parseFloat(payload.tax)) || parseFloat(payload.tax) < 0 || parseFloat(payload.tax) > 100) {
        throw new Error('VALIDATION: Tax must be between 0 and 100');
      }
      updateData.tax = payload.tax.toString();
    }

    if (payload.serviceTime !== undefined) {
      if (isNaN(parseInt(payload.serviceTime)) || parseInt(payload.serviceTime) < 0) {
        throw new Error('VALIDATION: Service time must be a non-negative integer');
      }
      updateData.serviceTime = payload.serviceTime;
    }

    if (payload.unitType !== undefined) {
      updateData.unitType = payload.unitType;
    }

    if (payload.imageUrl !== undefined) {
      // Handle image upload to Supabase if new base64 image provided
      if (payload.imageUrl && payload.imageUrl.startsWith('data:') && isSupabaseConfigured()) {
        try {
          console.log('📤 Uploading new image to Supabase...');
          
          // Get current item details for folder structure
          const [existingItem] = await db
            .select({ 
              imageUrl: items.imageUrl, 
              name: items.name, 
              categoryId: items.categoryId 
            })
            .from(items)
            .where(eq(items.id, id))
            .limit(1);
          
          // Delete old image from Supabase if it exists
          if (existingItem && existingItem.imageUrl && existingItem.imageUrl.includes('supabase')) {
            console.log('🗑️  Deleting old image from Supabase...');
            await deleteItemImage(existingItem.imageUrl);
          }
          
          // Get category name for folder structure
          const [category] = await db
            .select({ name: categories.name })
            .from(categories)
            .where(eq(categories.id, existingItem.categoryId))
            .limit(1);
          
          const categoryName = category?.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'uncategorized';
          const itemName = (payload.name || existingItem.name).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
          const fileName = `items/${categoryName}/${itemName}/${Date.now()}.jpg`;
          
          // Upload new image
          const newImageUrl = await uploadItemImage(payload.imageUrl, fileName);
          updateData.imageUrl = newImageUrl;
          console.log('✅ New image uploaded to Supabase:', newImageUrl);
        } catch (error) {
          console.error('⚠️  Supabase upload failed, falling back to base64:', error);
          updateData.imageUrl = payload.imageUrl;
        }
      } else {
        updateData.imageUrl = payload.imageUrl;
      }
    }

    if (payload.stock !== undefined) {
      if (isNaN(parseInt(payload.stock)) || parseInt(payload.stock) < 0) {
        throw new Error('VALIDATION: Stock must be a non-negative integer');
      }
      updateData.stock = payload.stock;
    }

    if (payload.isActive !== undefined) {
      // Convert boolean to string for VARCHAR column
      updateData.isActive = payload.isActive ? 'true' : 'false';
    }

    if (payload.metadata !== undefined) {
      updateData.metadata = payload.metadata;
    }

    const [updatedItem] = await db
      .update(items)
      .set(updateData)
      .where(eq(items.id, id))
      .returning();

    return updatedItem;
  }

  /**
   * Delete an item (admin only)
   */
  async deleteItem(id, actor) {
    // Authorization check
    if (actor.role !== 'admin') {
      throw new Error('FORBIDDEN: Only admins can delete items');
    }

    // Check if item exists
    const existingItem = await db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1);

    if (existingItem.length === 0) {
      throw new Error('NOT_FOUND: Item not found');
    }

    // Check if item has orders
    const hasOrders = await db
      .select({ count: sql`count(*)::int` })
      .from(orderItems)
      .where(eq(orderItems.itemId, id));

    if (hasOrders[0].count > 0) {
      throw new Error('CONFLICT: Cannot delete item. It is referenced by existing orders. Please use Retire instead.');
    }

    // Delete the item
    await db.delete(items).where(eq(items.id, id));
    return { deleted: true };
  }

  /**
   * Check which items can be deleted (no orders)
   */
  async checkDeletableItems(ids, actor) {
    if (actor.role !== 'admin') {
      throw new Error('FORBIDDEN: Only admins can check items');
    }

    const results = {
      deletable: [],
      nonDeletable: [],
    };

    for (const id of ids) {
      // Check if item has orders
      const hasOrders = await db
        .select({ count: sql`count(*)::int` })
        .from(orderItems)
        .where(eq(orderItems.itemId, id));

      if (hasOrders[0].count > 0) {
        results.nonDeletable.push({ id, reason: 'Has existing orders' });
      } else {
        results.deletable.push(id);
      }
    }

    return results;
  }

  /**
   * Retire an item (set isActive to false) - safer than deletion
   */
  async retireItem(id, actor) {
    // Authorization check
    if (actor.role !== 'admin') {
      throw new Error('FORBIDDEN: Only admins can retire items');
    }

    // Check if item exists
    const existingItem = await db
      .select()
      .from(items)
      .where(eq(items.id, id))
      .limit(1);

    if (existingItem.length === 0) {
      throw new Error('NOT_FOUND: Item not found');
    }

    // Retire the item by setting isActive to false
    const [retiredItem] = await db
      .update(items)
      .set({ 
        isActive: 'false', // Store as string
        updatedAt: new Date()
      })
      .where(eq(items.id, id))
      .returning();

    return retiredItem;
  }

  /**
   * Get item by ID
   */
  async getItemById(id, actorOrPublic) {
    const item = await db
      .select({
        id: items.id,
        categoryId: items.categoryId,
        name: items.name,
        sku: items.sku,
        brand: items.brand,
        subCategory: items.subCategory,
        slug: items.slug,
        description: items.description,
        price: items.price,
        tax: items.tax,
        serviceTime: items.serviceTime,
        unitType: items.unitType,
        imageUrl: items.imageUrl,
        isActive: items.isActive,
        stock: items.stock,
        metadata: items.metadata,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
        categoryName: categories.name,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(items.id, id))
      .limit(1);

    if (item.length === 0) {
      throw new Error('NOT_FOUND: Item not found');
    }

    // Convert isActive string to boolean
    const itemData = {
      ...item[0],
      isActive: parseIsActive(item[0].isActive),
    };

    // Hide inactive items from non-admins
    if (!itemData.isActive && (!actorOrPublic || actorOrPublic.role !== 'admin')) {
      throw new Error('NOT_FOUND: Item not found');
    }

    return itemData;
  }

  /**
   * List items for public with filters and pagination
   */
  async listItemsPublic(filters = {}) {
    const {
      page = 1,
      limit = 20,
      q,
      categoryId,
      minPrice,
      maxPrice,
      sort = 'created_at_desc',
    } = filters;

    const offset = (page - 1) * limit;
    const conditions = [eq(items.isActive, 'true')]; // Compare with string

    // Text search on name and description
    if (q) {
      conditions.push(
        or(
          ilike(items.name, `%${q}%`),
          ilike(items.description, `%${q}%`)
        )
      );
    }

    // Category filter
    if (categoryId) {
      conditions.push(eq(items.categoryId, parseInt(categoryId)));
    }

    // Price range filters
    if (minPrice !== undefined && !isNaN(parseFloat(minPrice))) {
      conditions.push(gte(items.price, minPrice.toString()));
    }

    if (maxPrice !== undefined && !isNaN(parseFloat(maxPrice))) {
      conditions.push(lte(items.price, maxPrice.toString()));
    }

    // Build where clause
    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Determine sort order
    let orderBy;
    switch (sort) {
      case 'price_asc':
        orderBy = asc(items.price);
        break;
      case 'price_desc':
        orderBy = desc(items.price);
        break;
      case 'created_at_asc':
        orderBy = asc(items.createdAt);
        break;
      case 'created_at_desc':
      default:
        orderBy = desc(items.createdAt);
        break;
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)::int` })
      .from(items)
      .where(whereClause);

    // Get paginated items
    const itemsList = await db
      .select({
        id: items.id,
        categoryId: items.categoryId,
        name: items.name,
        slug: items.slug,
        description: items.description,
        price: items.price,
        stock: items.stock,
        imageUrl: items.imageUrl,
        isActive: items.isActive,
        createdAt: items.createdAt,
        categoryName: categories.name,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(count / limit);

    return {
      items: itemsList,
      meta: {
        page,
        limit,
        total: count,
        totalPages,
      },
    };
  }

  /**
   * List all items for admin (no active filter)
   */
  async listItemsAdmin(filters = {}) {
    const { page = 1, limit = 20, q } = filters;
    const offset = (page - 1) * limit;

    let whereClause = undefined;

    // Text search
    if (q) {
      whereClause = or(
        ilike(items.name, `%${q}%`),
        ilike(items.description, `%${q}%`)
      );
    }

    // Get total count
    const countQuery = whereClause
      ? db.select({ count: sql`count(*)::int` }).from(items).where(whereClause)
      : db.select({ count: sql`count(*)::int` }).from(items);

    const [{ count }] = await countQuery;

    // Get paginated items with full details
    const query = db
      .select({
        id: items.id,
        categoryId: items.categoryId,
        name: items.name,
        sku: items.sku,
        brand: items.brand,
        subCategory: items.subCategory,
        slug: items.slug,
        description: items.description,
        price: items.price,
        tax: items.tax,
        serviceTime: items.serviceTime,
        unitType: items.unitType,
        imageUrl: items.imageUrl,
        isActive: items.isActive,
        stock: items.stock,
        metadata: items.metadata,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
        categoryName: categories.name,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .orderBy(desc(items.createdAt))
      .limit(limit)
      .offset(offset);

    const itemsList = whereClause ? await query.where(whereClause) : await query;

    // Convert isActive string to boolean for all items
    const itemsWithBoolean = itemsList.map(item => ({
      ...item,
      isActive: parseIsActive(item.isActive),
    }));

    const totalPages = Math.ceil(count / limit);

    return {
      items: itemsWithBoolean,
      meta: {
        page,
        limit,
        total: count,
        totalPages,
      },
    };
  }

  /**
   * Bulk create items from CSV data (admin only)
   */
  async bulkCreateItems(itemsData, actor) {
    if (actor.role !== 'admin') {
      throw new Error('FORBIDDEN: Only admins can bulk create items');
    }

    const results = {
      successful: [],
      failed: [],
    };

    // Process each item
    for (let i = 0; i < itemsData.length; i++) {
      const itemData = itemsData[i];
      try {
        // Validate required fields
        if (!itemData.name || !itemData.categoryId || !itemData.price) {
          throw new Error('Missing required fields: name, categoryId, or price');
        }

        // Check for duplicate SKU if provided
        if (itemData.sku) {
          const existingItem = await db
            .select({ id: items.id, name: items.name })
            .from(items)
            .where(eq(items.sku, itemData.sku))
            .limit(1);
          
          if (existingItem.length > 0) {
            throw new Error(`Duplicate SKU '${itemData.sku}' - Item already exists: ${existingItem[0].name}`);
          }
        }

        // Create item using existing createItem method
        const newItem = await this.createItem(
          {
            categoryId: parseInt(itemData.categoryId),
            name: itemData.name,
            sku: itemData.sku,
            brand: itemData.brand,
            subCategory: itemData.subCategory,
            description: itemData.description,
            price: parseFloat(itemData.price),
            tax: itemData.tax ? parseFloat(itemData.tax) : 0,
            serviceTime: itemData.serviceTime ? parseInt(itemData.serviceTime) : 0,
            unitType: itemData.unitType || 'pcs',
            imageUrl: itemData.imageUrl,
            stock: itemData.stock ? parseInt(itemData.stock) : 0,
          },
          actor
        );

        results.successful.push({
          row: i + 2, // +2 because row 1 is headers and array is 0-indexed
          item: newItem,
        });
      } catch (error) {
        results.failed.push({
          row: i + 2,
          data: itemData,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Bulk update items (admin only)
   */
  async bulkUpdateItems(updates, actor) {
    if (actor.role !== 'admin') {
      throw new Error('FORBIDDEN: Only admins can bulk update items');
    }

    const results = {
      successful: [],
      failed: [],
    };

    for (const update of updates) {
      try {
        const { id, ...updateData } = update;
        
        if (!id) {
          throw new Error('Item ID is required');
        }

        const updatedItem = await this.updateItem(id, updateData, actor);
        
        results.successful.push({
          id,
          item: updatedItem,
        });
      } catch (error) {
        results.failed.push({
          id: update.id,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Bulk delete items (admin only)
   */
  async bulkDeleteItems(ids, actor) {
    if (actor.role !== 'admin') {
      throw new Error('FORBIDDEN: Only admins can bulk delete items');
    }

    const results = {
      successful: [],
      failed: [],
    };

    for (const id of ids) {
      try {
        await this.deleteItem(id, actor);
        results.successful.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Bulk retire items (set isActive to false) - safer than deletion
   */
  async bulkRetireItems(ids, actor) {
    if (actor.role !== 'admin') {
      throw new Error('FORBIDDEN: Only admins can bulk retire items');
    }

    const results = {
      successful: [],
      failed: [],
    };

    for (const id of ids) {
      try {
        await this.retireItem(id, actor);
        results.successful.push(id);
      } catch (error) {
        results.failed.push({
          id,
          error: error.message,
        });
      }
    }

    return results;
  }
}

export default new ItemService();
