import { db } from '../../db/index.js';
import { categories } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { uploadCategoryImage, deleteCategoryImage, isSupabaseConfigured } from '../../utils/supabase.js';

class CategoryService {
  // Create category
  async createCategory(payload) {
    try {
      const { name, description, imageUrl } = payload;

      // Check if category with same name already exists
      const existingCategory = await db
        .select()
        .from(categories)
        .where(eq(categories.name, name))
        .limit(1);

      if (existingCategory && existingCategory.length > 0) {
        throw new Error('Category with this name already exists');
      }

      // Handle image upload to Supabase if configured and imageUrl is base64
      let finalImageUrl = imageUrl || 'https://placehold.co/600x400?text=No+Image';
      if (imageUrl && imageUrl.startsWith('data:') && isSupabaseConfigured()) {
        try {
          console.log('📤 Uploading category image to Supabase...');
          
          const categoryNameSlug = name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
          const fileName = `categories/${categoryNameSlug}.jpg`;
          
          finalImageUrl = await uploadCategoryImage(imageUrl, fileName);
          console.log('✅ Category image uploaded to Supabase:', finalImageUrl);
        } catch (error) {
          console.error('⚠️  Supabase upload failed, falling back to base64:', error);
          // Fallback to base64 if upload fails
          finalImageUrl = imageUrl;
        }
      }

      // Create category
      const newCategory = await db
        .insert(categories)
        .values({
          name,
          description: description || null,
          imageUrl: finalImageUrl,
        })
        .returning();

      return {
        success: true,
        message: 'Category created successfully',
        category: newCategory[0],
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to create category');
    }
  }

  // Update category
  async updateCategory(id, payload) {
    try {
      const { name, description, imageUrl } = payload;

      // Check if category exists
      const existingCategory = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);

      if (!existingCategory || existingCategory.length === 0) {
        throw new Error('Category not found');
      }

      // If name is being updated, check for duplicates
      if (name && name !== existingCategory[0].name) {
        const duplicateCategory = await db
          .select()
          .from(categories)
          .where(eq(categories.name, name))
          .limit(1);

        if (duplicateCategory && duplicateCategory.length > 0) {
          throw new Error('Category with this name already exists');
        }
      }

      // Build update object
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      
      // Handle image upload if imageUrl is provided and is base64
      if (imageUrl !== undefined) {
        if (imageUrl.startsWith('data:') && isSupabaseConfigured()) {
          try {
            console.log('📤 Uploading updated category image to Supabase...');
            
            const categoryNameSlug = (name || existingCategory[0].name).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            const fileName = `categories/${categoryNameSlug}.jpg`;
            
            // Delete old image if it was stored in Supabase
            if (existingCategory[0].imageUrl && existingCategory[0].imageUrl.includes('/Category-images/')) {
              console.log('🗑️  Deleting old category image before uploading new one...');
              await deleteCategoryImage(existingCategory[0].imageUrl);
            }
            
            const newImageUrl = await uploadCategoryImage(imageUrl, fileName);
            console.log('✅ Updated category image uploaded to Supabase:', newImageUrl);
            
            updateData.imageUrl = newImageUrl;
          } catch (error) {
            console.error('⚠️  Supabase upload failed, falling back to base64:', error);
            updateData.imageUrl = imageUrl;
          }
        } else {
          updateData.imageUrl = imageUrl;
        }
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
      }

      // Update category
      const updatedCategory = await db
        .update(categories)
        .set(updateData)
        .where(eq(categories.id, id))
        .returning();

      return {
        success: true,
        message: 'Category updated successfully',
        category: updatedCategory[0],
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to update category');
    }
  }

  // Delete category
  async deleteCategory(id) {
    try {
      // Check if category exists
      const existingCategory = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);

      if (!existingCategory || existingCategory.length === 0) {
        throw new Error('Category not found');
      }

      // Delete category
      await db
        .delete(categories)
        .where(eq(categories.id, id));

      return {
        success: true,
        message: 'Category deleted successfully',
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete category');
    }
  }

  // Get category by ID
  async getCategoryById(id) {
    try {
      const [category] = await db
        .select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
          imageUrl: categories.imageUrl,
          createdAt: categories.createdAt,
        })
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);

      if (!category) {
        throw new Error('Category not found');
      }

      return category;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch category');
    }
  }

  // List all categories for admin
  async listCategoriesAdmin() {
    try {
      const allCategories = await db
        .select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
          imageUrl: categories.imageUrl,
          createdAt: categories.createdAt,
        })
        .from(categories)
        .orderBy(categories.createdAt);

      return allCategories;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch categories');
    }
  }

  // List all categories for public
  async listCategoriesPublic() {
    try {
      const allCategories = await db
        .select({
          id: categories.id,
          name: categories.name,
          description: categories.description,
          imageUrl: categories.imageUrl,
        })
        .from(categories)
        .orderBy(categories.name);

      return allCategories;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch categories');
    }
  }
}

export default new CategoryService();
