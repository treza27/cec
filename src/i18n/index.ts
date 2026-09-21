import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import des ressources de traduction
import fr from './locales/fr.json';

const resources = {
  fr: {
    translation: fr
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // langue fixée en français
    fallbackLng: 'fr',

    interpolation: {
      escapeValue: false // React échappe déjà les valeurs
    },

    // Configuration pour le développement
    debug: process.env.NODE_ENV === 'development',

    // Namespace par défaut
    defaultNS: 'translation'
  });

export default i18n;