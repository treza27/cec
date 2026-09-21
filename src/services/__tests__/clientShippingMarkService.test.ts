import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clientShippingMarkService } from '../clientShippingMarkService';
import { supabase } from '../../utils/supabase';

// Mock Supabase
vi.mock('../../utils/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        neq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

const mockedSupabase = vi.mocked(supabase);

describe('clientShippingMarkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getByClientId', () => {
    it('should fetch shipping marks for a client', async () => {
      const mockData = [
        {
          id: 1,
          client_id: 1,
          shipping_mark: 'TEST001',
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ];

      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
            }))
          }))
        }))
      };

      mockedSupabase.from.mockReturnValue(mockQuery as any);

      const result = await clientShippingMarkService.getByClientId(1);

      expect(result).toEqual(mockData);
      expect(mockedSupabase.from).toHaveBeenCalledWith('client_shipping_marks');
    });

    it('should handle errors when fetching shipping marks', async () => {
      const mockError = { message: 'Database error' };
      
      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: null, error: mockError }))
            }))
          }))
        }))
      };

      mockedSupabase.from.mockReturnValue(mockQuery as any);

      await expect(clientShippingMarkService.getByClientId(1))
        .rejects.toThrow('Erreur lors de la récupération des shipping marks: Database error');
    });
  });

  describe('addToClient', () => {
    it('should add shipping mark to client', async () => {
      const mockData = {
        id: 1,
        client_id: 1,
        shipping_mark: 'TEST001',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      const mockQuery = {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
          }))
        }))
      };

      mockedSupabase.from.mockReturnValue(mockQuery as any);

      const result = await clientShippingMarkService.addToClient(1, 'TEST001');

      expect(result).toEqual(mockData);
      expect(mockQuery.insert).toHaveBeenCalledWith({
        client_id: 1,
        shipping_mark: 'TEST001',
        is_active: true
      });
    });
  });

  describe('checkShippingMarkExists', () => {
    it('should return true if shipping mark exists', async () => {
      const mockData = [{ id: 1 }];
      
      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
          }))
        }))
      };

      mockedSupabase.from.mockReturnValue(mockQuery as any);

      const result = await clientShippingMarkService.checkShippingMarkExists('TEST001');

      expect(result).toBe(true);
    });

    it('should return false if shipping mark does not exist', async () => {
      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      };

      mockedSupabase.from.mockReturnValue(mockQuery as any);

      const result = await clientShippingMarkService.checkShippingMarkExists('NONEXISTENT');

      expect(result).toBe(false);
    });
  });

  describe('getAllUniqueShippingMarks', () => {
    it('should return unique shipping marks', async () => {
      const mockData = [
        { shipping_mark: 'TEST001' },
        { shipping_mark: 'TEST002' },
        { shipping_mark: 'TEST001' }, // Duplicate
        { shipping_mark: 'TEST003' }
      ];

      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
          }))
        }))
      };

      mockedSupabase.from.mockReturnValue(mockQuery as any);

      const result = await clientShippingMarkService.getAllUniqueShippingMarks();

      expect(result).toEqual(['TEST001', 'TEST002', 'TEST003']);
    });
  });
});