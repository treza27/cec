import React, { memo } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, ArrowRight, Users, Shield, Award } from 'lucide-react';

interface HomepageContactSectionProps {
  onNavigate: (page: string) => void;
}

const HomepageContactSection = memo(function HomepageContactSection({ onNavigate }: HomepageContactSectionProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contenu principal */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold leading-relaxed">
                <span className="bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
                  Contactez nos experts
                </span>
                <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  en transport maritime
                </span>
              </h2>
              <p className="text-xl text-gray-200 leading-loose">
                Notre équipe expérimentée vous accompagne dans tous vos projets d'expédition depuis la Chine vers Madagascar
              </p>
            </div>

            {/* Informations de contact principales */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">WhatsApp</p>
                  <a 
                    href="https://wa.me/261340725292"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-white hover:text-green-300 transition-colors duration-200 leading-relaxed"
                  >
                    +261 34 07 252 92
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Email</p>
                  <a 
                    href="mailto:cec.sales52@gmail.com"
                    className="text-lg font-semibold text-white hover:text-blue-300 transition-colors duration-200 leading-relaxed"
                  >
                    cec.sales52@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Adresse</p>
                  <p className="text-lg font-semibold text-white leading-relaxed">
                    Lot IVW 4 Bis, Anosizato Est<br />
                    Antananarivo, Madagascar
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 group">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Horaires</p>
                  <p className="text-lg font-semibold text-white leading-relaxed">
                    Lundi - Vendredi : 8h30 - 17h00
                  </p>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="https://wa.me/261340725292"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-2xl hover:shadow-green-500/25 transform hover:-translate-y-2 hover:scale-105 border border-white/20 backdrop-blur-sm"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Contactez-nous sur WhatsApp</span>
              </a>
              <button
                onClick={() => onNavigate('contact')}
                className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm hover:scale-105 transform flex items-center justify-center space-x-2"
              >
                <span>Toutes nos coordonnées</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Section garanties */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-8 text-center lg:text-left">
              Vos garanties avec Continental Express Cargo
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">Assurance tous risques</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">Vos marchandises sont protégées contre tous les risques de transport</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">18 ans d'expérience</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">Expertise reconnue en transport maritime international</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">Service personnalisé</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">Accompagnement sur mesure pour chaque expédition</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact rapide */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
              <h4 className="text-lg font-bold text-white mb-4 leading-relaxed">Besoin d'aide immédiate ?</h4>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://wa.me/261340725292"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:scale-105 transform"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="mailto:cec.sales52@gmail.com"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:scale-105 transform"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default HomepageContactSection;