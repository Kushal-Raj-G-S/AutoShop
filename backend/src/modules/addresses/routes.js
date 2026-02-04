import express from 'express';
import { verifyToken } from '../../middleware/auth.middleware.js';
import {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from './controller.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get all addresses for logged-in user
router.get('/', getUserAddresses);

// Get single address by ID
router.get('/:id', getAddressById);

// Create new address
router.post('/', createAddress);

// Update address
router.put('/:id', updateAddress);

// Delete address
router.delete('/:id', deleteAddress);

// Set address as default
router.patch('/:id/default', setDefaultAddress);

export default router;
