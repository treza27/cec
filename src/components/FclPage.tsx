import React from 'react';
import { Container, CheckCircle, ArrowLeft, MessageCircle, Mail, Factory, FileText, Ship, Anchor, Truck } from 'lucide-react';
import SEO from './SEO';

interface FclPageProps {
  onNavigate?: (page: string) => void;
}

export default function FclPage({ onNavigate }: FclPageProps) {
  const steps = [
    {
      number: '01',
      icon: Factory,
      title: 'Chargement Usine',
      subtitle: 'En Chine',
      desc: 'Notre équipe coordonne l\'enlèvement de vos marchandises directement chez votre fournisseur en Chine. Nous vérifions la conformité et assurons un chargement sécurisé du conteneur.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      number: '02',
      icon: FileText,
      title: 'Déclaration Export',
      subtitle: 'Formalités douanières',
      desc: 'Nous prenons en charge l\'ensemble des formalités douanières d\'exportation en Chine : déclaration, documents commerciaux, certificats d\'origine et paiement du fret maritime.',
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      number: '03',
      icon: Ship,
      title: 'Fret Maritime',
      subtitle: 'Transit océanique',
      desc: 'Votre conteneur est acheminé par voie maritime depuis le port chinois jusqu\'à Madagascar. Suivi en temps réel disponible pour connaître la position de votre cargaison.',
      color: 'from-teal-500 to-teal-600',
    },
    {
      number: '04',
      icon: Anchor,
      title: 'Dédouanement',
      subtitle: 'Port de Tamatave',
      desc: 'À l\'arrivée au port de Tamatave, nos agents gèrent toutes les procédures douanières malgaches : déclaration d\'importation, inspection, paiement des droits et taxes.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      number: '05',
      icon: Truck,
      title: 'Livraison Finale',
      subtitle: 'Partout à Madagascar',
      desc: 'Votre conteneur est acheminé par route depuis Tamatave vers Antananarivo ou toute autre province. Livraison jusqu\'à votre entrepôt ou lieu de stockage.',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const features = [
    'Prise en charge complète de A à Z',
    'Un seul interlocuteur pour tout le trajet',
    'Suivi en temps réel de votre conteneur',
    'Aucune surprise : tarif tout compris',
    'Livraison dans toutes les provinces malgaches',
    'Gestion de la documentation douanière',
  ];

  return (
    <>
      <SEO
        title="FCL – Transit Maritime Complet Chine-Madagascar | Continental Express Cargo"
        description="Service de transit maritime FCL complet entre la Chine et Madagascar. Chargement usine, fret maritime, dédouanement et livraison finale. Service clé en main sécurisé."
        canonical="/services/fcl"
        ogImage="/Entrepot_Chine_CEC.jpg"
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
                <Container className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-blue-200 font-semibold text-lg mb-2">Service clé en main</p>
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">FCL – Transit Maritime Complet</h1>
                <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
                  Nous prenons en charge l'intégralité du transport depuis votre fournisseur en Chine jusqu'à votre entrepôt à Madagascar.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Qu'est-ce que le FCL ?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Le <strong>FCL (Full Container Load)</strong> est un service de transport maritime où vous disposez d'un conteneur entier exclusivement pour vos marchandises. C'est la solution idéale pour les volumes importants, offrant une sécurité maximale et de meilleures conditions tarifaires à la tonne.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Avec notre service FCL, vous bénéficiez d'un <strong>accompagnement intégral</strong> : de la sortie d'usine en Chine jusqu'à la livraison finale dans n'importe quelle ville ou province malgache.
              </p>
              <div className="space-y-3">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/2226458/pexels-photo-2226458.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Conteneurs maritimes"
                className="rounded-2xl shadow-2xl w-full h-80 object-cover"
              />
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Container className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Conteneur exclusif</p>
                    <p className="text-sm text-gray-500">Sécurité maximale</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Le Processus FCL en 5 Étapes</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Un service clé en main, transparent et sécurisé, de l'usine en Chine à votre entrepôt à Madagascar.
              </p>
            </div>

            <div className="relative">
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0" style={{ top: '60px' }} />
              <div className="grid lg:grid-cols-5 gap-6">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={i} className="relative z-10 flex flex-col items-center text-center">
                      <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-xl mb-4`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 w-full hover:shadow-xl transition-shadow duration-300">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{step.number}</span>
                        <h3 className="text-base font-bold text-gray-900 mt-1 mb-1">{step.title}</h3>
                        <p className="text-xs text-gray-500 font-medium mb-3">{step.subtitle}</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mb-20 grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quand choisir le FCL ?</h2>
              <div className="space-y-4">
                {[
                  { q: 'Volume important', a: 'Vous importez plus d\'un camion (20 m³) de marchandises. Le FCL devient plus économique que le LCL à partir d\'un certain volume.' },
                  { q: 'Sécurité renforcée', a: 'Vos marchandises fragiles ou de haute valeur ne sont pas mélangées avec d\'autres cargaisons.' },
                  { q: 'Planning maîtrisé', a: 'Vous contrôlez le calendrier de chargement et d\'expédition sans attendre que d\'autres clients complètent un conteneur partagé.' },
                  { q: 'Confidentialité', a: 'Votre cargaison reste privée et n\'est pas exposée aux autres clients lors des manutentions.' },
                ].map((item, i) => (
                  <div key={i} className="border-l-4 border-blue-500 pl-4">
                    <p className="font-bold text-gray-900 mb-1">{item.q}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Types de conteneurs disponibles</h2>
              <div className="space-y-4">
                {[
                  { type: '20 pieds Standard', volume: '33 m³', poids: 'jusqu\'à 28 tonnes', usage: 'Marchandises générales, produits solides' },
                  { type: '40 pieds Standard', volume: '67 m³', poids: 'jusqu\'à 26 tonnes', usage: 'Grands volumes, meubles, textiles' },
                  { type: '40 pieds High Cube', volume: '76 m³', poids: 'jusqu\'à 26 tonnes', usage: 'Marchandises volumineuses, machines' },
                ].map((c, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="font-bold text-gray-900 mb-2">{c.type}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-500">Volume : <strong className="text-gray-700">{c.volume}</strong></span>
                      <span className="text-gray-500">Charge : <strong className="text-gray-700">{c.poids}</strong></span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{c.usage}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-3xl p-12 text-white">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Demandez votre devis FCL</h2>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Partagez-nous votre itinéraire (origine en Chine, destination à Madagascar) et le type de marchandises. Nous vous préparons une offre sur mesure.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/261340725292"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-400 transition-colors duration-200 shadow-lg"
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
