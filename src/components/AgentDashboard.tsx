import React, { useState } from 'react';
import AgentHeader from './agent/AgentHeader';
import AgentSidebar, { DashboardPage } from './agent/AgentSidebar';
import InventoryPage from './agent/InventoryPage';
import ProfilePage from './agent/ProfilePage';
import ClientsPage from './agent/ClientsPage';
import DepartsPage from './agent/DepartsPage';
import ContreMesurePage from './agent/ContreMesurePage';
import LivraisonEnlevementPage from './agent/LivraisonEnlevementPage';
import ArchivesPage from './agent/ArchivesPage';
import { useEmployeeProfile } from '../hooks/useEmployeeProfile';

interface AgentDashboardProps {
  onLogout: () => void;
}

export default function AgentDashboard({ onLogout }: AgentDashboardProps) {
  const [currentPage, setCurrentPage] = useState<DashboardPage>('inventaire');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profileData } = useEmployeeProfile();

  // Fonction pour vérifier si l'utilisateur a accès à une page
  const hasAccessToPage = (page: DashboardPage): boolean => {
    // Si pas de profil chargé, autoriser l'accès par défaut
    if (!profileData?.role) {
      return true;
    }

    // Restrictions pour les Responsables logistique
    if (profileData.role === 'Responsable logistique') {
      // Pas d'accès à la section Clients
      if (page === 'clients') {
        return false;
      }
    }

    // Restrictions pour les Commerciaux
    if (profileData.role === 'Commercial') {
      // Accès uniquement à : Clients, Inventaire, Départs, Profil
      const allowedPages: DashboardPage[] = ['clients', 'inventaire', 'departs', 'profil'];
      return allowedPages.includes(page);
    }

    return true;
  };

  // Rediriger vers une page autorisée si l'utilisateur n'a pas accès à la page actuelle
  React.useEffect(() => {
    if (!hasAccessToPage(currentPage)) {
      setCurrentPage('inventaire'); // Rediriger vers l'inventaire par défaut
    }
  }, [currentPage, profileData?.role]);
  const renderPageContent = () => {
    // Vérifier l'accès avant de rendre le contenu
    if (!hasAccessToPage(currentPage)) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Accès non autorisé</h3>
            <p className="text-red-700">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
          </div>
        </div>
      );
    }
    switch (currentPage) {
      case 'profil':
        return <ProfilePage />;

      case 'clients':
        return <ClientsPage />;

      case 'contre-mesure':
        return <ContreMesurePage />;

      case 'livraison-enlevement':
        return (
          <LivraisonEnlevementPage />
        );

      case 'archives':
        return <ArchivesPage />;

      case 'inventaire':
        return <InventoryPage />;

      case 'departs':
        return <DepartsPage />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AgentHeader
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={onLogout}
      />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex gap-4 lg:gap-8 relative">
          <AgentSidebar
            currentPage={currentPage}
            isSidebarOpen={isSidebarOpen}
            onPageChange={setCurrentPage}
            onCloseSidebar={() => setIsSidebarOpen(false)}
          />

          <div className="flex-1 min-w-0">
            {renderPageContent()}
          </div>
        </div>
      </div>
    </div>
  );
}