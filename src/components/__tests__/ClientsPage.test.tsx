import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClientsPage from '../agent/ClientsPage';
import { clientService } from '../../services/clientService';
import { ReactNode } from 'react';

// Mock des services
vi.mock('../../services/clientService');
vi.mock('../../hooks/useClients');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedClientService = vi.mocked(clientService);

// Mock du hook useClients
vi.mock('../../hooks/useClients', () => ({
  useClients: () => ({
    clients: [
      {
        id: 1,
        nom: 'Rakoto',
        prenom: 'Jean',
        entreprise: 'Test SARL',
        quartier_ville: 'Antananarivo',
        telephone: '+261341234567',
        shipping_marks: [
          { id: 1, client_id: 1, shipping_mark: 'JR2024001', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
          { id: 2, client_id: 1, shipping_mark: 'JR2024002', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' }
        ]
      }
    ],
    shippingMarks: ['JR2024001', 'JR2024002', 'TEST001'],
    loading: false,
    error: null,
    refreshClients: vi.fn(),
  }),
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

describe('ClientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render clients list correctly', () => {
    render(<ClientsPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Gestion des Clients')).toBeInTheDocument();
    expect(screen.getByText('Rakoto Jean')).toBeInTheDocument();
    expect(screen.getByText('Test SARL')).toBeInTheDocument();
    expect(screen.getByText('JR2024001')).toBeInTheDocument();
    expect(screen.getByText('JR2024002')).toBeInTheDocument();
  });

  it('should allow adding new shipping marks', async () => {
    const user = userEvent.setup();
    render(<ClientsPage />, { wrapper: createWrapper() });

    // Cliquer sur modifier pour un client
    const editButton = screen.getByRole('button', { name: /modifier/i });
    await user.click(editButton);

    // Ajouter une nouvelle shipping mark
    const shippingMarkInput = screen.getByPlaceholderText('Ajouter une shipping mark...');
    await user.clear(shippingMarkInput);
    await user.type(shippingMarkInput, 'NEW2024001');

    const addButton = screen.getByRole('button', { name: /ajouter/i });
    await user.click(addButton);

    // Vérifier que la shipping mark a été ajoutée visuellement
    await waitFor(() => {
      expect(shippingMarkInput).toHaveValue('');
    });
  });

  it('should handle form submission for new client', async () => {
    const user = userEvent.setup();
    mockedClientService.create.mockResolvedValue({
      id: 2,
      nom: 'Test',
      prenom: 'User',
      entreprise: 'Test Company',
      quartier_ville: 'Test City',
      telephone: '+261341111111',
      shipping_marks: []
    });

    render(<ClientsPage />, { wrapper: createWrapper() });

    // Cliquer sur nouveau client
    const newClientButton = screen.getByRole('button', { name: /nouveau client/i });
    await user.click(newClientButton);

    // Remplir le formulaire
    await user.type(screen.getByPlaceholderText('Nom du client'), 'Test');
    await user.type(screen.getByPlaceholderText('Prénom du client'), 'User');
    await user.type(screen.getByPlaceholderText('Nom de l\'entreprise'), 'Test Company');
    await user.type(screen.getByPlaceholderText('Quartier/Ville'), 'Test City');
    await user.type(screen.getByPlaceholderText('+261 34 12 345 67'), '+261341111111');

    // Ajouter une shipping mark
    const shippingMarkInput = screen.getByPlaceholderText('Ajouter une shipping mark...');
    await user.type(shippingMarkInput, 'TEST2024001');
    const addShippingMarkButton = screen.getByRole('button', { name: /ajouter/i });
    await user.click(addShippingMarkButton);

    // Soumettre le formulaire
    const submitButton = screen.getByRole('button', { name: /créer le client/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedClientService.create).toHaveBeenCalledWith({
        nom: 'Test',
        prenom: 'User',
        entreprise: 'Test Company',
        quartier_ville: 'Test City',
        telephone: '+261341111111',
        shipping_marks: ['TEST2024001']
      });
    });
  });

  it('should filter clients based on search term', async () => {
    const user = userEvent.setup();
    render(<ClientsPage />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/rechercher par nom/i);
    await user.type(searchInput, 'Jean');

    // Le client Jean Rakoto devrait être visible
    expect(screen.getByText('Rakoto Jean')).toBeInTheDocument();
  });

  it('should handle shipping mark removal', async () => {
    const user = userEvent.setup();
    render(<ClientsPage />, { wrapper: createWrapper() });

    // Cliquer sur modifier pour un client
    const editButton = screen.getByRole('button', { name: /modifier/i });
    await user.click(editButton);

    // Les shipping marks devraient être visibles avec des boutons de suppression
    const removeButtons = screen.getAllByRole('button');
    const shippingMarkRemoveButton = removeButtons.find(button => 
      button.querySelector('svg')?.classList.contains('w-3')
    );

    if (shippingMarkRemoveButton) {
      await user.click(shippingMarkRemoveButton);
    }
  });
});