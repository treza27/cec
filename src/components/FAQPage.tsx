import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown, ChevronUp, HelpCircle, MessageCircle, Mail, Phone } from 'lucide-react';
import { faqData, categories, FaqItem } from '../data/staticFaqData';

export default function FAQPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});

  // Catégories avec leurs libellés (enrichies avec traductions)
  const categoriesWithTranslations = [
    { id: 'all', label: t('faq.allCategories'), icon: HelpCircle },
    { id: 'services', label: 'Services et Tarifs', icon: HelpCircle },
    { id: 'suivi', label: t('faq.categories.suivi'), icon: HelpCircle },
  ];

  // Filtrer les questions selon la recherche et la catégorie
  const filteredFaqItems = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Grouper par catégorie pour l'affichage
  const groupedFaqItems = categoriesWithTranslations.reduce((acc, category) => {
    if (category.id === 'all') return acc;
    
    const categoryItems = filteredFaqItems.filter(item => item.category === category.id);
    if (categoryItems.length > 0) {
      acc[category.id] = {
        label: category.label,
        items: categoryItems
      };
    }
    return acc;
  }, {} as { [key: string]: { label: string; items: FaqItem[] } });

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Fermer tous les accordéons lors du changement de catégorie
    setExpandedItems({});
  };

  return (
<<<<<<< HEAD
    <section className="py-20 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 min-h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-200/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
=======
    <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-200/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
<<<<<<< HEAD
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent mb-4">
=======
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
            {t('faq.title')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('faq.subtitle')}
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/50">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('faq.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Filtres par catégorie */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Catégories</h3>
          <div className="flex flex-wrap gap-3">
            {categoriesWithTranslations.map((category) => {
              const Icon = category.icon;
              const categoryCount = category.id === 'all' 
                ? faqData.length 
                : faqData.filter(item => item.category === category.id).length;
              
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    selectedCategory === category.id
<<<<<<< HEAD
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg transform scale-105'
=======
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
                      : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-md hover:scale-105'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedCategory === category.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {categoryCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Résultats */}
        {filteredFaqItems.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50 text-center">
            <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('faq.noResults')}</h3>
            <p className="text-gray-600 mb-6">{t('faq.noResultsDesc')}</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : selectedCategory === 'all' ? (
          // Affichage groupé par catégorie
          <div className="space-y-8">
            {Object.entries(groupedFaqItems).map(([categoryId, categoryData]) => (
              <div key={categoryId} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
<<<<<<< HEAD
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
=======
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
                  <h3 className="text-lg font-bold text-gray-900">
                    {categoryData.label} ({categoryData.items.length})
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {categoryData.items.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
                          aria-expanded={expandedItems[item.id]}
                          aria-controls={`faq-answer-${item.id}`}
                        >
                          <span className="font-semibold text-gray-900 pr-4">{item.question}</span>
                          {expandedItems[item.id] ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          )}
                        </button>
                        {expandedItems[item.id] && (
                          <div
                            id={`faq-answer-${item.id}`}
                            className="px-6 py-4 bg-white border-t border-gray-200"
                          >
                            <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Affichage pour une catégorie spécifique
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
<<<<<<< HEAD
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
=======
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
              <h3 className="text-lg font-bold text-gray-900">
                {categoriesWithTranslations.find(c => c.id === selectedCategory)?.label} ({filteredFaqItems.length})
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {filteredFaqItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
                      aria-expanded={expandedItems[item.id]}
                      aria-controls={`faq-answer-${item.id}`}
                    >
                      <span className="font-semibold text-gray-900 pr-4">{item.question}</span>
                      {expandedItems[item.id] ? (
                        <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    {expandedItems[item.id] && (
                      <div
                        id={`faq-answer-${item.id}`}
                        className="px-6 py-4 bg-white border-t border-gray-200"
                      >
                        <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Appel à l'action vers le contact */}
<<<<<<< HEAD
        <div className="mt-12 bg-gradient-to-r from-blue-500 via-cyan-600 to-blue-700 rounded-2xl shadow-2xl p-8 text-center text-white relative overflow-hidden">
=======
        <div className="mt-12 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-center text-white relative overflow-hidden">
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
          {/* Décoration de fond */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4">{t('faq.stillNeedHelp')}</h3>
            <p className="text-blue-100 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
              {t('faq.stillNeedHelpDesc')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/261340725292"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 border border-white/30 hover:scale-105 transform shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp</span>
              </a>
              <a
                href="mailto:cec.sales52@gmail.com"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 border border-white/30 hover:scale-105 transform shadow-lg"
              >
                <Mail className="w-5 h-5" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}