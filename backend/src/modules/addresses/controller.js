import { db } from '../../db/index.js';
import { addresses } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';

// Get all addresses for a user
export const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(addresses.isDefault, addresses.createdAt);

    res.json({
      success: true,
      data: userAddresses,
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses',
      error: error.message,
    });
  }
};

// Get a single address by ID
export const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [address] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    res.json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch address',
      error: error.message,
    });
  }
};

// Create a new address
export const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      landmark,
      addressType,
      isDefault,
    } = req.body;

    // Validation
    if (!name || !phoneNumber || !addressLine1 || !city || !state || !pincode || !landmark) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // If setting as default, unset other default addresses
    if (isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, userId));
    }

    // Create new address
    const [newAddress] = await db
      .insert(addresses)
      .values({
        userId,
        name,
        phoneNumber,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        pincode,
        landmark,
        addressType: addressType || 'home',
        isDefault: isDefault || false,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: newAddress,
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create address',
      error: error.message,
    });
  }
};

// Update an address
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      name,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      landmark,
      addressType,
      isDefault,
    } = req.body;

    // Check if address exists and belongs to user
    const [existingAddress] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    // If setting as default, unset other default addresses
    if (isDefault && !existingAddress.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(and(eq(addresses.userId, userId), eq(addresses.id, id, false)));
    }

    // Update address
    const [updatedAddress] = await db
      .update(addresses)
      .set({
        name,
        phoneNumber,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        state,
        pincode,
        landmark,
        addressType: addressType || 'home',
        isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault,
        updatedAt: new Date(),
      })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress,
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message,
    });
  }
};

// Delete an address
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if address exists and belongs to user
    const [existingAddress] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    // Delete address
    await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));

    // If deleted address was default, set another address as default
    if (existingAddress.isDefault) {
      const [firstAddress] = await db
        .select()
        .from(addresses)
        .where(eq(addresses.userId, userId))
        .limit(1);

      if (firstAddress) {
        await db
          .update(addresses)
          .set({ isDefault: true })
          .where(eq(addresses.id, firstAddress.id));
      }
    }

    res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: error.message,
    });
  }
};

// Set an address as default
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if address exists and belongs to user
    const [existingAddress] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)));

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    // Unset all default addresses for user
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, userId));

    // Set this address as default
    const [updatedAddress] = await db
      .update(addresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
      .returning();

    res.json({
      success: true,
      message: 'Default address updated successfully',
      data: updatedAddress,
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default address',
      error: error.message,
    });
  }
};
