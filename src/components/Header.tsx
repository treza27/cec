import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, Package, Phone, Mail } from 'lucide-react';

interface HeaderProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export default function Header({ currentPage = 'home', onNavigate }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
<<<<<<< HEAD
  const { t } = useTranslation();
=======
  const { t, i18n } = useTranslation();
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec

  const menuItems = [
    { id: 'home', label: t('navigation.home'), href: '#' },
    { id: 'about', label: 'À propos', href: '#about' },
    { id: 'services', label: 'Services', href: '#services' },
    { id: 'tracking', label: t('navigation.tracking'), href: '#tracking' },
    { id: 'faq', label: t('navigation.faq'), href: '#faq' },
    { id: 'contact', label: t('navigation.contact'), href: '#contact' },
  ];

<<<<<<< HEAD
=======
  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img
              src="/Logo.jpg"
              alt="Continental Express Cargo"
             className="h-20 w-auto object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Continental Express Cargo</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  currentPage === item.id
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

<<<<<<< HEAD
=======
          {/* Language Toggle */}
          <div className="hidden lg:flex items-center">
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors duration-200"
              aria-label={t('common.changeLanguage')}
            >
              {i18n.language.toUpperCase()}
            </button>
          </div>

>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate?.(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`text-left text-sm font-medium transition-colors duration-200 ${
                    currentPage === item.id
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
<<<<<<< HEAD
=======
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <button
                  onClick={toggleLanguage}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors duration-200"
                  aria-label={t('common.changeLanguage')}
                >
                  Langue: {i18n.language.toUpperCase()}
                </button>
              </div>
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}