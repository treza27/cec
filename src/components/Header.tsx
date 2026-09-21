import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Package, ChevronDown, BookOpen } from 'lucide-react';

const PAGE_TO_PATH: Record<string, string> = {
  home: '/',
  tracking: '/tracking',
  contact: '/contact',
  faq: '/faq',
  legal: '/mentions-legales',
  about: '/a-propos',
  services: '/services',
  lcl: '/services/lcl',
  fcl: '/services/fcl',
  conseil: '/services/conseil',
  guide: '/guide',
  tarification: '/tarification',
  actualites: '/actualites',
  catalogue: '/catalogue',
  upload: '/upload',
};

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nav = (page: string) => {
    const path = PAGE_TO_PATH[page] ?? `/${page}`;
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setOpenDropdown(null);
    setIsMenuOpen(false);
    setMobileExpanded(null);
  };

  const toggleDropdown = (key: string) => {
    setOpenDropdown(prev => (prev === key ? null : key));
  };

  const path = location.pathname;
  const isHome = path === '/';
  const isServiceActive = path.startsWith('/services');
  const isInfoActive = ['/faq', '/guide', '/tarification', '/actualites', '/a-propos', '/contact'].some(p => path.startsWith(p));
  const isCatalogue = path.startsWith('/catalogue');
  const isTracking = path.startsWith('/tracking');

  const serviceItems = [
    { id: 'lcl', label: 'LCL – Groupage' },
    { id: 'fcl', label: 'FCL – Transit complet' },
    { id: 'conseil', label: 'Conseil & Stratégie' },
  ];

  const infoItems = [
    { id: 'guide', label: "Guide de l'importateur" },
    { id: 'tarification', label: 'Tarifs & Devis' },
    { id: 'faq', label: 'FAQ' },
    { id: 'actualites', label: 'Actualités' },
    { id: 'about', label: 'À propos' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header ref={headerRef} className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <button onClick={() => nav('home')} className="flex items-center space-x-3">
            <img src="/Logo.jpg" alt="Continental Express Cargo" className="h-20 w-auto object-contain" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-blue-900 leading-tight">Continental Express Cargo</h1>
            </div>
          </button>

          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => nav('home')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isHome ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Accueil
            </button>

            <div className="relative">
              <button
                onClick={() => toggleDropdown('services')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isServiceActive || openDropdown === 'services'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <span>Nos Services</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'services' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'services' && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  {serviceItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => nav(item.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${
                        path === PAGE_TO_PATH[item.id]
                          ? 'text-blue-600 bg-blue-50 font-semibold'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => toggleDropdown('info')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isInfoActive || openDropdown === 'info'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <span>Informations</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'info' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'info' && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  {infoItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => nav(item.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${
                        path === PAGE_TO_PATH[item.id]
                          ? 'text-blue-600 bg-blue-50 font-semibold'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => nav('catalogue')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all duration-200 ${
                isCatalogue
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Catalogue</span>
            </button>

            <button
              onClick={() => nav('tracking')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all duration-200 ${
                isTracking
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Suivi Colis</span>
            </button>
          </nav>

          <button
            className="lg:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-1">
              <button
                onClick={() => nav('home')}
                className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isHome ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Accueil
              </button>

              <div>
                <button
                  onClick={() => setMobileExpanded(prev => prev === 'services' ? null : 'services')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isServiceActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <span>Nos Services</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileExpanded === 'services' ? 'rotate-180' : ''}`} />
                </button>
                {mobileExpanded === 'services' && (
                  <div className="ml-4 mt-1 space-y-1">
                    {serviceItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => nav(item.id)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors duration-150 ${
                          path === PAGE_TO_PATH[item.id] ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => setMobileExpanded(prev => prev === 'info' ? null : 'info')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isInfoActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <span>Informations</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileExpanded === 'info' ? 'rotate-180' : ''}`} />
                </button>
                {mobileExpanded === 'info' && (
                  <div className="ml-4 mt-1 space-y-1">
                    {infoItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => nav(item.id)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors duration-150 ${
                          path === PAGE_TO_PATH[item.id] ? 'text-blue-600 bg-blue-50 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => nav('catalogue')}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors duration-200 border-2 ${
                    isCatalogue
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Catalogue</span>
                </button>
                <button
                  onClick={() => nav('tracking')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200"
                >
                  <Package className="w-4 h-4" />
                  <span>Suivi Colis</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
