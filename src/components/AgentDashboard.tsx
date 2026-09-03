import React, { useState, Suspense, lazy } from 'react';
import AgentHeader from './agent/AgentHeader';
import AgentSidebar, { DashboardPage } from './agent/AgentSidebar';
import { EmployeeProfileProvider, useEmployeeProfileContext } from '../contexts/EmployeeProfileContext';

const InventoryPage = lazy(() => import('./agent/InventoryPage'));
const ProfilePage = lazy(() => import('./agent/ProfilePage'));
const ClientsPage = lazy(() => import('./agent/ClientsPage'));
const DepartsPage = lazy(() => import('./agent/DepartsPage'));
const ContreMesurePage = lazy(() => import('./agent/ContreMesurePage'));
const LivraisonEnlevementPage = lazy(() => import('./agent/LivraisonEnlevementPage'));
const ArchivesPage = lazy(() => import('./agent/ArchivesPage'));
const PseudoMigrationTool = lazy(() => import('./agent/PseudoMigrationTool'));
const AchatsPage = lazy(() => import('./agent/AchatsPage'));
const EmployesPage = lazy(() => import('./agent/EmployesPage'));
const ParametresEntreprisePage = lazy(() => import('./agent/ParametresEntreprisePage'));
const DashboardAdminPage = lazy(() => import('./agent/dashboard/DashboardPage'));
const ActualitesAgentPage = lazy(() => import('./agent/ActualitesAgentPage'));
const ComptabilitePage = lazy(() => import('./agent/comptabilite/ComptabilitePage'));
const PhotosPage = lazy(() => import('./agent/PhotosPage'));
const SourcingPage = lazy(() => import('./agent/sourcing/SourcingPage'));

interface AgentDashboardProps {
  onLogout: () => void;
}

function AgentDashboardInner({ onLogout }: AgentDashboardProps) {
  const [currentPage, setCurrentPage] = useState<DashboardPage>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { profileData, profileLoading } = useEmployeeProfileContext();

  if (profileLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  const FITAHIANA_USER_ID = '857beed1-d000-40d5-b899-7a126d52768b';

  const ROLE_ALLOWED_PAGES: Record<string, DashboardPage[]> = {
    acheteur: ['inventaire', 'departs', 'achats', 'livraison-enlevement', 'clients', 'photos', 'comptabilite', 'profil'],
    commercial: ['inventaire', 'departs', 'achats', 'contre-mesure', 'livraison-enlevement', 'clients', 'photos', 'actualites', 'profil'],
    logisticien: ['inventaire', 'departs', 'contre-mesure', 'livraison-enlevement', 'photos', 'profil'],
    tresorier: ['inventaire', 'contre-mesure', 'livraison-enlevement', 'clients', 'photos', 'comptabilite', 'profil'],
    administrateur: ['dashboard', 'inventaire', 'departs', 'achats', 'contre-mesure', 'livraison-enlevement', 'clients', 'archives', 'photos', 'migration-pseudo', 'employes', 'parametres', 'actualites', 'comptabilite', 'sourcing', 'profil'],
  };

  if (profileData?.role === 'commercial' && profileData?.user_id === FITAHIANA_USER_ID) {
    ROLE_ALLOWED_PAGES.commercial = [...ROLE_ALLOWED_PAGES.commercial, 'sourcing'];
  }

  const hasAccessToPage = (page: DashboardPage): boolean => {
    if (!profileData?.role) return false;
    const allowedPages = ROLE_ALLOWED_PAGES[profileData.role];
    if (!allowedPages) return false;
    return allowedPages.includes(page);
  };

  const safeCurrentPage: DashboardPage = hasAccessToPage(currentPage)
    ? currentPage
    : profileData?.role === 'administrateur' ? 'dashboard' : 'inventaire';
  const renderPageContent = () => {
    switch (safeCurrentPage) {
      case 'dashboard': return <DashboardAdminPage />;
      case 'profil': return <ProfilePage />;
      case 'clients': return <ClientsPage />;
      case 'contre-mesure': return <ContreMesurePage />;
      case 'livraison-enlevement': return <LivraisonEnlevementPage />;
      case 'archives': return <ArchivesPage />;
      case 'photos': return <PhotosPage />;
      case 'migration-pseudo': return <PseudoMigrationTool />;
      case 'employes': return <EmployesPage />;
      case 'parametres': return <ParametresEntreprisePage />;
      case 'inventaire': return <InventoryPage />;
      case 'departs': return <DepartsPage />;
      case 'achats': return <AchatsPage />;
      case 'actualites': return <ActualitesAgentPage />;
      case 'comptabilite': return <ComptabilitePage />;
      case 'sourcing': return <SourcingPage />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AgentHeader
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={onLogout}
      />

      <div className="w-full px-3 md:px-5 lg:px-8 py-3 md:py-5 lg:py-8">
        <div className="flex gap-3 md:gap-4 lg:gap-6 relative">
          <AgentSidebar
            currentPage={safeCurrentPage}
            isSidebarOpen={isSidebarOpen}
            onPageChange={setCurrentPage}
            onCloseSidebar={() => setIsSidebarOpen(false)}
          />

          <div className="flex-1 min-w-0">
            <Suspense fallback={
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              {renderPageContent()}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentDashboard({ onLogout }: AgentDashboardProps) {
  return (
    <EmployeeProfileProvider>
      <AgentDashboardInner onLogout={onLogout} />
    </EmployeeProfileProvider>
  );
}