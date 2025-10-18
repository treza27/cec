import React, { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './utils/supabase';
import Header from './components/Header';
import Hero from './components/Hero';
import WhyChooseUs from './components/WhyChooseUs';
import AgentLogin from './components/AgentLogin';
import Footer from './components/Footer';
import HomepageFaqPreview from './components/HomepageFaqPreview';
import HomepageContactSection from './components/HomepageContactSection';
import LoadingSpinner from './components/LoadingSpinner';
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
  LazyServicesPage
} from './components/LazyComponents';
import { Package, InventoryItem } from './types';
import { departureService } from './services/departureService';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';

type Page = 'home' | 'tracking' | 'tracking-overview' | 'tracking-detail' | 'departure-details' | 'no-departure-details' | 'no-packages-found' | 'contact' | 'faq' | 'legal' | 'about' | 'services' | 'agent-login' | 'password-reset';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [trackingPackages, setTrackingPackages] = useState<InventoryItem[] | null>(null);
  const [trackingResult, setTrackingResult] = useState<Package | null>(null);
  const [selectedDepartItem, setSelectedDepartItem] = useState<any | null>(null);
  const [noDepartPackages, setNoDepartPackages] = useState<InventoryItem[] | null>(null);
  const [searchedPseudoForNoPackages, setSearchedPseudoForNoPackages] = useState<string | null>(null);
  const [isAgentLoggedIn, setIsAgentLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const queryClient = useQueryClient();

  // Vérification de session et gestion de l'authentification
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        console.log('🔐 Vérification de la session au montage...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Erreur lors de la vérification de session:', error);
          setIsCheckingSession(false);
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ Session trouvée:', session.user.email);
          setCurrentUser(session.user);
          setIsAgentLoggedIn(true);
        } else {
          console.log('ℹ️ Aucune session active');
        }
      } catch (error) {
        console.error('❌ Erreur inattendue lors de la vérification:', error);
      } finally {
        if (mounted) {
          setIsCheckingSession(false);
        }
      }
    };

    // Vérifier les paramètres URL pour la réinitialisation
    const urlParams = new URLSearchParams(window.location.search);
    const resetParam = urlParams.get('reset');
    const accessToken = urlParams.get('access_token');
    const type = urlParams.get('type');

    // Si nous avons un token d'accès et type=recovery, ou le paramètre reset=true
    if ((type === 'recovery' && accessToken) || resetParam === 'true') {
      setCurrentPage('password-reset');
      setIsCheckingSession(false);
    } else {
      checkSession();
    }

    // Écouter les changements d'authentification de Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Événement d\'authentification:', event);

      if (event === 'PASSWORD_RECOVERY') {
        setCurrentPage('password-reset');
      } else if (event === 'SIGNED_IN' && session) {
        console.log('✅ Utilisateur connecté:', session.user.email);
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('type') === 'recovery') {
          setCurrentPage('password-reset');
        } else {
          if (mounted) {
            setCurrentUser(session.user);
            setIsAgentLoggedIn(true);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 Utilisateur déconnecté');
        if (mounted) {
          // Vider le cache React Query
          queryClient.clear();
          console.log('🗑️ Cache React Query vidé');

          // Réinitialiser l'état local
          setIsAgentLoggedIn(false);
          setCurrentUser(null);

          // Rechargement complet de la page pour garantir un état propre
          console.log('🔄 Rechargement de la page...');
          window.location.href = '/';
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token rafraîchi');
        if (session?.user && mounted) {
          setCurrentUser(session.user);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const handleNavigation = (page: string) => {
    setCurrentPage(page as Page);
    setTrackingResult(null);
  };

  const handleTrackingResult = (packageData: Package | null) => {
    setTrackingResult(packageData);
  };

  const handleTrackingPackages = (packages: InventoryItem[] | null, pseudo?: string) => {
    setTrackingPackages(packages);
    if (packages && packages.length > 0) {
      setCurrentPage('tracking-overview');
    } else if (pseudo) {
      // Aucun colis trouvé mais nous avons un pseudo valide
      setSearchedPseudoForNoPackages(pseudo);
      setCurrentPage('no-packages-found');
    }
  };

  const handleSelectDeparture = async (departId: number) => {
    try {
      // Récupérer le départ directement depuis la base de données
      const selectedDepart = await departureService.getById(departId);
      
      if (!selectedDepart) {
        toast.error(`Départ #${departId} non trouvé`);
        return;
      }

      // Stocker les détails du départ sélectionné
      setSelectedDepartItem(selectedDepart);
      setCurrentPage('departure-details');
    } catch (error) {
      console.error('Erreur lors de la récupération du départ:', error);
      toast.error('Erreur lors de la récupération des détails du départ');
    }
  };

  const handleSelectNoDepartureGroup = (packages: InventoryItem[]) => {
    setNoDepartPackages(packages);
    setCurrentPage('no-departure-details');
  };

  const handleBackToTracking = () => {
    setTrackingResult(null);
    setTrackingPackages(null);
    setSelectedDepartItem(null);
    setNoDepartPackages(null);
    setSearchedPseudoForNoPackages(null);
    setCurrentPage('tracking');
  };

  const handleBackToOverview = () => {
    setTrackingResult(null);
    setSelectedDepartItem(null);
    setNoDepartPackages(null);
    setCurrentPage('tracking-overview');
  };

  const handleAgentLogin = (user: any) => {
    setIsAgentLoggedIn(true);
    setCurrentUser(user);
    setCurrentPage('home'); // Will show dashboard since isAgentLoggedIn is true
  };

  const handleAgentLogout = async () => {
    try {
      console.log('🚪 Déconnexion en cours...');

      // Vider le cache React Query avant de déconnecter
      queryClient.clear();
      console.log('🗑️ Cache React Query vidé');

      // Déconnecter l'utilisateur
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Erreur lors de la déconnexion:', error);
        toast.error('Erreur lors de la déconnexion');
        return;
      }

      console.log('✅ Déconnexion réussie');
      // Le listener onAuthStateChange gérera le rechargement de la page
    } catch (error) {
      console.error('❌ Erreur inattendue lors de la déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const handlePasswordResetSuccess = () => {
    setCurrentPage('agent-login');
  };

  const renderContent = () => {
    // Afficher un spinner pendant la vérification de session
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

    // Show agent dashboard if logged in
    if (isAgentLoggedIn) {
      return (
        <Suspense fallback={<LoadingSpinner size="lg" text="Chargement du tableau de bord..." />}>
          <LazyAgentDashboard onLogout={handleAgentLogout} />
        </Suspense>
      );
    }

    if (currentPage === 'agent-login') {
      return <AgentLogin onBack={() => setCurrentPage('home')} onLogin={handleAgentLogin} />;
    }

    if (currentPage === 'password-reset') {
      return (
        <Suspense fallback={<LoadingSpinner size="lg" text="Chargement..." />}>
          <LazyPasswordReset onBack={() => setCurrentPage('agent-login')} onSuccess={handlePasswordResetSuccess} />
        </Suspense>
      );
    }

    if (currentPage === 'tracking') {
      return (
        <Suspense fallback={<LoadingSpinner size="lg" text="Chargement du formulaire de suivi..." />}>
          <LazyTrackingForm onTrackingResult={handleTrackingPackages} />
        </Suspense>
      );
    }

    if (currentPage === 'tracking-overview') {
      if (trackingPackages && trackingPackages.length > 0) {
        return (
          <Suspense fallback={<LoadingSpinner size="lg" text="Chargement de la vue d'ensemble..." />}>
            <LazyTrackingOverview 
              packages={trackingPackages} 
              onSelectDeparture={handleSelectDeparture}
              onSelectNoDepartureGroup={handleSelectNoDepartureGroup}
              onBack={handleBackToTracking}
            />
          </Suspense>
        );
      }
      return (
        <Suspense fallback={<LoadingSpinner size="lg" text="Chargement..." />}>
          <LazyTrackingForm onTrackingResult={handleTrackingPackages} />
        </Suspense>
      );
    }

    if (currentPage === 'tracking-detail') {
      if (trackingResult) {
        return (
          <Suspense fallback={<LoadingSpinner size="lg" text="Chargement des détails..." />}>
            <LazyTrackingResult packageData={trackingResult} onBack={handleBackToOverview} />
          </Suspense>
        );
      }
      return (
        <Suspense fallback={<LoadingSpinner size="lg" text="Chargement..." />}>
          <LazyTrackingForm onTrackingResult={handleTrackingPackages} />
        </Suspense>
      );
    }

    if (currentPage === 'departure-details') {
      if (selectedDepartItem) {
        return (
          <Suspense fallback={<LoadingSpinner size="lg" text="Chargement des détails du départ..." />}>
            <LazyDepartureDetailsView depart={selectedDepartItem} onBack={handleBackToOverview} />
          </Suspense>
        );
      }
      return (
        <Suspense fallback={<LoadingSpinner size="lg" text="Chargement..." />}>
          <LazyTrackingForm onTrackingResult={handleTrackingPackages} />
        </Suspense>
      );
    }

    if (currentPage === 'no-departure-details') {
      if (noDepartPackages) {
        return (
          <Suspense fallback={<LoadingSpinner size="lg" text="Chargement des détails..." />}>
            <LazyNoDepartureDetailsView packages={noDepartPackages} onBack={handleBackToOverview} />
          </Suspense>
        );
      }
      return (
        <Suspense fallback={<LoadingSpinner size="lg" text="Chargement..." />}>
          <LazyTrackingForm onTrackingResult={handleTrackingPackages} />
        </Suspense>
      );
    }

    if (currentPage === 'no-packages-found') {
      if (searchedPseudoForNoPackages) {
        return (
          <Suspense fallback={<LoadingSpinner size="lg" text="Chargement..." />}>
            <LazyNoPackagesFoundView pseudo={searchedPseudoForNoPackages} onBack={handleBackToTracking} />
          </Suspense>
        );
      }
      return (
        <Suspense fallback={<LoadingSpinner size="lg" text="Chargement..." />}>
          <LazyTrackingForm onTrackingResult={handleTrackingPackages} />
        </Suspense>
      );
    }

    if (currentPage === 'faq') {
      return (
        <Suspense fallback={<LoadingSpinner size="lg" text="Chargement de la FAQ..." />}>
          <LazyFAQPage />
        </Suspense>
      );
    }

    if (currentPage === 'legal') {
      return (
        <Suspense fallback={<LoadingSpinner size="lg" text="Chargement des mentions légales..." />}>
          <LazyLegalPage />
        </Suspense>
      );
    }

    if (currentPage === 'about') {
      return (
        <Suspense fallback={<LoadingSpinner size="lg" text="Chargement..." />}>
          <LazyAboutPage />
        </Suspense>
      );
    }

    if (currentPage === 'services') {
      return (
        <Suspense fallback={<LoadingSpinner size="lg" text="Chargement..." />}>
          <LazyServicesPage />
        </Suspense>
      );
    }

    if (currentPage === 'contact') {
      return (
        <section className="py-20 bg-gray-50 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Contactez-nous
              </h1>
              <p className="text-xl text-gray-600">
                Notre équipe est à votre disposition pour répondre à toutes vos questions
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
              <div className="max-w-3xl mx-auto">
                {/* Message d'introduction */}
                <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Phone className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Nous sommes là pour vous aider
                  </h2>
                  <p className="text-lg text-gray-600">
                    Contactez-nous directement par téléphone ou par email pour toutes vos questions concernant vos envois
                  </p>
                </div>

                {/* Options de contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  {/* Contact WhatsApp */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 hover:shadow-lg transition-all duration-300">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">WhatsApp</h3>
                      <p className="text-gray-600 mb-6">
                        Contactez-nous directement sur WhatsApp pour une réponse rapide
                      </p>
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

                  {/* Contact Email */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-200 hover:shadow-lg transition-all duration-300">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Email</h3>
                      <p className="text-gray-600 mb-6">
                        Envoyez-nous un email pour vos demandes détaillées
                      </p>
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

                {/* Informations complémentaires */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Adresse */}
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

                    {/* Horaires */}
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
      );
    }

    // Home page
    return (
      <>
        <Hero onTrackingClick={() => setCurrentPage('tracking')} />
        <WhyChooseUs />
        <HomepageFaqPreview onNavigate={handleNavigation} />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {currentPage !== 'agent-login' && currentPage !== 'password-reset' && !isAgentLoggedIn && (
        <Header currentPage={currentPage} onNavigate={handleNavigation} />
      )}
      {renderContent()}
      {currentPage !== 'agent-login' && currentPage !== 'password-reset' && !isAgentLoggedIn && (
        <Footer 
          onAgentSpaceClick={() => setCurrentPage('agent-login')} 
          onNavigate={handleNavigation}
        />
      )}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

// Fonction utilitaire pour générer les étapes de suivi du départ
const generateDepartureTrackingSteps = (depart: any) => {
  // Déterminer le statut de chaque étape basé sur le statut du départ
  const getStepStatus = (requiredStatus: string[]) => {
    if (requiredStatus.includes(depart.statut)) {
      return 'current' as const;
    }
    
    const statusOrder = [
      'preparation_depart',
      'conteneur_charge', 
      'depart_chine',
      'arrivee_toamasina',
      'dedouanement_en_cours',
      'arrivee_antananarivo',
      'decharge_trie'
    ];
    
    const currentIndex = statusOrder.indexOf(depart.statut);
    const stepIndex = Math.max(...requiredStatus.map(s => statusOrder.indexOf(s)));
    
    if (currentIndex > stepIndex) {
      return 'completed' as const;
    }
    
    return 'pending' as const;
  };
  
  const steps = [
    {
      id: '1',
      title: 'Chargement sur navire',
      description: depart.numTC ? `Conteneur ${depart.numTC} chargé sur le navire` : 'Marchandises chargées sur le navire',
      date: depart.dateChargement || new Date().toISOString().split('T')[0],
      status: getStepStatus(['conteneur_charge', 'depart_chine', 'arrivee_toamasina', 'dedouanement_en_cours', 'arrivee_antananarivo', 'decharge_trie']),
      location: 'Port de Chine',
      image: 'https://images.pexels.com/photos/906494/pexels-photo-906494.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: '2',
      title: 'En transit maritime',
      description: depart.numTC ? `Conteneur ${depart.numTC} en route vers Madagascar` : 'Navire en route vers Madagascar',
      date: depart.dateDepartChine || depart.dateChargement || new Date().toISOString().split('T')[0],
      status: getStepStatus(['depart_chine', 'arrivee_toamasina', 'dedouanement_en_cours', 'arrivee_antananarivo', 'decharge_trie']),
      location: 'Océan Indien',
      image: 'https://images.pexels.com/photos/1117210/pexels-photo-1117210.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: '3',
      title: 'Arrivée à Madagascar', 
      description: 'Déchargement au port de Toamasina',
      date: depart.dateArriveTamatave || depart.dateDepartChine || new Date().toISOString().split('T')[0],
      status: getStepStatus(['arrivee_toamasina', 'dedouanement_en_cours', 'arrivee_antananarivo', 'decharge_trie']),
      location: 'Port de Toamasina',
      image: 'https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      id: '4',
      title: 'Déchargement à Tana',
      description: 'Marchandises déchargées et triées à Antananarivo',
      date: depart.dateArriveTana || depart.dateArriveTamatave || new Date().toISOString().split('T')[0],
      status: getStepStatus(['arrivee_antananarivo', 'decharge_trie']),
      location: 'Antananarivo',
      image: 'https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
  ];
  
  return steps;
};

export default App;