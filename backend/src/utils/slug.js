import { eq, ne } from 'drizzle-orm';
import { db } from '../db/index.js';

/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - Input text
 * @returns {string} Slugified text
 */
export function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Generate a short random ID
 * @returns {string} 6-character random string
 */
function generateShortId() {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Ensure slug is unique by appending short ID if needed
 * @param {string} baseSlug - Base slug to check
 * @param {object} table - Drizzle table reference
 * @param {number} excludeId - ID to exclude from uniqueness check (for updates)
 * @returns {Promise<string>} Unique slug
 */
export async function ensureUniqueSlug(baseSlug, table, excludeId = null) {
  let slug = baseSlug;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Check if slug exists
    const query = db
      .select({ slug: table.slug })
      .from(table)
      .where(eq(table.slug, slug))
      .limit(1);

    // Exclude current item ID when updating
    const existing = excludeId
      ? await db
          .select({ slug: table.slug })
          .from(table)
          .where(eq(table.slug, slug))
          .where(ne(table.id, excludeId))
          .limit(1)
      : await query;

    if (existing.length === 0) {
      return slug;
    }

    // Append short ID and try again
    slug = `${baseSlug}-${generateShortId()}`;
    attempts++;
  }

  // Fallback: use timestamp
  return `${baseSlug}-${Date.now()}`;
}
