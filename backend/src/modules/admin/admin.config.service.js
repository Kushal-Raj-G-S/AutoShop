import { db } from '../../db/index.js';
import { systemConfig } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

class AdminConfigService {
  /**
   * Get all system configuration settings
   */
  async getAllConfig() {
    try {
      const configs = await db
        .select()
        .from(systemConfig)
        .orderBy(systemConfig.category, systemConfig.key);

      // Group by category
      const grouped = configs.reduce((acc, config) => {
        if (!acc[config.category]) {
          acc[config.category] = [];
        }
        acc[config.category].push({
          key: config.key,
          value: this.parseValue(config.value, config.dataType),
          description: config.description,
          dataType: config.dataType,
        });
        return acc;
      }, {});

      return grouped;
    } catch (error) {
      console.error('Error in getAllConfig:', error);
      throw new Error('Failed to fetch configuration');
    }
  }

  /**
   * Get a specific config value by key
   */
  async getConfig(key) {
    try {
      const [config] = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, key))
        .limit(1);

      if (!config) {
        return null;
      }

      return this.parseValue(config.value, config.dataType);
    } catch (error) {
      console.error(`Error in getConfig for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Update configuration settings
   */
  async updateConfig(updates, updatedBy) {
    try {
      const results = [];

      for (const { key, value } of updates) {
        // Get config to validate data type
        const [existing] = await db
          .select()
          .from(systemConfig)
          .where(eq(systemConfig.key, key))
          .limit(1);

        if (!existing) {
          throw new Error(`Configuration key '${key}' not found`);
        }

        // Validate value based on data type
        this.validateValue(value, existing.dataType);

        // Update config
        const [updated] = await db
          .update(systemConfig)
          .set({
            value: String(value),
            updatedBy,
            updatedAt: new Date(),
          })
          .where(eq(systemConfig.key, key))
          .returning();

        results.push({
          key: updated.key,
          value: this.parseValue(updated.value, updated.dataType),
        });

        console.log(`✅ Updated config: ${key} = ${value}`);
      }

      return results;
    } catch (error) {
      console.error('Error in updateConfig:', error);
      throw error;
    }
  }

  /**
   * Parse value based on data type
   */
  parseValue(value, dataType) {
    switch (dataType) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === true;
      case 'json':
        return JSON.parse(value);
      default:
        return value;
    }
  }

  /**
   * Validate value based on data type
   */
  validateValue(value, dataType) {
    switch (dataType) {
      case 'number':
        if (isNaN(Number(value))) {
          throw new Error(`Value must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          throw new Error(`Value must be a boolean`);
        }
        break;
      case 'json':
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error(`Value must be valid JSON`);
        }
        break;
    }
  }
}

export default new AdminConfigService();
