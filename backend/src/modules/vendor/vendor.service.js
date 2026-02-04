import { db } from '../../db/index.js';
import { vendors, users } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';

class VendorService {
  // Register vendor
  async registerVendor(userId, payload) {
    try {
      const { storeName, ownerName, phone, documentUrl, storeAddress, pincode, latitude, longitude } = payload;

      // Check if user exists
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || user.length === 0) {
        throw new Error('User not found');
      }

      // Check if vendor already exists for this user
      const existingVendor = await db
        .select()
        .from(vendors)
        .where(eq(vendors.userId, userId))
        .limit(1);

      if (existingVendor && existingVendor.length > 0) {
        throw new Error('Vendor registration already exists for this user');
      }

      // Create vendor
      const newVendor = await db
        .insert(vendors)
        .values({
          userId,
          storeName,
          ownerName,
          phone,
          documentUrl,
          storeAddress,
          pincode,
          latitude,
          longitude,
          latitude,
          longitude,
        })
        .returning();

      return {
        success: true,
        message: 'Vendor registration submitted successfully',
        vendor: newVendor[0],
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to register vendor');
    }
  }

  // Get my vendor profile
  async getMyVendorProfile(userId) {
    try {
      const vendor = await db
        .select({
          id: vendors.id,
          userId: vendors.userId,
          storeName: vendors.storeName,
          ownerName: vendors.ownerName,
          phone: vendors.phone,
          documentUrl: vendors.documentUrl,
          latitude: vendors.latitude,
          longitude: vendors.longitude,
          status: vendors.status,
          createdAt: vendors.createdAt,
        })
        .from(vendors)
        .where(eq(vendors.userId, userId))
        .limit(1);

      if (!vendor || vendor.length === 0) {
        return null; // Return null instead of throwing error
      }

      return vendor[0];
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
      return null; // Return null on error
    }
  }

  // Update vendor
  async updateVendor(userId, payload) {
    try {
      const { storeName, ownerName, phone, documentUrl, latitude, longitude } = payload;

      // Check if vendor exists
      const existingVendor = await db
        .select()
        .from(vendors)
        .where(eq(vendors.userId, userId))
        .limit(1);

      if (!existingVendor || existingVendor.length === 0) {
        throw new Error('Vendor profile not found');
      }

      // Build update object (only include provided fields)
      const updateData = {};
      if (storeName !== undefined) updateData.storeName = storeName;
      if (ownerName !== undefined) updateData.ownerName = ownerName;
      if (phone !== undefined) updateData.phone = phone;
      if (documentUrl !== undefined) updateData.documentUrl = documentUrl;
      if (latitude !== undefined) updateData.latitude = latitude;
      if (longitude !== undefined) updateData.longitude = longitude;

      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
      }

      // Update vendor
      const updatedVendor = await db
        .update(vendors)
        .set(updateData)
        .where(eq(vendors.userId, userId))
        .returning();

      return {
        success: true,
        message: 'Vendor profile updated successfully',
        vendor: updatedVendor[0],
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to update vendor');
    }
  }

  // List all vendors for admin
  async listVendorsForAdmin() {
    try {
      const allVendors = await db
        .select({
          id: vendors.id,
          userId: vendors.userId,
          storeName: vendors.storeName,
          ownerName: vendors.ownerName,
          phone: vendors.phone,
          documentUrl: vendors.documentUrl,
          latitude: vendors.latitude,
          longitude: vendors.longitude,
          status: vendors.status,
          createdAt: vendors.createdAt,
        })
        .from(vendors)
        .orderBy(vendors.createdAt);

      return allVendors;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch vendors');
    }
  }

  // Approve vendor
  async approveVendor(vendorId) {
    try {
      // Check if vendor exists
      const vendor = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, vendorId))
        .limit(1);

      if (!vendor || vendor.length === 0) {
        throw new Error('Vendor not found');
      }

      // Update status to approved
      const updatedVendor = await db
        .update(vendors)
        .set({ status: 'approved' })
        .where(eq(vendors.id, vendorId))
        .returning();

