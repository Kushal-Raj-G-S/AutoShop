import { db } from '../../db/index.js';
import { subCategories, categories } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';

class SubCategoryService {
  // Create sub-category
  async createSubCategory(payload) {
    try {
      const { categoryId, name, description, isActive } = payload;

      // Check if category exists
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1);

      if (!category) {
        throw new Error('Category not found');
      }

      // Check if sub-category with same name already exists in this category
      const [existingSubCategory] = await db
        .select()
        .from(subCategories)
        .where(and(
          eq(subCategories.categoryId, categoryId),
          eq(subCategories.name, name)
        ))
        .limit(1);

      if (existingSubCategory) {
        throw new Error('Sub-category with this name already exists in this category');
      }

      // Create sub-category
      const [newSubCategory] = await db
        .insert(subCategories)
        .values({
          categoryId,
          name: name.trim(),
          description: description?.trim() || null,
          isActive: isActive !== undefined ? isActive : true,
        })
        .returning();

      return {
        success: true,
        message: 'Sub-category created successfully',
        subCategory: newSubCategory,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to create sub-category');
    }
  }

  // Update sub-category
  async updateSubCategory(id, payload) {
    try {
      const { categoryId, name, description, isActive } = payload;

      // Check if sub-category exists
      const [existingSubCategory] = await db
        .select()
        .from(subCategories)
        .where(eq(subCategories.id, id))
        .limit(1);

      if (!existingSubCategory) {
        throw new Error('Sub-category not found');
      }

      // If categoryId is being updated, check if category exists
      if (categoryId && categoryId !== existingSubCategory.categoryId) {
        const [category] = await db
          .select()
          .from(categories)
          .where(eq(categories.id, categoryId))
          .limit(1);

        if (!category) {
          throw new Error('Category not found');
        }
      }

      // If name is being updated, check for duplicates in the same category
      if (name && name !== existingSubCategory.name) {
        const targetCategoryId = categoryId || existingSubCategory.categoryId;
        const [duplicateSubCategory] = await db
          .select()
          .from(subCategories)
          .where(and(
            eq(subCategories.categoryId, targetCategoryId),
            eq(subCategories.name, name)
          ))
          .limit(1);

        if (duplicateSubCategory) {
          throw new Error('Sub-category with this name already exists in this category');
        }
      }

      // Build update object
      const updateData = {
        updatedAt: new Date(),
      };
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Update sub-category
      const [updatedSubCategory] = await db
        .update(subCategories)
        .set(updateData)
        .where(eq(subCategories.id, id))
        .returning();

      return {
        success: true,
        message: 'Sub-category updated successfully',
        subCategory: updatedSubCategory,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to update sub-category');
    }
  }

  // Delete sub-category
  async deleteSubCategory(id) {
    try {
      // Check if sub-category exists
      const [existingSubCategory] = await db
        .select()
        .from(subCategories)
        .where(eq(subCategories.id, id))
        .limit(1);

      if (!existingSubCategory) {
        throw new Error('Sub-category not found');
      }

      // Delete sub-category
      await db
        .delete(subCategories)
        .where(eq(subCategories.id, id));

      return {
        success: true,
        message: 'Sub-category deleted successfully',
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete sub-category');
    }
  }

  // Get sub-category by ID
  async getSubCategoryById(id) {
    try {
      const [subCategory] = await db
        .select({
          id: subCategories.id,
          categoryId: subCategories.categoryId,
          name: subCategories.name,
          description: subCategories.description,
          isActive: subCategories.isActive,
          createdAt: subCategories.createdAt,
          updatedAt: subCategories.updatedAt,
          categoryName: categories.name,
        })
        .from(subCategories)
        .leftJoin(categories, eq(subCategories.categoryId, categories.id))
        .where(eq(subCategories.id, id))
        .limit(1);

      if (!subCategory) {
        throw new Error('Sub-category not found');
      }

      return subCategory;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch sub-category');
    }
  }

  // List all sub-categories
  async listSubCategories(filters = {}) {
    try {
      const { categoryId, isActive } = filters;
      
      let query = db
        .select({
          id: subCategories.id,
          categoryId: subCategories.categoryId,
          name: subCategories.name,
          description: subCategories.description,
          isActive: subCategories.isActive,
          createdAt: subCategories.createdAt,
          updatedAt: subCategories.updatedAt,
          categoryName: categories.name,
        })
        .from(subCategories)
        .leftJoin(categories, eq(subCategories.categoryId, categories.id))
        .orderBy(subCategories.name);

      const conditions = [];
      if (categoryId) conditions.push(eq(subCategories.categoryId, categoryId));
      if (isActive !== undefined) conditions.push(eq(subCategories.isActive, isActive));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const allSubCategories = await query;

      return allSubCategories;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch sub-categories');
    }
  }
}

export default new SubCategoryService();
