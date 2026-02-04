import vendorService from './vendor.service.js';
import { sendResponse } from '../../utils/response.js';

class VendorController {
  // Register vendor
  async registerVendor(req, res) {
    try {
      const userId = req.user.id;
      const { storeName, ownerName, phone, documentUrl, storeAddress, pincode, latitude, longitude } = req.body;

      // Validation
      if (!storeName || !ownerName || !phone || !documentUrl || !storeAddress || !pincode || latitude === undefined || longitude === undefined) {
        return sendResponse(res, 400, false, 'All fields are required: storeName, ownerName, phone, documentUrl, storeAddress, pincode, latitude, longitude');
      }

      // Validate latitude and longitude
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return sendResponse(res, 400, false, 'Latitude and longitude must be numbers');
      }

      if (latitude < -90 || latitude > 90) {
        return sendResponse(res, 400, false, 'Latitude must be between -90 and 90');
      }

      if (longitude < -180 || longitude > 180) {
        return sendResponse(res, 400, false, 'Longitude must be between -180 and 180');
      }

      const result = await vendorService.registerVendor(userId, {
        storeName,
        ownerName,
        phone,
        documentUrl,
        storeAddress,
        pincode,
        latitude,
        longitude,
      });

      return sendResponse(res, 201, true, result.message, { vendor: result.vendor });
    } catch (error) {
      console.error('Register Vendor Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to register vendor');
    }
  }

  // Get my vendor profile
  async getMyVendorProfile(req, res) {
    try {
      const userId = req.user.id;

      const vendor = await vendorService.getMyVendorProfile(userId);

      if (!vendor) {
        return sendResponse(res, 404, 'Vendor profile not found', null);
      }

      return sendResponse(res, 200, 'Vendor profile fetched successfully', { vendor });
    } catch (error) {
      console.error('Get Vendor Profile Error:', error);
      return sendResponse(res, 404, false, error.message || 'Failed to fetch vendor profile');
    }
  }

  // Update vendor
  async updateVendor(req, res) {
    try {
      const userId = req.user.id;
      const { storeName, ownerName, phone, documentUrl, latitude, longitude } = req.body;

      // Validate latitude and longitude if provided
      if (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
        return sendResponse(res, 400, false, 'Latitude must be a number between -90 and 90');
      }

      if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
        return sendResponse(res, 400, false, 'Longitude must be a number between -180 and 180');
      }

      const result = await vendorService.updateVendor(userId, {
        storeName,
        ownerName,
        phone,
        documentUrl,
        latitude,
        longitude,
      });

      return sendResponse(res, 200, true, result.message, { vendor: result.vendor });
    } catch (error) {
      console.error('Update Vendor Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to update vendor');
    }
  }

  // List all vendors (Admin only)
  async listVendorsForAdmin(req, res) {
    try {
      const vendors = await vendorService.listVendorsForAdmin();

      return sendResponse(res, 200, true, 'Vendors fetched successfully', { vendors, count: vendors.length });
    } catch (error) {
      console.error('List Vendors Error:', error);
      return sendResponse(res, 500, false, error.message || 'Failed to fetch vendors');
    }
  }

  // Approve vendor (Admin only)
  async approveVendor(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return sendResponse(res, 400, false, 'Valid vendor ID is required');
      }

      const result = await vendorService.approveVendor(parseInt(id));

      return sendResponse(res, 200, true, result.message, { vendor: result.vendor });
    } catch (error) {
      console.error('Approve Vendor Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to approve vendor');
    }
  }

  // Reject vendor (Admin only)
  async rejectVendor(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return sendResponse(res, 400, false, 'Valid vendor ID is required');
      }

      const result = await vendorService.rejectVendor(parseInt(id));

      return sendResponse(res, 200, true, result.message, { vendor: result.vendor });
    } catch (error) {
      console.error('Reject Vendor Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to reject vendor');
    }
  }

  // Get vendor by ID (Admin only)
  async getVendorById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return sendResponse(res, 400, false, 'Valid vendor ID is required');
      }

      const vendor = await vendorService.getVendorById(parseInt(id));
      return sendResponse(res, 200, true, 'Vendor retrieved successfully', { vendor });
    } catch (error) {
      console.error('Get Vendor Error:', error);
      return sendResponse(res, 404, false, error.message || 'Vendor not found');
    }
  }

  // Create vendor by admin
  async createVendorByAdmin(req, res) {
    try {
      const { storeName, ownerName, phone, documentUrl, latitude, longitude } = req.body;

      if (!storeName || !ownerName || !phone) {
        return sendResponse(res, 400, false, 'Store name, owner name, and phone are required');
      }

      const result = await vendorService.createVendorByAdmin({
        storeName,
        ownerName,
        phone,
        documentUrl,
        latitude: latitude || 0,
        longitude: longitude || 0
      });

      return sendResponse(res, 201, true, 'Vendor created successfully', { vendor: result });
    } catch (error) {
      console.error('Create Vendor Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to create vendor');
    }
  }

  // Update vendor by admin
  async updateVendorByAdmin(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id || isNaN(id)) {
        return sendResponse(res, 400, false, 'Valid vendor ID is required');
      }

      const result = await vendorService.updateVendorByAdmin(parseInt(id), updates);
      return sendResponse(res, 200, true, 'Vendor updated successfully', { vendor: result });
    } catch (error) {
      console.error('Update Vendor Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to update vendor');
    }
  }

  // Delete vendor
  async deleteVendor(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return sendResponse(res, 400, false, 'Valid vendor ID is required');
      }

      await vendorService.deleteVendor(parseInt(id));
      return sendResponse(res, 200, true, 'Vendor deleted successfully');
    } catch (error) {
      console.error('Delete Vendor Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to delete vendor');
    }
  }

  // Block vendor
  async blockVendor(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return sendResponse(res, 400, false, 'Valid vendor ID is required');
      }

      const result = await vendorService.blockVendor(parseInt(id));
      return sendResponse(res, 200, true, result.message, { vendor: result.vendor });
    } catch (error) {
      console.error('Block Vendor Error:', error);
      return sendResponse(res, 400, false, error.message || 'Failed to block vendor');
    }
  }
}

export default new VendorController();
