import { lazy } from 'react';

// Lazy loading des composants lourds pour améliorer les performances
export const LazyTrackingForm = lazy(() => import('./TrackingForm'));
export const LazyTrackingResult = lazy(() => import('./TrackingResult'));
export const LazyTrackingOverview = lazy(() => import('./TrackingOverview'));
export const LazyAgentDashboard = lazy(() => import('./AgentDashboard'));
export const LazyPasswordReset = lazy(() => import('./PasswordReset'));
export const LazyDepartureDetailsView = lazy(() => import('./DepartureDetailsView'));
export const LazyNoDepartureDetailsView = lazy(() => import('./NoDepartureDetailsView'));
export const LazyNoPackagesFoundView = lazy(() => import('./NoPackagesFoundView'));
export const LazyFAQPage = lazy(() => import('./FAQPage'));
export const LazyLegalPage = lazy(() => import('./LegalPage'));
export const LazyAboutPage = lazy(() => import('./AboutPage'));
export const LazyServicesPage = lazy(() => import('./ServicesPage'));
export const LazyLclPage = lazy(() => import('./LclPage'));
export const LazyFclPage = lazy(() => import('./FclPage'));
export const LazyConseilPage = lazy(() => import('./ConseilPage'));
export const LazyActualitesPage = lazy(() => import('./ActualitesPage'));
export const LazyArticleDetailPage = lazy(() => import('./ArticleDetailPage'));
export const LazyGuidePage = lazy(() => import('./GuidePage'));
export const LazyTarificationPage = lazy(() => import('./TarificationPage'));
export const LazyUploadPage = lazy(() => import('./UploadPage'));
export const LazyCataloguePage = lazy(() => import('./CataloguePage'));