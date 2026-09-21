import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TrackingForm from '../TrackingForm';
import { ReactNode } from 'react';

// Mock des traductions
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'tracking.title': 'Suivre votre colis',
        'tracking.description': 'Entrez vos informations pour connaître l\'état de votre envoi',
        'tracking.pseudo': 'Pseudo',
        'tracking.phone': 'Numéro de téléphone',
        'tracking.trackPackage': 'Suivre mon colis',
        'tracking.searching': 'Recherche...',
        'tracking.testHint': 'Pour tester le système, utilisez le pseudo "Jean Rakoto" avec n\'importe quel numéro de téléphone.',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock du hook useClients
vi.mock('../../hooks/useClients', () => ({
  useClients: () => ({
    shippingMarks: ['TEST001', 'TEST002', 'JR2024001'],
    loading: false,
    error: null,
  }),
}));

// Mock du service d'inventaire
vi.mock('../../services/inventoryService', () => ({
  inventoryService: {
    searchByShippingMarkAndClient: vi.fn(() => Promise.resolve([])),
  },
}));

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

describe('TrackingForm', () => {
  const mockOnTrackingResult = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form elements correctly', () => {
    render(<TrackingForm onTrackingResult={mockOnTrackingResult} />, {
      wrapper: createWrapper(),
    }
    )
    expect(screen.getByRole('combobox', { name: /shipping mark/i })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /suivre votre colis/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /shipping mark/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /pseudo/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /numéro de téléphone/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /suivre mon colis/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<TrackingForm onTrackingResult={mockOnTrackingResult} />, {
      wrapper: createWrapper(),
    });

    // Remplir les champs requis avec des données qui ne donneront pas de résultat
    const pseudoInput = screen.getByRole('textbox', { name: /pseudo/i });
    const phoneInput = screen.getByRole('textbox', { name: /numéro de téléphone/i });
    
    await user.type(pseudoInput, 'Non Existent');
    await user.type(phoneInput, '0000000000');

    const submitButton = screen.getByRole('button', { name: /suivre mon colis/i });
    await user.click(submitButton);

    // Vérifier qu'un message d'erreur apparaît
    await waitFor(() => {
      expect(screen.getByText(/aucun colis trouvé/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    // Mock pour retourner des données de test
    const mockInventoryService = vi.mocked(await import('../../services/inventoryService'));
    mockInventoryService.inventoryService.searchByShippingMarkAndClient.mockResolvedValue([
      {
        id: 1,
        shipping_mark: 'TEST001',
        description: 'Test package',
        statut: 'en_route_madagascar',
        date_entree: '2024-01-01',
        nb_cartons: 5,
        poids: 10.5,
        volume: 2.3,
        client_nom: 'Jean',
        client_prenom: 'Rakoto'
      }
    ]);

    const user = userEvent.setup();
    render(<TrackingForm onTrackingResult={mockOnTrackingResult} />, {
      wrapper: createWrapper(),
    });

    const shippingMarkInput = screen.getByRole('combobox', { name: /shipping mark/i });
    const pseudoInput = screen.getByRole('textbox', { name: /pseudo/i });
    const phoneInput = screen.getByRole('textbox', { name: /numéro de téléphone/i });
    const submitButton = screen.getByRole('button', { name: /suivre mon colis/i });

    await user.type(shippingMarkInput, 'TEST001');
    await user.type(pseudoInput, 'Jean Rakoto');
    await user.type(phoneInput, '+261341234567');
    await user.click(submitButton);

    // Vérifier que le bouton affiche l'état de chargement
    await waitFor(() => {
      expect(screen.getByText(/recherche/i)).toBeInTheDocument();
    });

    // Vérifier que onTrackingResult est appelé avec les résultats
    await waitFor(() => {
      expect(mockOnTrackingResult).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          shipping_mark: 'TEST001',
          client_nom: 'Jean'
        })
      ]));
    });
  });

  it('displays test hint', () => {
    render(<TrackingForm onTrackingResult={mockOnTrackingResult} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/pour tester le système/i)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<TrackingForm onTrackingResult={mockOnTrackingResult} />, {
      wrapper: createWrapper(),
    });

    const shippingMarkInput = screen.getByRole('textbox', { name: /shipping mark/i });
    const pseudoInput = screen.getByRole('textbox', { name: /pseudo/i });
    const phoneInput = screen.getByRole('textbox', { name: /numéro de téléphone/i });

    expect(pseudoInput).toHaveAttribute('required');
    expect(phoneInput).toHaveAttribute('required');
    expect(phoneInput).toHaveAttribute('type', 'tel');
    expect(shippingMarkInput).toHaveAttribute('list', 'available-shipping-marks');
  });
});