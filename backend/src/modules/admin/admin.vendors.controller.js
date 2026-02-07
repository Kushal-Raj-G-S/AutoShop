import adminVendorsService from './admin.vendors.service.js';
import { sendResponse } from '../../utils/response.js';

class AdminVendorsController {
  /**
   * GET /api/admin/vendors
   * Get all vendors with user details
   */
  async getAllVendors(req, res) {
    try {
      const vendors = await adminVendorsService.getAllVendors();
      return sendResponse(res, 200, true, 'Vendors fetched successfully', { vendors });
    } catch (error) {
      console.error('Get All Vendors Error:', error);
      return sendResponse(res, 500, false, error.message || 'Failed to fetch vendors');
    }
  }

  /**
   * GET /api/admin/vendors/:id
   * Get vendor details by ID
   */
  async getVendorById(req, res) {
    try {
      const { id } = req.params;
      
      // Validate ID
      if (!id || isNaN(parseInt(id))) {
        return sendResponse(res, 400, false, 'Valid vendor ID is required');
      }
      
      const vendor = await adminVendorsService.getVendorById(parseInt(id));
      return sendResponse(res, 200, true, 'Vendor details fetched successfully', { vendor });
    } catch (error) {
      console.error('Get Vendor By ID Error:', error);
      const statusCode = error.message === 'Vendor not found' ? 404 : 500;
      return sendResponse(res, statusCode, false, error.message || 'Failed to fetch vendor details');
    }
  }
}

export default new AdminVendorsController();
