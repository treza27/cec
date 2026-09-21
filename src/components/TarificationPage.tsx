import React, { useState } from 'react';
import {
  Scale, Package, Ship, Briefcase, CheckCircle, AlertCircle, MessageCircle,
  Mail, ArrowRight, Send, Loader, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import SEO from './SEO';
import { supabase } from '../utils/supabase';
import { toast } from 'react-hot-toast';

interface ServiceTier {
  id: 'lcl' | 'fcl' | 'conseil';
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  includes: string[];
  note: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeColor: string;
}

const serviceTiers: ServiceTier[] = [
  {
    id: 'lcl',
    icon: Package,
    title: 'LCL – Groupage Maritime',
    subtitle: 'Idéal pour les petits et moyens volumes',
    description: 'Partagez un conteneur avec d\'autres clients. Vous ne payez que pour votre volume réel. Solution économique pour les volumes inférieurs à 15–20 CBM.',
    includes: [
      'Réception en entrepôt Guangzhou ou Yiwu',
      'Groupage et consolidation de la cargaison',
      'Fret maritime jusqu\'à Toamasina',
      'Dédouanement et droits inclus (sur devis)',
      'Livraison à Antananarivo ou en province',
      'Suivi en temps réel via notre plateforme',
    ],
    note: 'Tarif calculé au CBM (mètre cube) ou au poids taxable. Demandez un devis personnalisé.',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'fcl',
    icon: Ship,
    title: 'FCL – Conteneur Complet',
    subtitle: 'Adapté aux grands volumes (> 15–20 CBM)',
    description: 'Vous disposez d\'un conteneur entier (20\' ou 40\'). Chargement direct depuis l\'usine ou depuis notre entrepôt en Chine. Service clé en main.',
    includes: [
      'Coordination du chargement en usine',
      'Déclaration export depuis la Chine',
      'Fret maritime conteneur complet',
      'Dédouanement à Toamasina',
      'Transport terrestre jusqu\'à Antananarivo',
      'Livraison en province sur demande',
    ],
    note: 'Tarif fixe par conteneur 20\' ou 40\'. Dépend de la compagnie maritime et de la saison.',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    badgeColor: 'bg-teal-100 text-teal-700',
  },
  {
    id: 'conseil',
    icon: Briefcase,
    title: 'Accompagnement & Conseil',
    subtitle: 'Expertise en commerce international',
    description: 'CEC vous accompagne dans votre stratégie d\'importation : sélection de fournisseurs, négociation des prix, analyse de marché et gestion administrative.',
    includes: [
      'Sourcing et présélection de fournisseurs vérifiés',
      'Négociation des prix et conditions de paiement',
      'Contrôle qualité avant expédition',
      'Conseil sur les réglementations douanières',
      'Analyse et comparaison des offres de fret',
      'Accompagnement pour les paiements en Chine',
    ],
    note: 'Service sur mesure selon vos besoins. Contactez-nous pour discuter de votre projet.',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
];

const pricingFactors = [
  { icon: Scale, title: 'Poids et volume', description: 'Le tarif est calculé sur le poids réel ou le poids volumétrique (selon le plus élevé). 1 CBM ≈ 167 kg pour le calcul du fret.' },
  { icon: Package, title: 'Nature des marchandises', description: 'Certains produits (chimiques, alimentaires, électroniques, batteries) nécessitent des certifications supplémentaires qui peuvent impacter le coût.' },
  { icon: Ship, title: 'Type de service', description: 'LCL (groupage) ou FCL (conteneur complet). À partir d\'environ 15–20 CBM, le FCL devient généralement plus économique que le LCL.' },
  { icon: ArrowRight, title: 'Destination finale', description: 'Livraison à Antananarivo ou en province. Le coût de transport terrestre jusqu\'à votre province est ajouté au tarif de base.' },
];

interface FormData {
  nom: string;
  email: string;
  whatsapp: string;
  type_service: 'lcl' | 'fcl' | 'conseil';
  description_marchandise: string;
  poids_estime: string;
  volume_estime: string;
  destination: string;
  message: string;
}

const destinations = [
  'Antananarivo',
  'Toamasina',
  'Mahajanga',
  'Fianarantsoa',
  'Antsiranana (Diego)',
  'Toliara (Tuléar)',
  'Autre province',
];

export default function TarificationPage() {
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    email: '',
    whatsapp: '',
    type_service: 'lcl',
    description_marchandise: '',
    poids_estime: '',
    volume_estime: '',
    destination: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFactor, setOpenFactor] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom.trim()) {
      toast.error('Veuillez indiquer votre nom.');
      return;
    }
    if (!formData.email.trim() && !formData.whatsapp.trim()) {
      toast.error('Veuillez indiquer un email ou un numéro WhatsApp.');
      return;
    }
    if (!formData.description_marchandise.trim()) {
      toast.error('Veuillez décrire vos marchandises.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('devis_requests')
        .insert({
          nom: formData.nom.trim(),
          email: formData.email.trim() || null,
          whatsapp: formData.whatsapp.trim() || null,
          type_service: formData.type_service,
          description_marchandise: formData.description_marchandise.trim(),
          poids_estime: formData.poids_estime.trim() || null,
          volume_estime: formData.volume_estime.trim() || null,
          destination: formData.destination || null,
          message: formData.message.trim() || null,
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Votre demande de devis a bien été envoyée !');
    } catch (err) {
      console.error(err);
      toast.error('Une erreur s\'est produite. Veuillez réessayer ou nous contacter directement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Tarification — Prix du fret maritime Chine-Madagascar"
        description="Consultez nos tarifs de transport maritime LCL (groupage), FCL (conteneur complet) et service de conseil import entre la Chine et Madagascar. Demandez un devis gratuit."
        canonical="/tarification"
      />
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-teal-800 py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <Scale className="w-4 h-4 text-teal-300" />
            <span className="text-teal-200 text-sm font-medium">Tarification transparente</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Tarifs & Devis
            <span className="block text-teal-300">Personnalisés</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Nos tarifs s'adaptent à votre volume, votre destination et votre type de service. Obtenez un devis précis en remplissant le formulaire ci-dessous.
          </p>
        </div>
      </section>

      {/* Service Tiers */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Nos formules de service
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Chaque formule est adaptée à vos volumes et besoins. Un devis personnalisé vous sera fourni après analyse de votre demande.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {serviceTiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div key={tier.id} className={`bg-white border-2 ${tier.borderColor} rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col`}>
                  <div className={`${tier.bgColor} p-6 border-b ${tier.borderColor}`}>
                    <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4`}>
                      <Icon className={`w-7 h-7 ${tier.color}`} />
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3 ${tier.badgeColor}`}>
                      {tier.id === 'lcl' ? 'Groupage' : tier.id === 'fcl' ? 'Conteneur' : 'Conseil'}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{tier.title}</h3>
                    <p className={`text-sm font-medium ${tier.color}`}>{tier.subtitle}</p>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-gray-600 mb-5 leading-relaxed text-sm">{tier.description}</p>
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {tier.includes.map((item, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <CheckCircle className={`w-4 h-4 ${tier.color} mt-0.5 flex-shrink-0`} />
                          <span className="text-sm text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className={`${tier.bgColor} rounded-xl p-4 border ${tier.borderColor}`}>
                      <div className="flex items-start space-x-2">
                        <Info className={`w-4 h-4 ${tier.color} mt-0.5 flex-shrink-0`} />
                        <p className="text-xs text-gray-600 leading-relaxed">{tier.note}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Factors */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Facteurs influençant le tarif
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprendre ce qui détermine le coût de votre importation vous permet de mieux planifier votre budget.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pricingFactors.map((factor) => {
              const Icon = factor.icon;
              return (
                <div key={factor.title} className="flex items-start space-x-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors duration-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">{factor.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{factor.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 leading-relaxed">
              <strong>Transparence totale :</strong> CEC s'engage à vous fournir un devis détaillé incluant le fret maritime, le dédouanement, les taxes et le transport terrestre. Pas de frais cachés.
            </p>
          </div>
        </div>
      </section>

      {/* Quote Request Form */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50" id="devis">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Demander un devis gratuit
            </h2>
            <p className="text-lg text-gray-600">
              Remplissez le formulaire ci-dessous. Nous vous répondons sous 24h ouvrées.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-12 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Demande reçue !</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Votre demande de devis a été transmise à notre équipe. Nous vous contacterons sous 24h ouvrées par email ou WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://wa.me/261340725292"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Nous contacter sur WhatsApp</span>
                </a>
                <button
                  onClick={() => setSubmitted(false)}
                  className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium px-6 py-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  <span>Nouvelle demande</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-teal-50">
                <h3 className="text-lg font-bold text-gray-900">Vos informations de contact</h3>
                <p className="text-sm text-gray-500 mt-1">Indiquez au moins un moyen de contact (email ou WhatsApp)</p>
              </div>
              <div className="p-8 space-y-6">
                {/* Contact info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom complet *</label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      placeholder="Votre nom et prénom"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp</label>
                    <input
                      type="tel"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      placeholder="+261 34 00 000 00"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="votre@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Service type */}
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Type de service souhaité *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['lcl', 'fcl', 'conseil'] as const).map((type) => {
                      const labels = { lcl: 'LCL – Groupage', fcl: 'FCL – Conteneur complet', conseil: 'Accompagnement & Conseil' };
                      return (
                        <label
                          key={type}
                          className={`flex items-center space-x-2 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            formData.type_service === type
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="type_service"
                            value={type}
                            checked={formData.type_service === type}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                            formData.type_service === type
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {formData.type_service === type && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                          <span className={`text-sm font-medium ${
                            formData.type_service === type ? 'text-blue-700' : 'text-gray-700'
                          }`}>{labels[type]}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Merchandise */}
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description des marchandises *</label>
                  <textarea
                    name="description_marchandise"
                    value={formData.description_marchandise}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Ex : vêtements et textiles, électronique grand public, matériaux de construction..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Poids estimé</label>
                    <input
                      type="text"
                      name="poids_estime"
                      value={formData.poids_estime}
                      onChange={handleChange}
                      placeholder="Ex : 500 kg"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Volume estimé (CBM)</label>
                    <input
                      type="text"
                      name="volume_estime"
                      value={formData.volume_estime}
                      onChange={handleChange}
                      placeholder="Ex : 3 CBM"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Destination à Madagascar</label>
                  <select
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">Sélectionner une province...</option>
                    {destinations.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message complémentaire</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Précisions sur votre commande, contraintes particulières, questions..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Envoyer ma demande de devis</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-gray-400">
                  Réponse sous 24h ouvrées. Vos données sont traitées de manière confidentielle.
                </p>
              </div>
            </form>
          )}

          {/* Alternative contact */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 mb-4">Vous préférez nous contacter directement ?</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/261340725292"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200"
              >
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp : +261 34 07 252 92</span>
              </a>
              <a
                href="mailto:cec.sales52@gmail.com"
                className="inline-flex items-center space-x-2 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 font-semibold px-6 py-3 rounded-xl transition-all duration-200"
              >
                <Mail className="w-5 h-5" />
                <span>cec.sales52@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