      // Update user role to vendor
      await db
        .update(users)
        .set({ role: 'vendor' })
        .where(eq(users.id, vendor[0].userId));

      return {
        success: true,
        message: 'Vendor approved successfully',
        vendor: updatedVendor[0],
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to approve vendor');
    }
  }

  // Reject vendor
  async rejectVendor(vendorId) {
    try {
      // Check if vendor exists
      const vendor = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, vendorId))
        .limit(1);

      if (!vendor || vendor.length === 0) {
        throw new Error('Vendor not found');
      }

      // Update status to rejected
      const updatedVendor = await db
        .update(vendors)
        .set({ status: 'rejected' })
        .where(eq(vendors.id, vendorId))
        .returning();

      return {
        success: true,
        message: 'Vendor rejected',
        vendor: updatedVendor[0],
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to reject vendor');
    }
  }

  // Get vendor by ID
  async getVendorById(vendorId) {
    try {
      const vendor = await db
        .select({
          id: vendors.id,
          userId: vendors.userId,
          storeName: vendors.storeName,
          ownerName: vendors.ownerName,
          phone: vendors.phone,
          documentUrl: vendors.documentUrl,
          latitude: vendors.latitude,
          longitude: vendors.longitude,
          status: vendors.status,
          createdAt: vendors.createdAt,
          user: {
            id: users.id,
            phoneNumber: users.phoneNumber,
            role: users.role,
            name: users.name,
            email: users.email
          }
        })
        .from(vendors)
        .leftJoin(users, eq(vendors.userId, users.id))
        .where(eq(vendors.id, vendorId))
        .limit(1);

      if (!vendor || vendor.length === 0) {
        throw new Error('Vendor not found');
      }

      return vendor[0];
    } catch (error) {
      throw new Error(error.message || 'Failed to get vendor');
    }
  }

  // Create vendor by admin (no user account needed)
  async createVendorByAdmin(payload) {
    try {
      const { storeName, ownerName, phone, documentUrl, latitude, longitude } = payload;

      // Create a placeholder user account for the vendor
      const [newUser] = await db
        .insert(users)
        .values({
          phoneNumber: phone,
          role: 'vendor',
          name: ownerName,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Create vendor record
      const [newVendor] = await db
        .insert(vendors)
        .values({
          userId: newUser.id,
          storeName,
          ownerName,
          phone,
          documentUrl: documentUrl || null,
          latitude: latitude || 0,
          longitude: longitude || 0,
          status: 'pending',
          createdAt: new Date()
        })
        .returning();

      return newVendor;
    } catch (error) {
      throw new Error(error.message || 'Failed to create vendor');
    }
  }

  // Update vendor by admin
  async updateVendorByAdmin(vendorId, updates) {
    try {
      const vendor = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, vendorId))
        .limit(1);

      if (!vendor || vendor.length === 0) {
        throw new Error('Vendor not found');
      }

      const [updatedVendor] = await db
        .update(vendors)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(vendors.id, vendorId))
        .returning();

      return updatedVendor;
    } catch (error) {
      throw new Error(error.message || 'Failed to update vendor');
    }
  }

  // Delete vendor
  async deleteVendor(vendorId) {
    try {
      const vendor = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, vendorId))
        .limit(1);

      if (!vendor || vendor.length === 0) {
        throw new Error('Vendor not found');
      }

      await db.delete(vendors).where(eq(vendors.id, vendorId));
      return { success: true, message: 'Vendor deleted successfully' };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete vendor');
    }
  }

  // Block vendor
  async blockVendor(vendorId) {
    try {
      const vendor = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, vendorId))
        .limit(1);

      if (!vendor || vendor.length === 0) {
        throw new Error('Vendor not found');
      }

      const [updatedVendor] = await db
        .update(vendors)
        .set({ status: 'blocked' })
        .where(eq(vendors.id, vendorId))
        .returning();

      return {
        success: true,
        message: 'Vendor blocked',
        vendor: updatedVendor,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to block vendor');
    }
  }
}

export default new VendorService();
