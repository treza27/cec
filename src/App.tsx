import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './utils/supabase';
import Header from './components/Header';
import Hero from './components/Hero';
import WhyChooseUs from './components/WhyChooseUs';
import TargetAudienceSection from './components/TargetAudienceSection';
import AgentLogin from './components/AgentLogin';
import Footer from './components/Footer';
import HomepageFaqPreview from './components/HomepageFaqPreview';
import HomepageCatalogueStrip from './components/HomepageCatalogueStrip';
import LoadingSpinner from './components/LoadingSpinner';
import SEO from './components/SEO';
import {
  LazyTrackingForm,
  LazyTrackingResult,
  LazyTrackingOverview,
  LazyAgentDashboard,
  LazyPasswordReset,
  LazyDepartureDetailsView,
  LazyNoDepartureDetailsView,
  LazyNoPackagesFoundView,
  LazyFAQPage,
  LazyLegalPage,
  LazyAboutPage,
  LazyServicesPage,
  LazyLclPage,
  LazyFclPage,
  LazyConseilPage,
  LazyActualitesPage,
  LazyArticleDetailPage,
  LazyGuidePage,
  LazyTarificationPage,
  LazyUploadPage,
  LazyCataloguePage
} from './components/LazyComponents';
import { Package, InventoryItem } from './types';
import { departureService } from './services/departureService';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';

// ─── Tracking sub-pages (state-driven, nested under /tracking) ───────────────

function TrackingSection() {
  const [trackingPackages, setTrackingPackages] = useState<InventoryItem[] | null>(null);
  const [trackingPseudo, setTrackingPseudo] = useState<string | null>(null);
  const [trackingResult, setTrackingResult] = useState<Package | null>(null);
  const [selectedDepartItem, setSelectedDepartItem] = useState<any | null>(null);
  const [noDepartPackages, setNoDepartPackages] = useState<InventoryItem[] | null>(null);
  const [searchedPseudoForNoPackages, setSearchedPseudoForNoPackages] = useState<string | null>(null);
  const [view, setView] = useState<'form' | 'overview' | 'detail' | 'departure' | 'no-departure' | 'no-packages'>('form');

  const handleTrackingPackages = (packages: InventoryItem[] | null, pseudo?: string) => {
    setTrackingPackages(packages);
    if (pseudo) setTrackingPseudo(pseudo);
    if (packages && packages.length > 0) {
      setView('overview');
    } else if (pseudo) {
      setSearchedPseudoForNoPackages(pseudo);
      setView('no-packages');
    }
  };

  const handleSelectDeparture = async (departId: number) => {
    try {
      const selectedDepart = await departureService.getById(departId);
      if (!selectedDepart) {
        toast.error(`Départ #${departId} non trouvé`);
        return;
      }
      setSelectedDepartItem(selectedDepart);
      setView('departure');
    } catch {
      toast.error('Erreur lors de la récupération des détails du départ');
    }
  };

  const handleSelectNoDepartureGroup = (packages: InventoryItem[]) => {
    setNoDepartPackages(packages);
    setView('no-departure');
  };

  const backToForm = () => {
    setTrackingResult(null);
    setTrackingPackages(null);
    setSelectedDepartItem(null);
    setNoDepartPackages(null);
    setSearchedPseudoForNoPackages(null);
    setView('form');
  };

  const backToOverview = () => {
    setTrackingResult(null);
    setSelectedDepartItem(null);
    setNoDepartPackages(null);
    setView('overview');
  };

  if (view === 'overview' && trackingPackages && trackingPackages.length > 0) {
    return (
      <Suspense fallback={<LoadingSpinner size="lg" text="Chargement de la vue d'ensemble..." />}>
        <LazyTrackingOverview
          packages={trackingPackages}
          pseudo={trackingPseudo}
          onSelectDeparture={handleSelectDeparture}
          onSelectNoDepartureGroup={handleSelectNoDepartureGroup}
          onBack={backToForm}
        />
      </Suspense>
    );
  }

  if (view === 'departure' && selectedDepartItem) {
    return (
      <Suspense fallback={<LoadingSpinner size="lg" text="Chargement des détails du départ..." />}>
        <LazyDepartureDetailsView depart={selectedDepartItem} onBack={backToOverview} />
      </Suspense>
    );
  }

  if (view === 'no-departure' && noDepartPackages) {
    return (
      <Suspense fallback={<LoadingSpinner size="lg" text="Chargement des détails..." />}>
        <LazyNoDepartureDetailsView packages={noDepartPackages} onBack={backToOverview} />
      </Suspense>
    );
  }

  if (view === 'no-packages' && searchedPseudoForNoPackages) {
    return (
      <Suspense fallback={<LoadingSpinner size="lg" text="Chargement..." />}>
        <LazyNoPackagesFoundView pseudo={searchedPseudoForNoPackages} onBack={backToForm} />
      </Suspense>
    );
  }

  return (
    <>
      <SEO
        title="Suivi de colis — Tracking en temps réel Chine-Madagascar"
        description="Suivez vos colis en temps réel avec Continental Express Cargo. Entrez votre identifiant client pour connaître l'état de votre commande et sa position."
        canonical="/tracking"
      />
      <Suspense fallback={<LoadingSpinner size="lg" text="Chargement du formulaire de suivi..." />}>
        <LazyTrackingForm onTrackingResult={handleTrackingPackages} />
      </Suspense>
    </>
  );
}

