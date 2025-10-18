import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import des ressources de traduction
import fr from './locales/fr.json';
<<<<<<< HEAD
=======
import en from './locales/en.json';
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec

const resources = {
  fr: {
    translation: fr
<<<<<<< HEAD
=======
  },
  en: {
    translation: en
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
<<<<<<< HEAD
    lng: 'fr', // langue fixée en français
    fallbackLng: 'fr',

    interpolation: {
      escapeValue: false // React échappe déjà les valeurs
    },

    // Configuration pour le développement
    debug: process.env.NODE_ENV === 'development',

    // Namespace par défaut
    defaultNS: 'translation'
=======
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
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
  });

export default i18n;