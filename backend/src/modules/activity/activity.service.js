import { db } from '../../db/index.js';
import { activityLogs, users } from '../../db/schema.js';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

class ActivityLogService {
  /**
   * Log an activity
   * @param {Object} payload - { userId, action, entity, entityId, description, metadata, ipAddress, userAgent }
   */
  async logActivity(payload) {
    try {
      const { userId, action, entity, entityId, description, metadata, ipAddress, userAgent } = payload;

      const [log] = await db
        .insert(activityLogs)
        .values({
          userId,
          action,
          entity,
          entityId: entityId ? String(entityId) : null,
          description,
          metadata: metadata || null,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        })
        .returning();

      return log;
    } catch (error) {
      console.error('Activity Log Error:', error);
      // Don't throw - logging should never break the app
      return null;
    }
  }

  /**
   * List activity logs with filters and pagination
   */
  async listActivityLogs(filters = {}) {
    try {
      const {
        userId,
        action,
        entity,
        startDate,
        endDate,
        page = 1,
        limit = 50,
      } = filters;

      const offset = (page - 1) * limit;
      const conditions = [];

      if (userId) {
        conditions.push(eq(activityLogs.userId, userId));
      }

      if (action) {
        conditions.push(eq(activityLogs.action, action));
      }

      if (entity) {
        conditions.push(eq(activityLogs.entity, entity));
      }

      if (startDate) {
        conditions.push(gte(activityLogs.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(activityLogs.createdAt, new Date(endDate)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countQuery = whereClause
        ? db.select({ count: sql`count(*)::int` }).from(activityLogs).where(whereClause)
        : db.select({ count: sql`count(*)::int` }).from(activityLogs);

      const [{ count }] = await countQuery;

      // Get paginated logs with user info
      let query = db
        .select({
          id: activityLogs.id,
          userId: activityLogs.userId,
          userName: users.name,
          userPhone: users.phoneNumber,
          userRole: users.role,
          action: activityLogs.action,
          entity: activityLogs.entity,
          entityId: activityLogs.entityId,
          description: activityLogs.description,
          metadata: activityLogs.metadata,
          ipAddress: activityLogs.ipAddress,
          userAgent: activityLogs.userAgent,
          createdAt: activityLogs.createdAt,
        })
        .from(activityLogs)
        .leftJoin(users, eq(activityLogs.userId, users.id));

      // Apply filters if any
      if (whereClause) {
        query = query.where(whereClause);
      }

      // Apply ordering and pagination
      const logs = await query
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        logs,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error('List Activity Logs Error:', error);
      throw new Error('Failed to fetch activity logs');
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(filters = {}) {
    try {
      const { startDate, endDate } = filters;
      const conditions = [];

      if (startDate) {
        conditions.push(gte(activityLogs.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(activityLogs.createdAt, new Date(endDate)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total activities
      const [{ total }] = await (whereClause
        ? db.select({ total: sql`count(*)::int` }).from(activityLogs).where(whereClause)
        : db.select({ total: sql`count(*)::int` }).from(activityLogs));

      // Get activities by action
      const actionStats = await (whereClause
        ? db
            .select({
              action: activityLogs.action,
              count: sql`count(*)::int`,
            })
            .from(activityLogs)
            .where(whereClause)
            .groupBy(activityLogs.action)
        : db
            .select({
              action: activityLogs.action,
              count: sql`count(*)::int`,
            })
            .from(activityLogs)
            .groupBy(activityLogs.action));

      // Get activities by entity
      const entityStats = await (whereClause
        ? db
            .select({
              entity: activityLogs.entity,
              count: sql`count(*)::int`,
            })
            .from(activityLogs)
            .where(whereClause)
            .groupBy(activityLogs.entity)
        : db
            .select({
              entity: activityLogs.entity,
              count: sql`count(*)::int`,
            })
            .from(activityLogs)
            .groupBy(activityLogs.entity));

      return {
        total,
        byAction: actionStats.reduce((acc, { action, count }) => {
          acc[action] = count;
          return acc;
        }, {}),
        byEntity: entityStats.reduce((acc, { entity, count }) => {
          acc[entity] = count;
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error('Activity Stats Error:', error);
      throw new Error('Failed to fetch activity statistics');
    }
  }

  /**
   * Delete old activity logs (cleanup)
   */
  async cleanupOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await db
        .delete(activityLogs)
        .where(lte(activityLogs.createdAt, cutoffDate));

      return { deleted: result.rowCount || 0 };
    } catch (error) {
      console.error('Cleanup Logs Error:', error);
      throw new Error('Failed to cleanup old logs');
    }
  }
}

export default new ActivityLogService();