// ─── Contact page ─────────────────────────────────────────────────────────────

function ContactPage() {
  return (
    <>
      <SEO
        title="Contactez-nous — Continental Express Cargo Madagascar"
        description="Contactez Continental Express Cargo par WhatsApp, email ou téléphone. Notre équipe est disponible 24h/7j pour répondre à vos questions sur le transport maritime Chine-Madagascar."
        canonical="/contact"
      />
      <section className="py-20 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Contactez-nous</h1>
            <p className="text-xl text-gray-600">Notre équipe est à votre disposition pour répondre à toutes vos questions</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Phone className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Nous sommes là pour vous aider</h2>
                <p className="text-lg text-gray-600">Contactez-nous directement par téléphone ou par email pour toutes vos questions concernant vos envois</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 hover:shadow-lg transition-all duration-300">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">WhatsApp</h3>
                    <p className="text-gray-600 mb-6">Contactez-nous directement sur WhatsApp pour une réponse rapide</p>
                    <a
                      href="https://wa.me/261340725292"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-3 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>+261 34 07 252 92</span>
                    </a>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-200 hover:shadow-lg transition-all duration-300">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Email</h3>
                    <p className="text-gray-600 mb-6">Envoyez-nous un email pour vos demandes détaillées</p>
                    <a
                      href="mailto:cec.sales52@gmail.com"
                      className="inline-flex items-center space-x-3 bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      <Mail className="w-5 h-5" />
                      <span>cec.sales52@gmail.com</span>
                    </a>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Notre adresse</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Lot IVW 4 Bis, Anosizato Est<br />
                      Antananarivo, Madagascar
                    </p>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Nos horaires</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Lundi - Vendredi<br />
                      8h30 - 17h00
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Homepage ─────────────────────────────────────────────────────────────────

function HomePage() {
  const navigate = useNavigate();
  return (
    <>
      <SEO
        title="Continental Express Cargo — Transport maritime Chine-Madagascar"
        description="Spécialiste du transport maritime entre la Chine et Madagascar. Fret groupage LCL, conteneur complet FCL, dédouanement et livraison dans toutes les provinces malgaches."
        canonical="/"
        ogImage="/Chargement_Chine_CEC.jpg"
      />
      <Hero onTrackingClick={() => navigate('/tracking')} />
      <HomepageCatalogueStrip onNavigate={(page) => navigate(`/${page}`)} />
      <TargetAudienceSection />
      <WhyChooseUs />
      <HomepageFaqPreview onNavigate={(page) => navigate(`/${page}`)} />
    </>
  );
}

// ─── Layout wrapper (Header + Footer) ────────────────────────────────────────

function PublicLayout({ isAgentLoggedIn, onAgentSpaceClick }: { isAgentLoggedIn: boolean; onAgentSpaceClick: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const pageFromPath = location.pathname.replace(/^\//, '') || 'home';

  const handleNavigate = (page: string) => {
    const path = page === 'home' ? '/' : `/${page}`;
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isAgentLoggedIn) return null;

  return (
    <>
      <Header currentPage={pageFromPath} onNavigate={handleNavigate} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tracking" element={<TrackingSection />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<Suspense fallback={<LoadingSpinner size="lg" />}><LazyFAQPage /></Suspense>} />
        <Route path="/mentions-legales" element={<Suspense fallback={<LoadingSpinner size="lg" />}><LazyLegalPage /></Suspense>} />
        <Route path="/a-propos" element={<Suspense fallback={<LoadingSpinner size="lg" />}><LazyAboutPage /></Suspense>} />
        <Route path="/services" element={<Suspense fallback={<LoadingSpinner size="lg" />}><LazyServicesPage onNavigate={handleNavigate} /></Suspense>} />
        <Route path="/services/lcl" element={<Suspense fallback={<LoadingSpinner size="lg" />}><LazyLclPage onNavigate={handleNavigate} /></Suspense>} />
        <Route path="/services/fcl" element={<Suspense fallback={<LoadingSpinner size="lg" />}><LazyFclPage onNavigate={handleNavigate} /></Suspense>} />
        <Route path="/services/conseil" element={<Suspense fallback={<LoadingSpinner size="lg" />}><LazyConseilPage onNavigate={handleNavigate} /></Suspense>} />
        <Route path="/guide" element={<Suspense fallback={<LoadingSpinner size="lg" />}><LazyGuidePage /></Suspense>} />
        <Route path="/tarification" element={<Suspense fallback={<LoadingSpinner size="lg" />}><LazyTarificationPage /></Suspense>} />
        <Route path="/actualites" element={<Suspense fallback={<LoadingSpinner size="lg" />}><LazyActualitesPage onArticleSelect={(slug) => navigate(`/actualites/${slug}`)} /></Suspense>} />
        <Route path="/actualites/:slug" element={<ArticleDetailRoute />} />
        <Route path="/catalogue" element={<Suspense fallback={<LoadingSpinner size="lg" />}><LazyCataloguePage onNavigate={handleNavigate} /></Suspense>} />
        <Route path="/catalogue/:slug" element={<Suspense fallback={<LoadingSpinner size="lg" />}><LazyCataloguePage onNavigate={handleNavigate} /></Suspense>} />
        <Route path="/upload" element={<Suspense fallback={<LoadingSpinner size="lg" />}><LazyUploadPage onNavigate={handleNavigate} /></Suspense>} />
        {/* Legacy path redirects */}
        <Route path="/legal" element={<Navigate to="/mentions-legales" replace />} />
        <Route path="/about" element={<Navigate to="/a-propos" replace />} />
        <Route path="/lcl" element={<Navigate to="/services/lcl" replace />} />
        <Route path="/fcl" element={<Navigate to="/services/fcl" replace />} />
        <Route path="/conseil" element={<Navigate to="/services/conseil" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer onAgentSpaceClick={onAgentSpaceClick} onNavigate={handleNavigate} />
    </>
  );
}

function ArticleDetailRoute() {
  const navigate = useNavigate();
  const { slug = '' } = useParams<{ slug: string }>();

  return (
    <Suspense fallback={<LoadingSpinner size="lg" text="Chargement de l'article..." />}>
      <LazyArticleDetailPage
        slug={slug}
        onBack={() => navigate('/actualites')}
        onArticleSelect={(s) => navigate(`/actualites/${s}`)}
      />
    </Suspense>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────

function App() {
  const [isAgentLoggedIn, setIsAgentLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) { setIsCheckingSession(false); return; }
        if (session?.user && mounted) {
          setCurrentUser(session.user);
          setIsAgentLoggedIn(true);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setIsCheckingSession(false);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const resetParam = urlParams.get('reset');
    const accessToken = urlParams.get('access_token');
    const type = urlParams.get('type');

    if ((type === 'recovery' && accessToken) || resetParam === 'true') {
      navigate('/reset-password', { replace: true });
      setIsCheckingSession(false);
    } else {
      checkSession();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true });
      } else if (event === 'SIGNED_IN' && session) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('type') === 'recovery') {
          navigate('/reset-password', { replace: true });
        } else if (mounted) {
          setCurrentUser(session.user);
          setIsAgentLoggedIn(true);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          queryClient.clear();
          setIsAgentLoggedIn(false);
          setCurrentUser(null);
          window.location.href = '/';
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user && mounted) {
        setCurrentUser(session.user);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de la session...</p>
        </div>
      </div>
    );
  }

  if (isAgentLoggedIn) {
    return (
      <Suspense fallback={<LoadingSpinner size="lg" text="Chargement du tableau de bord..." />}>
        <LazyAgentDashboard onLogout={async () => {
          try {
            queryClient.clear();
            const { error } = await supabase.auth.signOut();
            if (error) toast.error('Erreur lors de la déconnexion');
          } catch {
            toast.error('Erreur lors de la déconnexion');
          }
        }} />
      </Suspense>
    );
  }

  const isAuthPage = location.pathname === '/agent' || location.pathname === '/reset-password';

  if (location.pathname === '/agent') {
    return <AgentLogin onBack={() => navigate('/')} onLogin={(user) => { setIsAgentLoggedIn(true); setCurrentUser(user); navigate('/'); }} />;
  }

  if (location.pathname === '/reset-password') {
    return (
      <Suspense fallback={<LoadingSpinner size="lg" text="Chargement..." />}>
        <LazyPasswordReset onBack={() => navigate('/agent')} onSuccess={() => navigate('/agent')} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicLayout
        isAgentLoggedIn={isAgentLoggedIn}
        onAgentSpaceClick={() => navigate('/agent')}
      />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
          success: { duration: 3000, iconTheme: { primary: '#4ade80', secondary: '#fff' } },
          error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
}

export default App;
