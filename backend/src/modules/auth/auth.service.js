import { db } from '../../db/index.js';
import { users, otpVerifications } from '../../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { generateToken } from '../../utils/jwt.js';

class AuthService {
  // Generate random 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP (stubbed, no real SMS)
  async sendOTP(phoneNumber) {
    try {
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database using Drizzle
      await db.insert(otpVerifications).values({
        phoneNumber,
        otp,
        expiresAt,
      });

      // In production, integrate with SMS provider here
      console.log(`📱 OTP for ${phoneNumber}: ${otp}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        // In dev/staging, you might want to return OTP for testing
        ...(process.env.NODE_ENV !== 'production' && { otp }),
      };
    } catch (error) {
      console.error('❌ Send OTP Error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error detail:', error.detail);
      const errorMsg = error.message || error.code || error.detail || 'Unknown database error';
      throw new Error(`Failed to send OTP: ${errorMsg}`);
    }
  }

  // Verify OTP and login/register user
  async verifyOTP(phoneNumber, otp, role = 'customer') {
    try {
      // Find valid OTP
      const otpRecord = await db
        .select()
        .from(otpVerifications)
        .where(
          and(
            eq(otpVerifications.phoneNumber, phoneNumber),
            eq(otpVerifications.otp, otp),
            eq(otpVerifications.isUsed, 'false'),
            gt(otpVerifications.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!otpRecord || otpRecord.length === 0) {
        throw new Error('Invalid or expired OTP');
      }

      // Mark OTP as used
      await db
        .update(otpVerifications)
        .set({ isUsed: 'true' })
        .where(eq(otpVerifications.id, otpRecord[0].id));

      // Check if user exists
      let user = await db
        .select()
        .from(users)
        .where(eq(users.phoneNumber, phoneNumber))
        .limit(1);

      // Auto-create user if not exists
      if (!user || user.length === 0) {
        const newUser = await db
          .insert(users)
          .values({
            phoneNumber,
            role,
          })
          .returning();

        user = newUser[0];
      } else {
        user = user[0];
      }

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
      });

      return {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          name: user.name || null,
          email: user.email || null,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      throw new Error(error.message || 'OTP verification failed');
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const user = await db
        .select({
          id: users.id,
          phoneNumber: users.phoneNumber,
          name: users.name,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || user.length === 0) {
        throw new Error('User not found');
      }

      return user[0];
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch user');
    }
  }
}

export default new AuthService();
