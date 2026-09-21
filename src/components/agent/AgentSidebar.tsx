import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { User, Users, Package, Ship, X, AlertTriangle, Truck, Archive, RefreshCw, ShoppingCart, UserCog, Settings, LayoutDashboard, Newspaper, Wallet, Images, ShoppingBag } from 'lucide-react';
import { useEmployeeProfileContext } from '../../contexts/EmployeeProfileContext';
import { inventoryService } from '../../services/inventoryService';
import { departureService } from '../../services/departureService';
import { clientShippingMarkService } from '../../services/clientShippingMarkService';
import { achatService } from '../../services/achatService';
import { inventoryKeys } from '../../hooks/useInventory';
import { departureKeys } from '../../hooks/useDepartures';
import { achatKeys } from '../../hooks/useAchats';

export type DashboardPage = 'dashboard' | 'profil' | 'clients' | 'inventaire' | 'departs' | 'contre-mesure' | 'livraison-enlevement' | 'archives' | 'photos' | 'migration-pseudo' | 'achats' | 'employes' | 'parametres' | 'actualites' | 'comptabilite' | 'sourcing';

interface AgentSidebarProps {
  currentPage: DashboardPage;
  isSidebarOpen: boolean;
  onPageChange: (page: DashboardPage) => void;
  onCloseSidebar: () => void;
}

export default function AgentSidebar({ currentPage, isSidebarOpen, onPageChange, onCloseSidebar }: AgentSidebarProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { profileData, profileLoading } = useEmployeeProfileContext();

  const allMenuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'inventaire', label: t('sidebar.inventory'), icon: Package },
    { id: 'departs', label: t('sidebar.departures'), icon: Ship },
    { id: 'achats', label: 'Achats', icon: ShoppingCart },
    { id: 'contre-mesure', label: t('sidebar.counterMeasure'), icon: AlertTriangle },
    { id: 'livraison-enlevement', label: t('sidebar.deliveryPickup'), icon: Truck },
    { id: 'clients', label: t('sidebar.clients'), icon: Users },
    { id: 'archives', label: 'Archives', icon: Archive },
    { id: 'photos', label: 'Photos', icon: Images },
    { id: 'migration-pseudo', label: 'Migration Pseudos', icon: RefreshCw },
    { id: 'employes', label: 'Employés', icon: UserCog },
    { id: 'parametres', label: 'Paramètres', icon: Settings },
    { id: 'comptabilite', label: 'Comptabilité', icon: Wallet },
    { id: 'actualites', label: 'Actualités', icon: Newspaper },
    { id: 'sourcing', label: 'Sourcing', icon: ShoppingBag },
    { id: 'profil', label: t('sidebar.profile'), icon: User },
  ];

  const FITAHIANA_USER_ID = '857beed1-d000-40d5-b899-7a126d52768b';

  const ROLE_ALLOWED_PAGES: Record<string, string[]> = {
    acheteur: ['inventaire', 'departs', 'achats', 'livraison-enlevement', 'clients', 'photos', 'comptabilite', 'profil'],
    commercial: ['inventaire', 'departs', 'achats', 'contre-mesure', 'livraison-enlevement', 'clients', 'photos', 'actualites', 'profil'],
    logisticien: ['inventaire', 'departs', 'contre-mesure', 'livraison-enlevement', 'photos', 'profil'],
    tresorier: ['inventaire', 'contre-mesure', 'livraison-enlevement', 'clients', 'photos', 'comptabilite', 'profil'],
    administrateur: ['dashboard', 'inventaire', 'departs', 'achats', 'contre-mesure', 'livraison-enlevement', 'clients', 'archives', 'photos', 'migration-pseudo', 'employes', 'parametres', 'actualites', 'comptabilite', 'sourcing', 'profil'],
  };

  if (profileData?.role === 'commercial' && profileData?.user_id === FITAHIANA_USER_ID) {
    ROLE_ALLOWED_PAGES.commercial = [...ROLE_ALLOWED_PAGES.commercial, 'sourcing'];
  }

  const prefetchPage = React.useCallback((page: string) => {
    switch (page) {
      case 'inventaire':
        queryClient.prefetchQuery({
          queryKey: inventoryKeys.lists(null),
          queryFn: inventoryService.getAll,
          staleTime: 5 * 60 * 1000,
        });
        break;
      case 'departs':
        queryClient.prefetchQuery({
          queryKey: departureKeys.lists(null),
          queryFn: () => departureService.getAll().then(items => items.filter(i => i.statut !== 'archive')),
          staleTime: 5 * 60 * 1000,
        });
        break;
      case 'achats':
        queryClient.prefetchQuery({
          queryKey: achatKeys.list(undefined),
          queryFn: () => achatService.getAll(),
          staleTime: 5 * 60 * 1000,
        });
        break;
      case 'clients':
        queryClient.prefetchQuery({
          queryKey: ['clients', null],
          queryFn: clientShippingMarkService.getAllClientsWithShippingMarks,
          staleTime: 5 * 60 * 1000,
        });
        break;
      default:
        break;
    }
  }, [queryClient]);

  // Filtrer les éléments du menu selon le rôle de l'utilisateur
  const menuItems = React.useMemo(() => {
    if (profileLoading) {
      return [];
    }

    return allMenuItems.filter(item => {
      if (!profileData?.role) {
        return true;
      }

      const allowedPages = ROLE_ALLOWED_PAGES[profileData.role];
      if (!allowedPages) {
        return true;
      }

      return allowedPages.includes(item.id);
    });
  }, [profileLoading, profileData?.role, allMenuItems, t]);

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={onCloseSidebar}
          aria-hidden="true"
        />
      )}
    <div className={`${isSidebarOpen ? 'fixed left-0 top-0 h-full z-50' : 'hidden'} md:block md:relative md:z-auto w-56 lg:w-64 flex-shrink-0`}>
      <nav className="bg-white md:rounded-xl shadow-sm p-3 lg:p-4 h-full md:h-fit overflow-y-auto">
        {/* Mobile close button */}
        <div className="md:hidden flex justify-between items-center mb-4 pb-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{t('sidebar.menu')}</h2>
          <button
            onClick={onCloseSidebar}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {profileLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Chargement du menu...</span>
          </div>
        ) : (
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onMouseEnter={() => prefetchPage(item.id)}
                    onClick={() => {
                      onPageChange(item.id as DashboardPage);
                      onCloseSidebar();
                    }}
                    className={`w-full flex items-center space-x-2 lg:space-x-3 px-2 lg:px-3 py-2.5 rounded-lg text-left transition-colors duration-200 ${
                      currentPage === item.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </div>
    </>
  );
}