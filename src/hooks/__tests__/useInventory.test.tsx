import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInventory } from '../useInventory';
import { inventoryService } from '../../services/inventoryService';
import { ReactNode } from 'react';

// Mock du service
vi.mock('../../services/inventoryService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedInventoryService = vi.mocked(inventoryService);

// Wrapper pour les tests avec QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch inventory items successfully', async () => {
    const mockItems = [
      {
        id: 1,
        bl: 'BL001',
        dateEntree: '2024-01-01',
        description: 'Test item',
        poids: '10',
        volume: '1',
        nbPalettes: '1',
        nbCartons: '5',
        statut: 'enregistre_chine',
        entrepot: 'Guangzhou',
        shippingMark: 'TEST001',
        nature: 'GG',
        msds: false,
        images: [],
      },
    ];

    mockedInventoryService.getAll.mockResolvedValue(mockItems);

    const { result } = renderHook(() => useInventory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual(mockItems);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    const errorMessage = 'Failed to fetch';
    mockedInventoryService.getAll.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useInventory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.items).toEqual([]);
  });

  it('should add item successfully', async () => {
    const newItem = {
      bl: 'BL002',
      dateEntree: '2024-01-02',
      description: 'New test item',
      poids: '15',
      volume: '2',
      nbPalettes: '2',
      nbCartons: '10',
      statut: 'enregistre_chine',
      entrepot: 'Yiwu',
      shippingMark: 'TEST002',
      nature: 'SG',
      msds: true,
      images: [],
    };

    const createdItem = { ...newItem, id: 2 };
    mockedInventoryService.getAll.mockResolvedValue([]);
    mockedInventoryService.create.mockResolvedValue(createdItem);

    const { result } = renderHook(() => useInventory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.addItem(newItem);

    expect(mockedInventoryService.create).toHaveBeenCalledWith(newItem);
  });
});