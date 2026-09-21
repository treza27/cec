import React from 'react';
import { Ship, Warehouse, Package, CheckCircle, ArrowLeft, MessageCircle, Mail, Clock, DollarSign, Shield, Globe } from 'lucide-react';
import SEO from './SEO';

interface LclPageProps {
  onNavigate?: (page: string) => void;
}

export default function LclPage({ onNavigate }: LclPageProps) {
  return (
    <>
      <SEO
        title="LCL – Groupage Maritime Chine-Madagascar | Continental Express Cargo"
        description="Transport maritime en groupage LCL entre la Chine et Madagascar. Entrepôts à Guangzhou et Yiwu. Solution flexible et économique pour tous les volumes d'importation."
        canonical="/services/lcl"
        ogImage="/Chargement_Chine_CEC.jpg"
      />
      <section className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white py-20">
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
                <Ship className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-blue-200 font-semibold text-lg mb-2">Cargo partagé</p>
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">LCL – Groupage Maritime</h1>
                <p className="text-xl text-blue-100 max-w-2xl leading-relaxed">
                  Transportez vos marchandises de la Chine vers Madagascar en toute sécurité, quelle que soit la quantité.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Qu'est-ce que le groupage LCL ?</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Le <strong>LCL (Less than Container Load)</strong> est une solution de transport maritime où vos marchandises partagent un conteneur avec d'autres expéditeurs. Idéal si vous n'avez pas assez de volume pour remplir un conteneur entier, le groupage vous permet de ne payer que l'espace que vous utilisez réellement.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Continental Express Cargo regroupe les cargaisons de plusieurs clients dans un même conteneur, optimisant ainsi les coûts tout en maintenant la sécurité et le suivi de chaque envoi.
              </p>
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <p className="text-blue-800 font-semibold text-lg">
                  Une solution flexible, économique et adaptée à tous les volumes.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/906494/pexels-photo-906494.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Port maritime et conteneurs"
                className="rounded-2xl shadow-2xl w-full h-80 object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Tous volumes acceptés</p>
                    <p className="text-sm text-gray-500">Petites et grandes quantités</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos Entrepôts Stratégiques en Chine</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Deux points de collecte pour faciliter le regroupement de vos marchandises depuis les principales zones industrielles chinoises.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Warehouse className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Guangzhou</h3>
                    <p className="text-gray-500 text-sm">Province du Guangdong</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Au cœur de la Chine du Sud, Guangzhou est la capitale du commerce international. Notre entrepôt dessert les fournisseurs de produits électroniques, textiles, mobilier et biens de consommation.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>Accès rapide aux zones industrielles de Foshan et Shenzhen</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>Proche du port de Nansha et de l'aéroport international</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Warehouse className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Yiwu</h3>
                    <p className="text-gray-500 text-sm">Province du Zhejiang</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Yiwu abrite le plus grand marché de gros au monde. Notre entrepôt est idéalement situé pour collecter des marchandises variées : accessoires, jouets, articles de maison et produits divers.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    <span>Accès direct au Marché International de Yiwu</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    <span>Proximité avec les fournisseurs de Jinhua et Hangzhou</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Les avantages du LCL avec CEC</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: DollarSign, title: 'Économique', desc: 'Payez uniquement le volume que vous utilisez. Pas de frais pour l\'espace vide.', color: 'bg-green-500' },
                { icon: Shield, title: 'Sécurisé', desc: 'Chaque colis est inventorié et suivi individuellement tout au long du trajet.', color: 'bg-blue-500' },
                { icon: Clock, title: 'Flexible', desc: 'Expéditions régulières sans attendre de remplir un conteneur complet.', color: 'bg-orange-500' },
                { icon: Globe, title: 'Couverture totale', desc: 'Livraison dans toutes les provinces de Madagascar, du littoral aux hautes terres.', color: 'bg-teal-500' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300">
                    <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Ce qui est inclus dans notre service LCL</h2>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {[
                { step: '01', title: 'Réception en entrepôt', desc: 'Nous réceptionnons vos marchandises dans nos entrepôts de Guangzhou ou Yiwu et vérifions leur état.' },
                { step: '02', title: 'Contrôle et inventaire', desc: 'Chaque article est inventorié, photographié et enregistré dans notre système de suivi.' },
                { step: '03', title: 'Regroupement', desc: 'Vos marchandises sont regroupées avec d\'autres envois pour optimiser l\'espace et réduire les coûts.' },
                { step: '04', title: 'Chargement et transit', desc: 'Le conteneur est chargé et embarqué sur le navire vers Madagascar via l\'océan Indien.' },
                { step: '05', title: 'Dédouanement à Tamatave', desc: 'Nos agents gèrent toutes les formalités douanières à l\'arrivée au port de Tamatave.' },
                { step: '06', title: 'Livraison finale', desc: 'Vos marchandises sont livrees a Antananarivo ou dans n\'importe quelle province selon votre demande.' },
              ].map((item, i) => (
                <div key={i} className={`flex items-start space-x-6 p-6 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100 last:border-b-0`}>
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12 text-white">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Obtenez votre devis LCL</h2>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Contactez-nous avec les détails de votre commande (volume, poids, nature des produits) et nous vous répondons rapidement.
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
