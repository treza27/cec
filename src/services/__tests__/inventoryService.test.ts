import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inventoryService, convertFromSupabase, convertToSupabase } from '../inventoryService';
import { supabase } from '../../utils/supabase';

// Mock Supabase
vi.mock('../../utils/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          then: vi.fn(),
        })),
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

const mockedSupabase = vi.mocked(supabase);

describe('inventoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertFromSupabase', () => {
    it('should convert Supabase data to app format', () => {
      const supabaseItem = {
        id: 1,
        bl: 'BL001',
        date_entree: '2024-01-01',
        num_recu: 'REC001',
        entrepot: 'Guangzhou',
        shipping_mark: 'MARK001',
        description: 'Test item',
        nb_palettes: 2,
        nb_cartons: 10,
        poids: 25.5,
        volume: 2.3,
        nature: 'GG',
        msds: true,
        statut: 'enregistre_chine',
        nb_palettes_tana: null,
        nb_cartons_tana: null,
        poids_tana: null,
        volume_tana: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = convertFromSupabase(supabaseItem);

      expect(result).toEqual({
        id: 1,
        bl: 'BL001',
        dateEntree: '2024-01-01',
        numRecu: 'REC001',
        entrepot: 'Guangzhou',
        shippingMark: 'MARK001',
        description: 'Test item',
        nbPalettes: '2',
        nbCartons: '10',
        poids: '25.5',
        volume: '2.3',
        nature: 'GG',
        msds: true,
        images: [],
        statut: 'enregistre_chine',
        nbPalettesTana: '',
        nbCartonsTana: '',
        poidsTana: '',
        volumeTana: '',
      });
    });

    it('should handle null values correctly', () => {
      const supabaseItem = {
        id: 1,
        bl: 'BL001',
        date_entree: '2024-01-01',
        num_recu: null,
        entrepot: null,
        shipping_mark: null,
        description: 'Test item',
        nb_palettes: null,
        nb_cartons: null,
        poids: 0,
        volume: 0,
        nature: null,
        msds: null,
        statut: null,
        nb_palettes_tana: null,
        nb_cartons_tana: null,
        poids_tana: null,
        volume_tana: null,
        created_at: null,
        updated_at: null,
      };

      const result = convertFromSupabase(supabaseItem);

      expect(result.numRecu).toBe('');
      expect(result.entrepot).toBe('');
      expect(result.shippingMark).toBe('');
      expect(result.nbPalettes).toBe('0');
      expect(result.nbCartons).toBe('1');
      expect(result.nature).toBe('');
      expect(result.msds).toBe(false);
      expect(result.statut).toBe('enregistre_chine');
    });
  });

  describe('convertToSupabase', () => {
    it('should convert app data to Supabase format', () => {
      const appItem = {
        bl: 'BL001',
        dateEntree: '2024-01-01',
        numRecu: 'REC001',
        entrepot: 'Guangzhou',
        shippingMark: 'MARK001',
        description: 'Test item',
        nbPalettes: '2',
        nbCartons: '10',
        poids: '25.5',
        volume: '2.3',
        nature: 'GG',
        msds: true,
        statut: 'enregistre_chine',
      };

      const result = convertToSupabase(appItem);

      expect(result).toEqual({
        bl: 'BL001',
        date_entree: '2024-01-01',
        num_recu: 'REC001',
        entrepot: 'Guangzhou',
        shipping_mark: 'MARK001',
        description: 'Test item',
        nb_palettes: 2,
        nb_cartons: 10,
        poids: 25.5,
        volume: 2.3,
        nature: 'GG',
        msds: true,
        statut: 'enregistre_chine',
      });
    });

    it('should handle empty strings and convert to null', () => {
      const appItem = {
        numRecu: '',
        entrepot: '',
        nature: '',
      };

      const result = convertToSupabase(appItem);

      expect(result.num_recu).toBeNull();
      expect(result.entrepot).toBeNull();
      expect(result.nature).toBeNull();
    });
  });
});