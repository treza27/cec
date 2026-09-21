import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Phone, Mail, MapPin, Facebook, MessageCircle, Upload } from 'lucide-react';

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

export default function Footer() {
  const navigate = useNavigate();

  const nav = (page: string) => {
    const path = PAGE_TO_PATH[page] ?? `/${page}`;
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div>
                <h3 className="text-lg font-bold text-blue-400">Continental Express Cargo</h3>
                <button
                  onClick={() => navigate('/agent')}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors duration-200 underline"
                >
                  Espace Agent
                </button>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Votre partenaire de confiance pour le transport maritime entre la Chine et Madagascar.
              Sécurité, rapidité et fiabilité assurées.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/profile.php?id=61575558834590"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200"
              >
                <Facebook className="w-5 h-5 text-gray-400 hover:text-white transition-colors duration-200" />
              </a>
              <a
                href="https://wa.me/261340725292"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors duration-200"
              >
                <MessageCircle className="w-5 h-5 text-gray-400 hover:text-white transition-colors duration-200" />
              </a>
            </div>
            <button
              onClick={() => nav('upload')}
              className="inline-flex items-center space-x-2 bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200 border border-gray-700 hover:border-blue-500"
            >
              <Upload className="w-4 h-4" />
              <span>上传照片</span>
            </button>
          </div>

          {/* Expertises */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Nos Expertises</h4>
            <ul className="space-y-3">
              <li><span className="text-gray-300">Transport Maritime</span></li>
              <li><span className="text-gray-300">Groupage de Marchandises</span></li>
              <li><span className="text-gray-300">Suivi en Temps Réel</span></li>
              <li><span className="text-gray-300">Assurance Transport</span></li>
              <li><span className="text-gray-300">Dédouanement</span></li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Liens Utiles</h4>
            <ul className="space-y-3">
              {[
                { id: 'about', label: 'À propos' },
                { id: 'services', label: 'Nos services' },
                { id: 'lcl', label: 'LCL – Groupage' },
                { id: 'fcl', label: 'FCL – Transit complet' },
                { id: 'conseil', label: 'Conseil & Stratégie' },
                { id: 'guide', label: "Guide de l'importateur" },
                { id: 'tarification', label: 'Tarifs & Devis' },
                { id: 'tracking', label: 'Suivre un colis' },
                { id: 'actualites', label: 'Actualités' },
                { id: 'faq', label: 'FAQ' },
                { id: 'contact', label: 'Contact' },
              ].map(({ id, label }) => (
                <li key={id}>
                  <button
                    onClick={() => nav(id)}
                    className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">Immeuble IKANO, 2ème étage, bureau CEC</p>
                  <p className="text-gray-300">Ambodivona, Antananarivo, Madagascar</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-blue-400" />
                <p className="text-gray-300">+261 34 07 252 92</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <p className="text-gray-300">cec.sales52@gmail.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2024 Continental Express Cargo. Tous droits réservés.
            </p>
            <div className="flex space-x-6 text-sm">
              <button
                onClick={() => nav('legal')}
                className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer"
              >
                Mentions Légales & CGV
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
