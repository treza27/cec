import React from 'react';
import { Ship, Container, Briefcase, Shield, Clock, DollarSign, Globe, Anchor } from 'lucide-react';

export default function ServicesPage() {
  const services = [
    {
      icon: Ship,
      title: 'LCL – Groupage maritime',
      subtitle: 'Cargo partagé',
      description: 'Transportez vos marchandises — petites ou grandes quantités — de la Chine vers Madagascar en toute sécurité.',
      features: [
        'Nous disposons de deux entrepôts stratégiques à Guangzhou et Yiwu',
        'Facilite le regroupement et l\'expédition rapide des commandes',
        'Solution flexible adaptée à tous les volumes',
        'Économique et sécurisée',
        'Transport de la Chine vers Madagascar'
      ],
      highlight: 'Une solution flexible, économique et adaptée à tous les volumes.',
      color: 'blue'
    },
    {
      icon: Container,
      title: 'FCL – Transit maritime complet',
      subtitle: 'Service clé en main',
      description: 'Nous prenons en charge l\'intégralité du transport de vos conteneurs depuis votre fournisseur en Chine jusqu\'à votre entrepôt à Madagascar, quelle que soit la province.',
      features: [
        'Chargement à l\'usine en Chine',
        'Déclaration export et paiement du fret',
        'Procédures douanières à Tamatave',
        'Livraison finale par route vers toutes les provinces',
        'Suivi complet du début à la fin'
      ],
      highlight: 'Un service clé en main, sécurisé et transparent.',
      color: 'green'
    },
    {
      icon: Briefcase,
      title: 'Accompagnement & Conseil en stratégie',
      subtitle: 'Expertise en commerce international',
      description: 'Profitez de notre expertise en commerce international pour réussir vos projets d\'importation.',
      features: [
        'Recherche et sélection de fournisseurs fiables',
        'Négociation des prix et conditions d\'achat',
        'Choix de la compagnie maritime la plus adaptée',
        'Analyse de la saisonnalité du marché',
        'Conseils en stratégie de vente physique et e-commerce'
      ],
      highlight: 'Un accompagnement complet pour optimiser vos achats et développer votre activité.',
      color: 'orange'
    }
  ];

  const advantages = [
    {
      icon: Shield,
      title: 'Sécurité garantie',
      description: 'Transport maritime sécurisé avec suivi complet de vos marchandises de la Chine à Madagascar.'
    },
    {
      icon: Clock,
      title: 'Flexibilité',
      description: 'Solutions LCL et FCL adaptées à tous les volumes, des petites aux grandes quantités.'
    },
    {
      icon: DollarSign,
      title: 'Tarifs transparents',
      description: 'Prix compétitifs et clairs, sans frais cachés. Optimisez vos coûts d\'importation.'
    },
    {
      icon: Globe,
      title: 'Expertise commerciale',
      description: 'Accompagnement stratégique complet : fournisseurs, négociation, logistique et vente.'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { bg: string; text: string; border: string; icon: string } } = {
      blue: { bg: 'from-blue-50 to-cyan-50', text: 'text-blue-600', border: 'border-blue-200', icon: 'bg-blue-500' },
      green: { bg: 'from-green-50 to-emerald-50', text: 'text-green-600', border: 'border-green-200', icon: 'bg-green-500' },
      orange: { bg: 'from-orange-50 to-amber-50', text: 'text-orange-600', border: 'border-orange-200', icon: 'bg-orange-500' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 shadow-lg">
            <Anchor className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            ⚓ Nos Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Solutions maritimes et accompagnement stratégique pour vos importations Chine-Madagascar
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-20">
          {services.map((service, index) => {
            const Icon = service.icon;
            const colors = getColorClasses(service.color);
            return (
              <div
                key={index}
                className={`bg-gradient-to-br ${colors.bg} rounded-2xl shadow-lg p-8 border ${colors.border} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col`}
              >
                <div className="flex items-start space-x-4 mb-6">
                  <div className={`flex-shrink-0 w-14 h-14 ${colors.icon} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold ${colors.text} mb-1`}>
                      {service.title}
                    </h3>
                    <p className="text-sm text-gray-600 font-semibold">
                      {service.subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed mb-6">
                  {service.description}
                </p>

                <div className="space-y-3 flex-grow">
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-gray-700">
                        <span className={`${colors.text} mr-2 font-bold text-lg flex-shrink-0`}>•</span>
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`mt-6 pt-6 border-t ${colors.border}`}>
                  <p className={`text-sm font-semibold ${colors.text} flex items-start`}>
                    <span className="mr-2">👉</span>
                    <span>{service.highlight}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-12 mb-20 shadow-2xl text-white">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Notre Processus FCL Complet
            </h2>
            <p className="text-xl text-blue-100">
              Un service clé en main de l'usine en Chine à votre entrepôt à Madagascar
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <span className="text-3xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Chargement Usine</h3>
              <p className="text-blue-100 text-sm">
                Enlèvement chez votre fournisseur en Chine
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <span className="text-3xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Déclaration Export</h3>
              <p className="text-blue-100 text-sm">
                Formalités douanières export en Chine
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <span className="text-3xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Fret Maritime</h3>
              <p className="text-blue-100 text-sm">
                Transport sécurisé par voie maritime
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <span className="text-3xl font-bold">4</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Dédouanement</h3>
              <p className="text-blue-100 text-sm">
                Procédures douanières à Tamatave
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <span className="text-3xl font-bold">5</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Livraison Finale</h3>
              <p className="text-blue-100 text-sm">
                Transport routier vers toutes les provinces
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Nos Avantages
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pourquoi choisir Continental Express Cargo pour vos importations ?
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {advantages.map((advantage, index) => {
              const Icon = advantage.icon;
              return (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                    {advantage.title}
                  </h3>
                  <p className="text-gray-600 text-sm text-center leading-relaxed">
                    {advantage.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-12 border border-blue-200">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Besoin d'un devis personnalisé ?
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              Contactez-nous dès aujourd'hui pour obtenir un devis gratuit et sans engagement. Notre équipe d'experts vous accompagnera dans votre projet d'importation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/261340725292"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <span>WhatsApp: +261 34 07 252 92</span>
              </a>
              <a
                href="mailto:cec.sales52@gmail.com"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <span>Email: cec.sales52@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
