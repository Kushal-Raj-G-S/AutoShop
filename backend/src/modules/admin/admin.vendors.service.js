import { db } from '../../db/index.js';
import { vendors, users } from '../../db/schema.js';
import { eq, desc } from 'drizzle-orm';

class AdminVendorsService {
  /**
   * Get all vendors with user details
   */
  async getAllVendors() {
    try {
      const vendorsData = await db
        .select({
          id: vendors.id,
          userId: vendors.userId,
          storeName: vendors.storeName,
          ownerName: vendors.ownerName,
          phone: vendors.phone,
          documentUrl: vendors.documentUrl,
          storeAddress: vendors.storeAddress,
          pincode: vendors.pincode,
          latitude: vendors.latitude,
          longitude: vendors.longitude,
          serviceAreas: vendors.serviceAreas,
          bankDetails: vendors.bankDetails,
          adminNotes: vendors.adminNotes,
          requiredDocuments: vendors.requiredDocuments,
          status: vendors.status,
          createdAt: vendors.createdAt,
          updatedAt: vendors.updatedAt,
          // User details
          userName: users.name,
          userEmail: users.email,
          userPhoneNumber: users.phoneNumber,
          userRole: users.role,
          userIsActive: users.isActive,
        })
        .from(vendors)
        .leftJoin(users, eq(vendors.userId, users.id))
        .orderBy(desc(vendors.createdAt));

      return vendorsData;
    } catch (error) {
      console.error('Error in getAllVendors:', error);
      throw new Error('Failed to fetch vendors');
    }
  }

  /**
   * Get vendor by ID with full details
   */
  async getVendorById(vendorId) {
    try {
      const [vendor] = await db
        .select({
          id: vendors.id,
          userId: vendors.userId,
          storeName: vendors.storeName,
          ownerName: vendors.ownerName,
          phone: vendors.phone,
          documentUrl: vendors.documentUrl,
          storeAddress: vendors.storeAddress,
          pincode: vendors.pincode,
          latitude: vendors.latitude,
          longitude: vendors.longitude,
          serviceAreas: vendors.serviceAreas,
          bankDetails: vendors.bankDetails,
          adminNotes: vendors.adminNotes,
          requiredDocuments: vendors.requiredDocuments,
          status: vendors.status,
          createdAt: vendors.createdAt,
          updatedAt: vendors.updatedAt,
          // User details
          userName: users.name,
          userEmail: users.email,
          userPhoneNumber: users.phoneNumber,
          userRole: users.role,
          userIsActive: users.isActive,
          userCreatedAt: users.createdAt,
        })
        .from(vendors)
        .leftJoin(users, eq(vendors.userId, users.id))
        .where(eq(vendors.id, vendorId));

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      return vendor;
    } catch (error) {
      console.error('Error in getVendorById:', error);
      throw error;
    }
  }
}

export default new AdminVendorsService();
