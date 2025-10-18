import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Users, Package, Ship, X, AlertTriangle, Truck, Archive } from 'lucide-react';
import { useEmployeeProfile } from '../../hooks/useEmployeeProfile';

export type DashboardPage = 'profil' | 'clients' | 'inventaire' | 'departs' | 'contre-mesure' | 'livraison-enlevement' | 'archives';

interface AgentSidebarProps {
  currentPage: DashboardPage;
  isSidebarOpen: boolean;
  onPageChange: (page: DashboardPage) => void;
  onCloseSidebar: () => void;
}

export default function AgentSidebar({ currentPage, isSidebarOpen, onPageChange, onCloseSidebar }: AgentSidebarProps) {
  const { t } = useTranslation();
  const { profileData, profileLoading } = useEmployeeProfile();

  const allMenuItems = [
    { id: 'inventaire', label: t('sidebar.inventory'), icon: Package },
    { id: 'departs', label: t('sidebar.departures'), icon: Ship },
    { id: 'contre-mesure', label: t('sidebar.counterMeasure'), icon: AlertTriangle },
    { id: 'livraison-enlevement', label: t('sidebar.deliveryPickup'), icon: Truck },
    { id: 'clients', label: t('sidebar.clients'), icon: Users },
    { id: 'archives', label: 'Archives', icon: Archive },
    { id: 'profil', label: t('sidebar.profile'), icon: User },
  ];

  // Filtrer les éléments du menu selon le rôle de l'utilisateur
  const menuItems = React.useMemo(() => {
    // Si le profil est en cours de chargement, ne pas afficher d'éléments
    if (profileLoading) {
      return [];
    }

    return allMenuItems.filter(item => {
      // Si pas de profil chargé, afficher tous les éléments par défaut
      if (!profileData?.role) {
        return true;
      }

      // Restrictions pour les Responsables logistique
      if (item.id === 'clients' && profileData.role === 'Responsable logistique') {
        // Pas d'accès à la section Clients
        if (item.id === 'clients') {
          return false;
        }
      }

      // Restrictions pour les Commerciaux
      if (profileData.role === 'Commercial') {
        // Accès uniquement à : Clients, Inventaire, Départs, Profil
        const allowedPages = ['clients', 'inventaire', 'departs', 'profil'];
        return allowedPages.includes(item.id);
      }

      return true;
    });
  }, [profileLoading, profileData?.role, allMenuItems, t]);

  return (
    <div className={`${isSidebarOpen ? 'fixed inset-0 z-50 bg-black bg-opacity-50 lg:relative lg:bg-transparent' : 'hidden'} lg:block w-64 flex-shrink-0`}>
      <nav className={`${isSidebarOpen ? 'fixed left-0 top-0 h-full w-64 transform translate-x-0' : ''} lg:relative bg-white rounded-xl shadow-sm p-4 h-fit`}>
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-between items-center mb-4 pb-4 border-b">
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
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onPageChange(item.id as DashboardPage);
                      onCloseSidebar();
                    }}
                    className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                      currentPage === item.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm sm:text-base">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </div>
  );
}