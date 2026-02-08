import activityLogService from '../modules/activity/activity.service.js';

/**
 * Helper function to log activity from anywhere in the app
 * @param {Object} req - Express request object
 * @param {string} userId - User ID performing the action
 * @param {string} action - Action type (from activityActionEnum)
 * @param {string} entity - Entity type (from activityEntityEnum)
 * @param {string|number} entityId - ID of the entity being acted upon
 * @param {string} description - Human-readable description
 * @param {Object} metadata - Additional context (optional)
 */
export const logActivity = async (req, userId, action, entity, entityId, description, metadata = null) => {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await activityLogService.logActivity({
      userId,
      action,
      entity,
      entityId,
      description,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    // Silently fail - logging should never break the app
    console.error('Activity logging failed:', error);
  }
};

/**
 * Middleware to automatically log activity based on route
 * Usage: router.post('/items', logActivityMiddleware('create', 'item'), controller.createItem);
 */
export const logActivityMiddleware = (action, entity, getDescription) => {
  return async (req, res, next) => {
    // Store original send to intercept response
    const originalSend = res.send;

    res.send = function (data) {
      // Only log on successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        const entityId = req.params?.id || req.body?.id || null;
        const description = typeof getDescription === 'function' 
          ? getDescription(req, res) 
          : `${action} ${entity}`;

        // Log asynchronously without blocking response
        logActivity(req, userId, action, entity, entityId, description).catch(err => {
          console.error('Activity log error:', err);
        });
      }

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Action types (from database enum)
 */
export const ActivityAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  BLOCK: 'block',
  UNBLOCK: 'unblock',
  LOGIN: 'login',
  LOGOUT: 'logout',
  EXPORT: 'export',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  VIEW: 'view',
  ASSIGN: 'assign',
};

/**
 * Entity types (from database enum)
 */
export const ActivityEntity = {
  USER: 'user',
  VENDOR: 'vendor',
  CATEGORY: 'category',
  SUBCATEGORY: 'subcategory',
  UNIT: 'unit',
  ITEM: 'item',
  ORDER: 'order',
  PAYMENT: 'payment',
  REPORT: 'report',
  SETTINGS: 'settings',
};
