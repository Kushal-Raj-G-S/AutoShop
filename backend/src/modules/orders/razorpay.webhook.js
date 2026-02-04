/**
 * Razorpay Webhook Handler
 * 
 * Handles payment notifications from Razorpay:
 * - payment.captured: Payment successful
 * - payment.failed: Payment failed
 * - order.paid: Order payment completed
 * - refund.created: Refund initiated
 * - refund.processed: Refund completed
 */

import crypto from 'crypto';
import { db } from '../../db/index.js';
import { orders, payments } from './schema.js';
import { eq, and } from 'drizzle-orm';
import { sendResponse } from '../../utils/response.js';

/**
 * Verify Razorpay webhook signature
 * 
 * @param {string} rawBody - Raw request body as string
 * @param {string} signature - X-Razorpay-Signature header
 * @returns {boolean} - True if signature is valid
 */
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  
  if (!secret) {
    console.error('❌ RAZORPAY_WEBHOOK_SECRET not configured');
    return false;
  }
  
  // Generate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  
  // Compare signatures (timing-safe)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Handle payment.captured event
 * 
 * @param {Object} payload - Webhook payload
 */
async function handlePaymentCaptured(payload) {
  const { payment } = payload;
  
  console.log('💰 Payment captured:', payment.id);
  
  // Extract order ID from notes or description
  const orderId = payment.notes?.order_id;
  
  if (!orderId) {
    console.warn('⚠️ Payment captured but no order_id in notes:', payment.id);
    return;
  }
  
  try {
    // Update payment record
    await db.update(payments)
      .set({
        paymentStatus: 'captured',
        capturedAt: new Date(payment.captured_at * 1000),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(payments.razorpayPaymentId, payment.id),
          eq(payments.orderId, orderId)
        )
      );
    
    console.log('✅ Payment updated in DB:', payment.id);
    
  } catch (error) {
    console.error('❌ Failed to update payment:', error);
    throw error;
  }
}

/**
 * Handle payment.failed event
 * 
 * @param {Object} payload - Webhook payload
 */
async function handlePaymentFailed(payload) {
  const { payment } = payload;
  
  console.log('❌ Payment failed:', payment.id, payment.error_description);
  
  const orderId = payment.notes?.order_id;
  
  if (!orderId) {
    return;
  }
  
  try {
    await db.transaction(async (tx) => {
      // Update payment record
      await tx.update(payments)
        .set({
          paymentStatus: 'failed',
          failureReason: payment.error_description || 'Payment failed',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(payments.razorpayPaymentId, payment.id),
            eq(payments.orderId, orderId)
          )
        );
      
      // Update order status
      await tx.update(orders)
        .set({
          status: 'payment_failed',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    });
    
    console.log('✅ Payment failure recorded:', payment.id);
    
    // TODO: Notify customer via FCM/Socket.io
    
  } catch (error) {
    console.error('❌ Failed to handle payment failure:', error);
    throw error;
  }
}

/**
 * Handle order.paid event
 * 
 * @param {Object} payload - Webhook payload
 */
async function handleOrderPaid(payload) {
  const { order } = payload;
  
  console.log('✅ Order paid:', order.id);
  
  const orderId = order.notes?.order_id;
  
  if (!orderId) {
    console.warn('⚠️ Order paid but no order_id in notes:', order.id);
    return;
  }
  
  try {
    // Update order status to awaiting assignment
    await db.update(orders)
      .set({
        status: 'awaiting_assignment',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    
    console.log('✅ Order marked as awaiting assignment:', orderId);
    
    // TODO: Trigger vendor assignment logic
    
  } catch (error) {
    console.error('❌ Failed to update order status:', error);
    throw error;
  }
}

/**
 * Handle refund.created event
 * 
 * @param {Object} payload - Webhook payload
 */
async function handleRefundCreated(payload) {
  const { refund } = payload;
  
  console.log('💸 Refund created:', refund.id);
  
  const paymentId = refund.payment_id;
  
  try {
    // Find payment record
    const [payment] = await db.select()
      .from(payments)
      .where(eq(payments.razorpayPaymentId, paymentId))
      .limit(1);
    
    if (!payment) {
      console.warn('⚠️ Payment not found for refund:', refund.id);
      return;
    }
    
    // Update payment record
    await db.update(payments)
      .set({
        refundId: refund.id,
        refundAmount: refund.amount / 100, // Convert paise to rupees
        refundStatus: 'initiated',
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));
    
    console.log('✅ Refund recorded:', refund.id);
    
  } catch (error) {
    console.error('❌ Failed to record refund:', error);
    throw error;
  }
}

/**
 * Handle refund.processed event
 * 
 * @param {Object} payload - Webhook payload
 */
async function handleRefundProcessed(payload) {
  const { refund } = payload;
  
  console.log('✅ Refund processed:', refund.id);
  
  try {
    // Update payment record
    await db.update(payments)
      .set({
        refundStatus: 'completed',
        paymentStatus: 'refunded',
        updatedAt: new Date(),
      })
      .where(eq(payments.refundId, refund.id));
    
    console.log('✅ Refund marked as completed:', refund.id);
    
  } catch (error) {
    console.error('❌ Failed to update refund status:', error);
    throw error;
  }
}

/**
 * Main webhook handler
 * 
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function handleRazorpayWebhook(req, res) {
  try {
    // Get raw body and signature
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody; // Set by express.raw() middleware
    
    if (!signature || !rawBody) {
      return sendResponse(res, 400, false, 'Missing signature or body');
    }
    
    // Verify signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return sendResponse(res, 401, false, 'Invalid signature');
    }
    
    // Parse webhook payload
    const payload = JSON.parse(rawBody);
    const { event, account_id, created_at } = payload;
    
    console.log(`📥 Webhook received: ${event} at ${new Date(created_at * 1000).toISOString()}`);
    
    // Handle different event types
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
        
      case 'order.paid':
        await handleOrderPaid(payload);
        break;
        
      case 'refund.created':
        await handleRefundCreated(payload);
        break;
        
      case 'refund.processed':
        await handleRefundProcessed(payload);
        break;
        
      default:
        console.log(`ℹ️ Unhandled webhook event: ${event}`);
    }
    
    // Always return 200 to acknowledge receipt
    return sendResponse(res, 200, true, 'Webhook processed', { event });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    // Return 200 even on error to prevent retries
    return sendResponse(res, 200, true, 'Webhook received but processing failed');
  }
}

/**
 * Express middleware to capture raw body
 * Required for signature verification
 * 
 * Usage:
 * app.post('/api/webhooks/razorpay', 
 *   express.raw({ type: 'application/json' }), 
 *   captureRawBody,
 *   handleRazorpayWebhook
 * );
 */
export function captureRawBody(req, res, next) {
  if (req.body) {
    // Convert Buffer to string for signature verification
    req.rawBody = req.body.toString('utf8');
  }
  next();
}
