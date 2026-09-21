import React from 'react';
import { Briefcase, Search, DollarSign, Ship, TrendingUp, ShoppingCart, CheckCircle, ArrowLeft, MessageCircle, Mail, Users, Lightbulb } from 'lucide-react';
import SEO from './SEO';

interface ConseilPageProps {
  onNavigate?: (page: string) => void;
}

export default function ConseilPage({ onNavigate }: ConseilPageProps) {
  const expertises = [
    {
      icon: Search,
      title: 'Recherche & Sélection de Fournisseurs',
      desc: 'Nous identifions pour vous des fournisseurs chinois fiables, vérifiés et adaptés à vos besoins spécifiques. Notre réseau en Chine nous permet de vous présenter des partenaires de confiance qui respectent les délais et la qualité.',
      points: ['Vérification de la crédibilité des fournisseurs', 'Visite d\'usine et contrôle qualité', 'Mise en relation directe et sécurisée'],
      color: 'blue',
    },
    {
      icon: DollarSign,
      title: 'Négociation des Prix & Conditions d\'Achat',
      desc: 'Nos équipes négocient en votre nom avec les fournisseurs pour obtenir les meilleures conditions : prix, délais de paiement, conditions de livraison (Incoterms) et garanties qualité.',
      points: ['Négociation en mandarin avec les fournisseurs', 'Optimisation des Incoterms (FOB, CIF, EXW)', 'Sécurisation des acomptes et conditions de paiement'],
      color: 'green',
    },
    {
      icon: Ship,
      title: 'Choix de la Compagnie Maritime',
      desc: 'Selon vos contraintes de délai, budget et type de marchandises, nous sélectionnons la compagnie maritime et le transit les mieux adaptés à votre situation.',
      points: ['Comparaison des offres des armateurs', 'Sélection selon délai et tarif', 'Suivi du statut du navire en temps réel'],
      color: 'teal',
    },
    {
      icon: TrendingUp,
      title: 'Analyse de la Saisonnalité du Marché',
      desc: 'Nous vous conseillons sur les meilleurs moments pour acheter et importer selon la saisonnalité du marché malgache et chinois, pour éviter les ruptures de stock et les surcoûts tarifaires.',
      points: ['Calendrier des fêtes et pics de demande à Madagascar', 'Périodes de fermeture des usines en Chine (Nouvel An)', 'Anticipation des hausses de fret maritime'],
      color: 'orange',
    },
    {
      icon: ShoppingCart,
      title: 'Stratégie de Vente & E-commerce',
      desc: 'Au-delà du transport, nous vous accompagnons dans votre stratégie commerciale : positionnement produit, pricing, vente physique et digitale pour maximiser votre rentabilité.',
      points: ['Conseil en choix de produits porteurs', 'Strategie de vente locale et en ligne', 'Analyse de la concurrence et du positionnement'],
      color: 'rose',
    },
  ];

  const colorMap: { [key: string]: { bg: string; icon: string; text: string; border: string; bullet: string } } = {
    blue: { bg: 'from-blue-50 to-cyan-50', icon: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200', bullet: 'text-blue-500' },
    green: { bg: 'from-green-50 to-emerald-50', icon: 'bg-green-500', text: 'text-green-600', border: 'border-green-200', bullet: 'text-green-500' },
    teal: { bg: 'from-teal-50 to-cyan-50', icon: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-200', bullet: 'text-teal-500' },
    orange: { bg: 'from-blue-50 to-cyan-50', icon: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200', bullet: 'text-blue-500' },
    rose: { bg: 'from-rose-50 to-pink-50', icon: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-200', bullet: 'text-rose-500' },
  };

  return (
    <>
      <SEO
        title="Accompagnement & Conseil Import Chine-Madagascar | Continental Express Cargo"
        description="Expertise en commerce international : sourcing fournisseurs, négociation, choix maritime, analyse de marché et stratégie de vente. Accompagnement complet pour vos importations depuis la Chine."
        canonical="/services/conseil"
        ogImage="/Partnership_China_CEC.jpg"
      />
      <section className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => onNavigate?.('services')}
              className="inline-flex items-center space-x-2 text-blue-200 hover:text-white transition-colors duration-200 mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="text-sm font-medium">Retour aux services</span>
            </button>
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0 w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Briefcase className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-blue-200 font-semibold text-lg mb-2">Expertise en commerce international</p>
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">Accompagnement & Conseil</h1>
                <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
                  Profitez de notre expertise pour réussir vos projets d'importation depuis la Chine et développer votre activité à Madagascar.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Équipe de conseil professionnel"
                className="rounded-2xl shadow-2xl w-full h-80 object-cover"
              />
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Équipe dédiée</p>
                    <p className="text-sm text-gray-500">Experts import-export</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Pourquoi se faire accompagner ?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Importer depuis la Chine peut sembler complexe : trouver des fournisseurs fiables, négocier, gérer la logistique, comprendre les réglementations douanières... Des erreurs peuvent coûter cher.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Notre équipe, forte d'années d'expérience dans le commerce sino-malgache, vous guide à chaque étape pour <strong>minimiser les risques et maximiser votre rentabilité</strong>.
              </p>
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                  <p className="text-blue-800 font-semibold leading-relaxed">
                    Un accompagnement complet pour optimiser vos achats et développer votre activité.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos 5 Domaines d'Expertise</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Un accompagnement stratégique couvrant tous les aspects de votre projet d'importation.
              </p>
            </div>
            <div className="space-y-6">
              {expertises.map((exp, i) => {
                const Icon = exp.icon;
                const colors = colorMap[exp.color];
                return (
                  <div key={i} className={`bg-gradient-to-r ${colors.bg} rounded-2xl p-8 border ${colors.border} hover:shadow-lg transition-shadow duration-300`}>
                    <div className="grid lg:grid-cols-3 gap-8 items-start">
                      <div className="flex items-start space-x-4 lg:col-span-1">
                        <div className={`flex-shrink-0 w-14 h-14 ${colors.icon} rounded-xl flex items-center justify-center shadow-lg`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expertise 0{i + 1}</span>
                          <h3 className={`text-xl font-bold ${colors.text} mt-1`}>{exp.title}</h3>
                        </div>
                      </div>
                      <div className="lg:col-span-2">
                        <p className="text-gray-700 leading-relaxed mb-4">{exp.desc}</p>
                        <div className="space-y-2">
                          {exp.points.map((p, j) => (
                            <div key={j} className="flex items-center space-x-2">
                              <CheckCircle className={`w-4 h-4 ${colors.bullet} flex-shrink-0`} />
                              <span className="text-sm text-gray-600 font-medium">{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Comment ça marche ?</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Premier contact', desc: 'Vous nous expliquez votre projet : quel produit importer, en quelle quantité, quel budget. On analyse votre situation et on vous propose une approche personnalisée.' },
                { step: '2', title: 'Plan d\'action', desc: 'Nous élaborons un plan d\'action concret : identification des fournisseurs, calendrier d\'importation, stratégie tarifaire et recommandations logistiques.' },
                { step: '3', title: 'Exécution & Suivi', desc: 'Nous coordonnons chaque étape avec vous : négociation, commande, expédition, dédouanement. Vous êtes informé à chaque étape clé.' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-2xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-3xl p-12 text-white">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Parlons de votre projet</h2>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Chaque projet est unique. Contactez-nous pour un premier échange sans engagement et découvrez comment nous pouvons vous aider à importer plus intelligemment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/261340725292"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-400 transition-colors duration-200 shadow-lg"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href="mailto:cec.sales52@gmail.com"
                  className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors duration-200 backdrop-blur-sm border border-white/30"
                >
                  <Mail className="w-5 h-5" />
                  <span>cec.sales52@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
