import { db } from '../../db/index.js';
import { users, vendors } from '../../db/schema.js';
import { eq, desc, and, or, like, sql } from 'drizzle-orm';

class UserService {
  // List all users with filters and pagination
  async listUsers(filters = {}) {
    try {
      const { role, isBlocked, search, limit = 50, offset = 0 } = filters;

      let query = db.select({
        id: users.id,
        phoneNumber: users.phoneNumber,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        isBlocked: users.isBlocked,
        blockedAt: users.blockedAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }).from(users);

      const conditions = [];

      // Filter by role
      if (role) {
        conditions.push(eq(users.role, role));
      }

      // Filter by blocked status
      if (isBlocked !== undefined) {
        conditions.push(eq(users.isBlocked, isBlocked));
      }

      // Search by name or phone
      if (search) {
        conditions.push(
          or(
            like(users.name, `%${search}%`),
            like(users.phoneNumber, `%${search}%`),
            like(users.email, `%${search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const usersList = await query
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [{ count }] = await db
        .select({ count: sql`count(*)::int` })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        users: usersList,
        total: count,
        limit,
        offset,
      };
    } catch (error) {
      console.error('List Users Error:', error);
      throw new Error('Failed to fetch users');
    }
  }

  // Get user by ID with vendor info if applicable
  async getUserById(userId) {
    try {
      const [user] = await db
        .select({
          id: users.id,
          phoneNumber: users.phoneNumber,
          name: users.name,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          isBlocked: users.isBlocked,
          blockedAt: users.blockedAt,
          blockedBy: users.blockedBy,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        throw new Error('User not found');
      }

      // If user is a vendor, fetch vendor details
      if (user.role === 'vendor') {
        const [vendor] = await db
          .select()
          .from(vendors)
          .where(eq(vendors.userId, userId));

        return {
          ...user,
          vendor,
        };
      }

      return user;
    } catch (error) {
      console.error('Get User Error:', error);
      throw error;
    }
  }

  // Block a user
  async blockUser(userId, blockedByUserId) {
    try {
      // Check if user exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isBlocked) {
        throw new Error('User is already blocked');
      }

      // Cannot block admin users
      if (user.role === 'admin') {
        throw new Error('Cannot block admin users');
      }

      // Update user to blocked status
      const [updatedUser] = await db
        .update(users)
        .set({
          isBlocked: true,
          blockedAt: new Date(),
          blockedBy: blockedByUserId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      return {
        message: 'User blocked successfully',
        user: updatedUser,
      };
    } catch (error) {
      console.error('Block User Error:', error);
      throw error;
    }
  }

  // Unblock a user
  async unblockUser(userId) {
    try {
      // Check if user exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isBlocked) {
        throw new Error('User is not blocked');
      }

      // Update user to unblocked status
      const [updatedUser] = await db
        .update(users)
        .set({
          isBlocked: false,
          blockedAt: null,
          blockedBy: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      return {
        message: 'User unblocked successfully',
        user: updatedUser,
      };
    } catch (error) {
      console.error('Unblock User Error:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const [stats] = await db
        .select({
          total: sql`count(*)::int`,
          customers: sql`count(*) FILTER (WHERE role = 'customer')::int`,
          vendors: sql`count(*) FILTER (WHERE role = 'vendor')::int`,
          admins: sql`count(*) FILTER (WHERE role = 'admin')::int`,
          blocked: sql`count(*) FILTER (WHERE is_blocked = true)::int`,
          active: sql`count(*) FILTER (WHERE is_active = 'true')::int`,
        })
        .from(users);

      return stats;
    } catch (error) {
      console.error('Get User Stats Error:', error);
      throw new Error('Failed to fetch user statistics');
    }
  }
}

export default new UserService();
