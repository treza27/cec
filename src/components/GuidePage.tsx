import React, { useState } from 'react';
import {
  ShoppingCart, FileText, Ship, Package, CheckCircle, ChevronDown, ChevronUp,
  MessageCircle, Mail, AlertCircle, BookOpen, Anchor, Info, ArrowRight
} from 'lucide-react';
import SEO from './SEO';

interface Step {
  number: string;
  title: string;
  description: string;
  details: string[];
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface DocumentItem {
  name: string;
  required: boolean;
  note: string;
}

interface LexiconEntry {
  term: string;
  definition: string;
}

const importSteps: Step[] = [
  {
    number: '01',
    title: 'Identification du fournisseur',
    description: 'Trouvez un fournisseur fiable en Chine (Alibaba, 1688, salons professionnels) ou faites appel à notre service d\'accompagnement achat.',
    details: [
      'Vérifiez les certifications et l\'historique du fournisseur',
      'Demandez des échantillons avant toute commande en volume',
      'Négociez les conditions de paiement (30/70, LC, etc.)',
      'CEC peut vous mettre en relation avec des fournisseurs vérifiés',
    ],
    icon: ShoppingCart,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    number: '02',
    title: 'Passer et confirmer la commande',
    description: 'Formalisez la commande par écrit. Vérifiez les dimensions, poids, emballages et codes HS de vos marchandises.',
    details: [
      'Obtenez une facture proforma (Proforma Invoice)',
      'Vérifiez le code HS (Harmonized System) pour les droits de douane',
      'Précisez les dimensions et poids estimés par carton',
      'Confirmez l\'adresse de l\'entrepôt CEC à transmettre au fournisseur',
    ],
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    number: '03',
    title: 'Réception en entrepôt CEC (Chine)',
    description: 'Votre fournisseur livre directement dans nos entrepôts de Guangzhou ou Yiwu. Nous contrôlons et enregistrons votre marchandise.',
    details: [
      'Entrepôt Guangzhou : pour marchandises générales et grands volumes',
      'Entrepôt Yiwu : idéal pour articles de marché et petits colis',
      'Contrôle quantitatif à la réception (cartons, palettes)',
      'Attribution d\'un numéro de suivi unique (Shipping Mark)',
    ],
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    number: '04',
    title: 'Groupage et expédition maritime',
    description: 'Vos colis sont regroupés avec d\'autres marchandises (LCL) ou expédiés dans un conteneur complet (FCL) selon le volume.',
    details: [
      'LCL (Groupage) : vous ne payez que pour votre volume réel en CBM',
      'FCL (Conteneur complet) : pour volumes supérieurs à 15–20 CBM',
      'Déclaration export à la douane chinoise',
      'Chargement sur navire et émission du Connaissement (BL)',
    ],
    icon: Ship,
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
  },
  {
    number: '05',
    title: 'Transit maritime',
    description: 'Le navire prend la route vers Madagascar (18–22 jours). Suivez votre conteneur en temps réel sur notre plateforme.',
    details: [
      'Durée de traversée : environ 18 à 22 jours depuis le port chinois',
      'Escale éventuelle à Singapour, Port-Louis ou La Réunion',
      'Suivi en temps réel via notre outil de tracking',
      'Notification à l\'arrivée au port de Toamasina',
    ],
    icon: Anchor,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  {
    number: '06',
    title: 'Dédouanement à Toamasina',
    description: 'CEC gère les démarches douanières pour vous. Préparez les documents requis à l\'avance pour éviter tout blocage.',
    details: [
      'Dépôt du dossier douanier complet (Invoice, BL, Packing List)',
      'Paiement des droits et taxes (droits de douane + TVA)',
      'Inspection physique si requise par la douane',
      'Délai habituel : 3 à 7 jours ouvrés',
    ],
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    number: '07',
    title: 'Livraison à destination',
    description: 'Vos marchandises arrivent à notre entrepôt d\'Antananarivo puis sont acheminées vers votre province ou récupérées en agence.',
    details: [
      'Notification SMS/WhatsApp à l\'arrivée en entrepôt Tana',
      'Retrait direct à l\'entrepôt CEC (Anosizato Est)',
      'Livraison à domicile disponible sur Antananarivo',
      'Expédition vers les provinces via notre réseau partenaire',
    ],
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
];

const requiredDocuments: DocumentItem[] = [
  { name: 'Facture commerciale (Commercial Invoice)', required: true, note: 'Avec valeur réelle des marchandises, description détaillée, code HS.' },
  { name: 'Liste de colisage (Packing List)', required: true, note: 'Nombre de cartons, poids brut/net, dimensions par article.' },
  { name: 'Connaissement maritime (Bill of Lading – BL)', required: true, note: 'Document émis par la compagnie maritime, reçu de CEC.' },
  { name: 'Déclaration import / D.I.', required: true, note: 'Formulaire douanier à déposer à Toamasina, géré par CEC.' },
  { name: 'Titre d\'importation (si applicable)', required: false, note: 'Requis pour certaines catégories de produits réglementés.' },
  { name: 'Certificat d\'origine', required: false, note: 'Parfois exigé par la douane malgache pour bénéficier de tarifs préférentiels.' },
  { name: 'Certificat phytosanitaire / MSDS', required: false, note: 'Obligatoire pour certains produits alimentaires, chimiques ou cosmétiques.' },
  { name: 'Attestation d\'assurance (si souscrite)', required: false, note: 'Couvre la valeur des marchandises en cas de sinistre maritime.' },
];

const lexiconEntries: LexiconEntry[] = [
  { term: 'LCL (Less Container Load)', definition: 'Groupage maritime : vos marchandises partagent un conteneur avec d\'autres clients. Vous ne payez que pour votre volume réel, exprimé en CBM (mètre cube).' },
  { term: 'FCL (Full Container Load)', definition: 'Conteneur complet à votre disposition. Adapté aux volumes supérieurs à 15–20 CBM. Coût fixe par conteneur (20\' ou 40\').' },
  { term: 'CBM (Cubic Meter)', definition: 'Unité de mesure de volume utilisée en fret maritime. 1 CBM = 1 m³. La tarification LCL est calculée au CBM ou au poids taxable.' },
  { term: 'BL (Bill of Lading / Connaissement)', definition: 'Document émis par la compagnie maritime qui atteste de la prise en charge de la marchandise. C\'est le titre de propriété des marchandises pendant le transport.' },
  { term: 'Proforma Invoice', definition: 'Facture prévisionnelle émise par le fournisseur avant la commande définitive. Sert de base pour la négociation et les démarches bancaires.' },
  { term: 'Code HS (Harmonized System)', definition: 'Code international à 6 chiffres (ou plus) classifiant chaque type de marchandise. Détermine les droits de douane applicables à l\'importation.' },
  { term: 'Dédouanement', definition: 'Procédure officielle de déclaration des marchandises à la douane à l\'importation. Comprend le dépôt des documents, le calcul et le paiement des droits et taxes.' },
  { term: 'Fret', definition: 'Coût du transport maritime des marchandises d\'un port à un autre, généralement calculé par CBM ou par conteneur.' },
  { term: 'ETA (Estimated Time of Arrival)', definition: 'Date d\'arrivée estimée du navire au port de destination. Peut varier selon les conditions météorologiques ou la congestion portuaire.' },
  { term: 'Shipping Mark', definition: 'Identifiant (numéro ou nom) apposé sur vos colis permettant à CEC de vous identifier dans l\'entrepôt et lors du dédouanement.' },
  { term: 'Packing List', definition: 'Document listant le contenu de chaque colis : description des articles, quantités, poids brut/net, dimensions. Complément obligatoire de la facture commerciale.' },
  { term: 'Droits de douane', definition: 'Taxes prélevées par la douane malgache sur les marchandises importées, calculées sur la valeur CIF (coût + assurance + fret) selon le code HS.' },
];

export default function GuidePage() {
  const [openLexicon, setOpenLexicon] = useState<string | null>(null);

  const toggleLexicon = (term: string) => {
    setOpenLexicon(prev => prev === term ? null : term);
  };

  return (
    <>
      <SEO
        title="Guide complet d'importation de Chine à Madagascar"
        description="Comment importer des marchandises de Chine à Madagascar en 4 étapes : sourcing fournisseurs, commande et paiement, fret maritime LCL/FCL, dédouanement et livraison."
        canonical="/guide"
        ogImage="/Entrepot_Chine_CEC.jpg"
      />
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.04%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
          <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <BookOpen className="w-4 h-4 text-blue-300" />
            <span className="text-blue-200 text-sm font-medium">Ressource importateur</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Guide de l'Importateur
            <span className="block text-cyan-300">Chine – Madagascar</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed mb-10">
            Tout ce qu'il faut savoir pour importer depuis la Chine vers Madagascar : étapes, documents, lexique maritime et conseils pratiques.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/261340725292"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Être accompagné par CEC</span>
            </a>
          </div>
        </div>
      </section>

      {/* Import Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Les 7 étapes d'une importation réussie
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              De la recherche fournisseur à la livraison en province, voici le parcours complet d'une importation avec CEC.
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-6 md:left-8 top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-300 via-blue-200 to-blue-100 hidden md:block"></div>
            <div className="space-y-6">
              {importSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="relative flex gap-6 md:gap-8">
                    <div className={`flex-shrink-0 w-12 h-12 md:w-16 md:h-16 ${step.bgColor} rounded-2xl flex items-center justify-center z-10 border-4 border-white shadow-md`}>
                      <Icon className={`w-6 h-6 md:w-8 md:h-8 ${step.color}`} />
                    </div>
                    <div className={`flex-1 ${step.bgColor} rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Étape {step.number}</span>
                          <h3 className="text-xl font-bold text-gray-900 mt-1">{step.title}</h3>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4 leading-relaxed">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <CheckCircle className={`w-4 h-4 ${step.color} mt-0.5 flex-shrink-0`} />
                            <span className="text-sm text-gray-600">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Documents Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Documents requis pour l'importation
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Préparez votre dossier à l'avance pour éviter les blocages en douane. CEC vous guide dans la constitution de vos documents.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Checklist des documents</h3>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {requiredDocuments.map((doc) => (
                <div key={doc.name} className="flex items-start gap-4 p-5 hover:bg-gray-50 transition-colors duration-150">
                  <div className={`flex-shrink-0 mt-0.5 ${doc.required ? 'text-emerald-500' : 'text-gray-300'}`}>
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-900">{doc.name}</span>
                      {doc.required ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Obligatoire</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Selon produit</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{doc.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Note importante :</strong> La liste des documents peut varier selon la nature des marchandises et les réglementations en vigueur à la douane malgache. CEC vous accompagne dans la préparation de votre dossier douanier.
            </p>
          </div>
        </div>
      </section>

      {/* Lexique maritime */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Lexique du fret maritime
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Les termes techniques expliqués simplement pour mieux comprendre votre importation.
            </p>
          </div>
          <div className="space-y-3">
            {lexiconEntries.map((entry) => {
              const isOpen = openLexicon === entry.term;
              return (
                <div key={entry.term} className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-200 transition-colors duration-200">
                  <button
                    onClick={() => toggleLexicon(entry.term)}
                    className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Info className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-bold text-gray-900">{entry.term}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 bg-blue-50 border-t border-blue-100">
                      <p className="text-gray-700 leading-relaxed pt-4">{entry.definition}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-950 to-blue-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Besoin d'aide pour votre première importation ?
          </h2>
          <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            Notre équipe vous accompagne de A à Z : recherche fournisseur, documentation douanière, transport et livraison.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/261340725292"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Parler à un expert CEC</span>
            </a>
            <a
              href="mailto:cec.sales52@gmail.com"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200"
            >
              <Mail className="w-5 h-5" />
              <span>Nous écrire</span>
            </a>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
