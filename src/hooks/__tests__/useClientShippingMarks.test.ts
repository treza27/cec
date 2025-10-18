import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useClientShippingMarks } from '../useClientShippingMarks';
import { clientShippingMarkService } from '../../services/clientShippingMarkService';
import { ReactNode } from 'react';

// Mock du service
vi.mock('../../services/clientShippingMarkService');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedService = vi.mocked(clientShippingMarkService);

// Wrapper pour les tests avec QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useClientShippingMarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch shipping marks for a client', async () => {
    const mockShippingMarks = [
      {
        id: 1,
        client_id: 1,
        shipping_mark: 'TEST001',
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ];

    mockedService.getByClientId.mockResolvedValue(mockShippingMarks);

    const { result } = renderHook(() => useClientShippingMarks(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shippingMarks).toEqual(mockShippingMarks);
    expect(result.current.error).toBeNull();
  });

  it('should handle add shipping mark mutation', async () => {
    const newShippingMark = {
      id: 2,
      client_id: 1,
      shipping_mark: 'NEW001',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };

    mockedService.getByClientId.mockResolvedValue([]);
    mockedService.addToClient.mockResolvedValue(newShippingMark);

    const { result } = renderHook(() => useClientShippingMarks(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.addShippingMark('NEW001');

    expect(mockedService.addToClient).toHaveBeenCalledWith(1, 'NEW001');
  });

  it('should handle remove shipping mark mutation', async () => {
    mockedService.getByClientId.mockResolvedValue([]);
    mockedService.removeFromClient.mockResolvedValue();

    const { result } = renderHook(() => useClientShippingMarks(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.removeShippingMark(1);

    expect(mockedService.removeFromClient).toHaveBeenCalledWith(1);
  });

  it('should handle update shipping mark mutation', async () => {
    const updatedShippingMark = {
      id: 1,
      client_id: 1,
      shipping_mark: 'UPDATED001',
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    };

    mockedService.getByClientId.mockResolvedValue([]);
    mockedService.update.mockResolvedValue(updatedShippingMark);

    const { result } = renderHook(() => useClientShippingMarks(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.updateShippingMark(1, 'UPDATED001');

    expect(mockedService.update).toHaveBeenCalledWith(1, 'UPDATED001');
  });
});