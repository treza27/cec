import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import des ressources de traduction
import fr from './locales/fr.json';
import en from './locales/en.json';

const resources = {
  fr: {
    translation: fr
  },
  en: {
    translation: en
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // langue par défaut
    fallbackLng: 'fr',
    
    interpolation: {
      escapeValue: false // React échappe déjà les valeurs
    },
    
    // Configuration pour le développement
    debug: process.env.NODE_ENV === 'development',
    
    // Namespace par défaut
    defaultNS: 'translation',
    
    // Détection automatique de la langue (optionnel)
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;