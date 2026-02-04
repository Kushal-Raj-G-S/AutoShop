import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import itemService from './item.service.js';

// Mock the database
jest.mock('../../db/index.js', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
}));

// Mock the slug utility
jest.mock('../../utils/slug.js', () => ({
  generateSlug: jest.fn((text) => text.toLowerCase().replace(/\s+/g, '-')),
  ensureUniqueSlug: jest.fn((slug) => Promise.resolve(slug)),
}));

describe('ItemService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createItem', () => {
    it('should create an item successfully when actor is admin', async () => {
      const { db } = await import('../../db/index.js');
      const { ensureUniqueSlug } = await import('../../utils/slug.js');

      const mockActor = { id: 'admin-123', role: 'admin' };
      const mockPayload = {
        categoryId: 1,
        name: 'Test Item',
        description: 'Test description',
        price: 29.99,
        imageUrl: 'https://example.com/image.jpg',
        stock: 10,
      };

      const mockCategory = [{ id: 1 }];
      const mockCreatedItem = {
        id: 1,
        ...mockPayload,
        slug: 'test-item',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock category exists check
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockCategory),
      });

      // Mock slug generation
      ensureUniqueSlug.mockResolvedValue('test-item');

      // Mock transaction
      db.transaction.mockImplementation(async (callback) => {
        const tx = {
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([mockCreatedItem]),
            }),
          }),
        };
        return callback(tx);
      });

      const result = await itemService.createItem(mockPayload, mockActor);

      expect(result).toEqual(mockCreatedItem);
      expect(ensureUniqueSlug).toHaveBeenCalledWith('test-item', expect.anything());
    });

    it('should throw forbidden error when actor is not admin', async () => {
      const mockActor = { id: 'user-123', role: 'customer' };
      const mockPayload = {
        categoryId: 1,
        name: 'Test Item',
        price: 29.99,
      };

      await expect(itemService.createItem(mockPayload, mockActor)).rejects.toThrow(
        'FORBIDDEN: Only admins can create items'
      );
    });

    it('should throw validation error when category does not exist', async () => {
      const { db } = await import('../../db/index.js');

      const mockActor = { id: 'admin-123', role: 'admin' };
      const mockPayload = {
        categoryId: 999,
        name: 'Test Item',
        price: 29.99,
      };

      // Mock category not found
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      await expect(itemService.createItem(mockPayload, mockActor)).rejects.toThrow(
        'VALIDATION: Category not found'
      );
    });

    it('should throw validation error when price is negative', async () => {
      const { db } = await import('../../db/index.js');

      const mockActor = { id: 'admin-123', role: 'admin' };
      const mockPayload = {
        categoryId: 1,
        name: 'Test Item',
        price: -10,
      };

      // Mock category exists
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ id: 1 }]),
      });

      await expect(itemService.createItem(mockPayload, mockActor)).rejects.toThrow(
        'VALIDATION: Price must be a non-negative number'
      );
    });
  });

  describe('updateItem', () => {
    it('should throw forbidden error when actor is not admin', async () => {
      const mockActor = { id: 'user-123', role: 'customer' };
      const mockPayload = { price: 39.99 };

      await expect(itemService.updateItem(1, mockPayload, mockActor)).rejects.toThrow(
        'FORBIDDEN: Only admins can update items'
      );
    });

    it('should throw not found error when item does not exist', async () => {
      const { db } = await import('../../db/index.js');

      const mockActor = { id: 'admin-123', role: 'admin' };
      const mockPayload = { price: 39.99 };

      // Mock item not found
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      await expect(itemService.updateItem(999, mockPayload, mockActor)).rejects.toThrow(
        'NOT_FOUND: Item not found'
      );
    });

    it('should update item successfully', async () => {
      const { db } = await import('../../db/index.js');

      const mockActor = { id: 'admin-123', role: 'admin' };
      const mockPayload = { price: 39.99 };
      const mockExistingItem = [
        {
          id: 1,
          name: 'Test Item',
          slug: 'test-item',
          price: '29.99',
        },
      ];
      const mockUpdatedItem = { ...mockExistingItem[0], price: '39.99' };

      // Mock item exists check
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockExistingItem),
      });

      // Mock update
      db.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockUpdatedItem]),
      });

      const result = await itemService.updateItem(1, mockPayload, mockActor);

      expect(result).toEqual(mockUpdatedItem);
    });
  });

  describe('deleteItem', () => {
    it('should delete item successfully when actor is admin', async () => {
      const { db } = await import('../../db/index.js');

      const mockActor = { id: 'admin-123', role: 'admin' };
      const mockItem = [{ id: 1, name: 'Test Item' }];

      // Mock item exists check
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockItem),
      });

      // Mock delete
      db.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      const result = await itemService.deleteItem(1, mockActor);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw forbidden error when actor is not admin', async () => {
      const mockActor = { id: 'user-123', role: 'customer' };

      await expect(itemService.deleteItem(1, mockActor)).rejects.toThrow(
        'FORBIDDEN: Only admins can delete items'
      );
    });
  });

  describe('getItemById', () => {
    it('should return item when it exists and is active', async () => {
      const { db } = await import('../../db/index.js');

      const mockItem = [
        {
          id: 1,
          name: 'Test Item',
          slug: 'test-item',
          price: '29.99',
          isActive: true,
        },
      ];

      db.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockItem),
      });

      const result = await itemService.getItemById(1, null);

      expect(result).toEqual(mockItem[0]);
    });

    it('should throw not found error when item does not exist', async () => {
      const { db } = await import('../../db/index.js');

      db.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      await expect(itemService.getItemById(999, null)).rejects.toThrow(
        'NOT_FOUND: Item not found'
      );
    });

    it('should hide inactive items from non-admin users', async () => {
      const { db } = await import('../../db/index.js');

      const mockItem = [
        {
          id: 1,
          name: 'Test Item',
          isActive: false,
        },
      ];

      db.select.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockItem),
      });

      const customerActor = { id: 'user-123', role: 'customer' };

      await expect(itemService.getItemById(1, customerActor)).rejects.toThrow(
        'NOT_FOUND: Item not found'
      );
    });
  });

  describe('listItemsPublic', () => {
    it('should return paginated list of active items', async () => {
      const { db } = await import('../../db/index.js');

      const mockItems = [
        { id: 1, name: 'Item 1', price: '29.99', isActive: true },
        { id: 2, name: 'Item 2', price: '39.99', isActive: true },
      ];

      // Mock count query
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 2 }]),
      });

      // Mock items query
      db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockItems),
      });

      const result = await itemService.listItemsPublic({ page: 1, limit: 20 });

      expect(result.items).toEqual(mockItems);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });
  });
});
