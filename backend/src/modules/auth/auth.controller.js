import authService from './auth.service.js';
import { sendResponse } from '../../utils/response.js';

class AuthController {
  // Send OTP to phone number
  async sendOTP(req, res) {
    try {
      const { phoneNumber } = req.body;

      // Validation
      if (!phoneNumber) {
        return sendResponse(res, 400, false, 'Phone number is required');
      }

      // Phone number format validation (basic)
      const phoneRegex = /^\+?[1-9]\d{9,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return sendResponse(res, 400, false, 'Invalid phone number format');
      }

      const result = await authService.sendOTP(phoneNumber);

      return sendResponse(
        res,
        200,
        true,
        result.message,
        process.env.NODE_ENV !== 'production' ? { otp: result.otp } : null
      );
    } catch (error) {
      console.error('Send OTP Error:', error);
      return sendResponse(res, 500, false, error.message || 'Failed to send OTP');
    }
  }

  // Verify OTP and login
  async verifyOTP(req, res) {
    try {
      const { phoneNumber, otp, role } = req.body;

      // Validation
      if (!phoneNumber || !otp) {
        return sendResponse(res, 400, false, 'Phone number and OTP are required');
      }

      // Validate role if provided
      const validRoles = ['customer', 'vendor', 'admin'];
      if (role && !validRoles.includes(role)) {
        return sendResponse(res, 400, false, 'Invalid role');
      }

      const result = await authService.verifyOTP(phoneNumber, otp, role);

      return sendResponse(res, 200, true, result.message, {
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      console.error('Verify OTP Error:', error);
      return sendResponse(res, 400, false, error.message || 'OTP verification failed');
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await authService.getUserById(userId);

      return sendResponse(res, 200, true, 'Profile fetched successfully', { user });
    } catch (error) {
      console.error('Get Profile Error:', error);
      return sendResponse(res, 404, false, error.message || 'Failed to fetch profile');
    }
  }
}

export default new AuthController();
