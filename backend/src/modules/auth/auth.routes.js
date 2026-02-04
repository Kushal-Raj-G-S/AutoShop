import express from 'express';
import authController from './auth.controller.js';
import { verifyToken } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);

// Protected routes
router.get('/profile', verifyToken, authController.getProfile);

export default router;
