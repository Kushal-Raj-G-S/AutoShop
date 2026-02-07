import { db } from '../../db/index.js';
import { units } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

class UnitService {
  // Create unit
  async createUnit(payload) {
    try {
      const { name, abbreviation, description, isActive } = payload;

      // Check if unit with same name or abbreviation already exists
      const [existingUnit] = await db
        .select()
        .from(units)
        .where(eq(units.name, name))
        .limit(1);

      if (existingUnit) {
        throw new Error('Unit with this name already exists');
      }

      const [existingAbbr] = await db
        .select()
        .from(units)
        .where(eq(units.abbreviation, abbreviation))
        .limit(1);

      if (existingAbbr) {
        throw new Error('Unit with this abbreviation already exists');
      }

      // Create unit
      const [newUnit] = await db
        .insert(units)
        .values({
          name: name.trim(),
          abbreviation: abbreviation.trim(),
          description: description?.trim() || null,
          isActive: isActive !== undefined ? isActive : true,
        })
        .returning();

      return {
        success: true,
        message: 'Unit created successfully',
        unit: newUnit,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to create unit');
    }
  }

  // Update unit
  async updateUnit(id, payload) {
    try {
      const { name, abbreviation, description, isActive } = payload;

      // Check if unit exists
      const [existingUnit] = await db
        .select()
        .from(units)
        .where(eq(units.id, id))
        .limit(1);

      if (!existingUnit) {
        throw new Error('Unit not found');
      }

      // If name is being updated, check for duplicates
      if (name && name !== existingUnit.name) {
        const [duplicateName] = await db
          .select()
          .from(units)
          .where(eq(units.name, name))
          .limit(1);

        if (duplicateName) {
          throw new Error('Unit with this name already exists');
        }
      }

      // If abbreviation is being updated, check for duplicates
      if (abbreviation && abbreviation !== existingUnit.abbreviation) {
        const [duplicateAbbr] = await db
          .select()
          .from(units)
          .where(eq(units.abbreviation, abbreviation))
          .limit(1);

        if (duplicateAbbr) {
          throw new Error('Unit with this abbreviation already exists');
        }
      }

      // Build update object
      const updateData = {
        updatedAt: new Date(),
      };
      if (name !== undefined) updateData.name = name.trim();
      if (abbreviation !== undefined) updateData.abbreviation = abbreviation.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Update unit
      const [updatedUnit] = await db
        .update(units)
        .set(updateData)
        .where(eq(units.id, id))
        .returning();

      return {
        success: true,
        message: 'Unit updated successfully',
        unit: updatedUnit,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to update unit');
    }
  }

  // Delete unit
  async deleteUnit(id) {
    try {
      // Check if unit exists
      const [existingUnit] = await db
        .select()
        .from(units)
        .where(eq(units.id, id))
        .limit(1);

      if (!existingUnit) {
        throw new Error('Unit not found');
      }

      // Delete unit
      await db
        .delete(units)
        .where(eq(units.id, id));

      return {
        success: true,
        message: 'Unit deleted successfully',
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete unit');
    }
  }

  // Get unit by ID
  async getUnitById(id) {
    try {
      const [unit] = await db
        .select()
        .from(units)
        .where(eq(units.id, id))
        .limit(1);

      if (!unit) {
        throw new Error('Unit not found');
      }

      return unit;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch unit');
    }
  }

  // List all units
  async listUnits(filters = {}) {
    try {
      const { isActive } = filters;

      let query = db
        .select()
        .from(units)
        .orderBy(units.name);

      if (isActive !== undefined) {
        query = query.where(eq(units.isActive, isActive));
      }

      const allUnits = await query;

      return allUnits;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch units');
    }
  }
}

export default new UnitService();
