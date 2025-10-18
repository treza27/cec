import React, { memo } from 'react';
import { HelpCircle, ArrowRight, MessageCircle, Mail } from 'lucide-react';
import { faqData } from '../data/staticFaqData';

interface HomepageFaqPreviewProps {
  onNavigate: (page: string) => void;
}

const HomepageFaqPreview = memo(function HomepageFaqPreview({ onNavigate }: HomepageFaqPreviewProps) {
  // Sélectionner les 4 questions les plus importantes pour l'aperçu
  const featuredQuestions = faqData.slice(0, 4);

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-200/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Questions Fréquentes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Trouvez rapidement les réponses aux questions les plus courantes sur notre service de transport maritime
          </p>
        </div>

        {/* Questions en aperçu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {featuredQuestions.map((item, index) => (
            <div
              key={item.id}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <HelpCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors duration-300 leading-relaxed">
                    {item.question}
                  </h3>
                  <p className="text-gray-600 leading-loose line-clamp-3">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call-to-action vers la FAQ complète */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4 leading-relaxed">
                Vous avez d'autres questions ?
              </h3>
              <p className="text-blue-100 mb-8 text-lg leading-loose max-w-2xl mx-auto">
                Consultez notre FAQ complète ou contactez-nous directement pour obtenir des réponses personnalisées
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => onNavigate('faq')}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 border border-white/30 hover:scale-105 transform shadow-lg group"
                >
                  <HelpCircle className="w-5 h-5 group-hover:animate-pulse" />
                  <span>Voir toutes les FAQ</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
                <a
                  href="https://wa.me/261340725292"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:scale-105 transform group"
                >
                  <MessageCircle className="w-5 h-5 group-hover:animate-pulse" />
                  <span>Contactez-nous</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default HomepageFaqPreview;