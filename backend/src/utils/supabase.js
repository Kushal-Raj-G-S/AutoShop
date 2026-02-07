import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not configured. Image upload will use base64 storage.');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Upload an image to Supabase Storage
 * @param {Buffer|string} fileData - File buffer or base64 string
 * @param {string} filePath - Full path including folders (e.g., 'items/Auto-Parts/brake-pads/123456.jpg')
 * @param {string} contentType - MIME type (e.g., 'image/jpeg')
 * @returns {Promise<string>} Public URL of uploaded image
 */
async function uploadItemImage(fileData, filePath, contentType = 'image/jpeg') {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    // Handle base64 string
    let buffer = fileData;
    if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      const base64Data = fileData.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
      
      // Extract content type from data URL if not provided
      const matches = fileData.match(/data:([^;]+);/);
      if (matches) {
        contentType = matches[1];
      }
    }

    console.log(`📤 Uploading image to Supabase: ${filePath}`);

    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(filePath, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('item-images')
      .getPublicUrl(filePath);

    console.log(`✅ Image uploaded successfully: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Error uploading to Supabase:', error);
    throw error;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param {string} imageUrl - Full URL or path of the image
 * @returns {Promise<void>}
 */
async function deleteItemImage(imageUrl) {
  if (!supabase || !imageUrl) return;

  try {
    // Extract path from URL
    let path;
    if (imageUrl.includes('/item-images/')) {
      path = imageUrl.split('/item-images/')[1];
    } else if (imageUrl.startsWith('items/')) {
      path = imageUrl;
    } else {
      console.warn('⚠️  Invalid image URL format, skipping deletion');
      return;
    }

    console.log(`🗑️  Deleting image from Supabase: ${path}`);

    const { error } = await supabase.storage
      .from('item-images')
      .remove([path]);

    if (error) {
      console.error('❌ Supabase delete error:', error);
    } else {
      console.log(`✅ Image deleted successfully: ${path}`);
    }
  } catch (error) {
    console.error('❌ Error deleting from Supabase:', error);
  }
}

/**
 * Upload a category image to Supabase Storage
 * @param {Buffer|string} fileData - File buffer or base64 string
 * @param {string} filePath - Full path including folders (e.g., 'categories/electronics/123456.jpg')
 * @param {string} contentType - MIME type (e.g., 'image/jpeg')
 * @returns {Promise<string>} Public URL of uploaded image
 */
async function uploadCategoryImage(fileData, filePath, contentType = 'image/jpeg') {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    // Handle base64 string
    let buffer = fileData;
    if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      const base64Data = fileData.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
      
      // Extract content type from data URL if not provided
      const matches = fileData.match(/data:([^;]+);/);
      if (matches) {
        contentType = matches[1];
      }
    }

    console.log(`📤 Uploading category image to Supabase: ${filePath}`);

    const { data, error } = await supabase.storage
      .from('Category-images')
      .upload(filePath, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('Category-images')
      .getPublicUrl(filePath);

    console.log(`✅ Category image uploaded successfully: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Error uploading category image to Supabase:', error);
    throw error;
  }
}

/**
 * Delete a category image from Supabase Storage
 * @param {string} imageUrl - Full URL or path of the image
 * @returns {Promise<void>}
 */
async function deleteCategoryImage(imageUrl) {
  if (!supabase || !imageUrl) return;

  try {
    // Extract path from URL
    let path;
    if (imageUrl.includes('/Category-images/')) {
      path = imageUrl.split('/Category-images/')[1];
    } else if (imageUrl.startsWith('categories/')) {
      path = imageUrl;
    } else {
      console.warn('⚠️  Invalid category image URL format, skipping deletion');
      return;
    }

    console.log(`🗑️  Deleting category image from Supabase: ${path}`);

    const { error } = await supabase.storage
      .from('Category-images')
      .remove([path]);

    if (error) {
      console.error('❌ Supabase delete error:', error);
    } else {
      console.log(`✅ Category image deleted successfully: ${path}`);
    }
  } catch (error) {
    console.error('❌ Error deleting category image from Supabase:', error);
  }
}

/**
 * Check if Supabase is configured and available
 * @returns {boolean}
 */
function isSupabaseConfigured() {
  return supabase !== null;
}

/**
 * Get a signed URL for temporary access (if needed)
 * @param {string} path - Path to the file
 * @param {number} expiresIn - Expiration time in seconds (default 3600)
 * @returns {Promise<string>}
 */
async function getSignedUrl(path, expiresIn = 3600) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase.storage
    .from('item-images')
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

export {
  uploadItemImage,
  deleteItemImage,
  uploadCategoryImage,
  deleteCategoryImage,
  isSupabaseConfigured,
  getSignedUrl,
  supabase
};
