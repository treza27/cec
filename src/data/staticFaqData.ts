export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const faqData: FaqItem[] = [
  // Catégorie Services
  {
    id: '1',
    category: 'services',
    question: 'Quels sont vos délais de livraison entre la Chine et Madagascar ?',
    answer: 'Les délais de livraison entre la Chine et Madagascar sont généralement de 45 à 60 jours, mais ils peuvent varier selon la compagnie maritime, la météo, les formalités portuaires ou douanières. Ces facteurs, souvent extérieurs à notre contrôle, influencent le transit. Toutefois, nous mettons tout en œuvre avec nos partenaires pour assurer le respect des délais annoncés.'
  },
  {
    id: '2',
    category: 'services',
    question: 'Quels types de marchandises pouvez-vous transporter ?',
    answer: 'Nous acceptons les marchandises générales, mais n\'acceptons pas celles soumises à des réglementations complexes comme les téléphones, véhicules motorisés ou électroménagers de marque. Pour les marchandises dangereuses ou sensibles (batteries, liquides, produits chimiques ou en poudre), nous vous invitons à nous contacter afin d\'étudier chaque cas précisément.'
  },
  {
    id: '3',
    category: 'services',
    question: 'Proposez-vous une assurance pour les marchandises ?',
    answer: 'Avec nous, vos marchandises voyagent en toute tranquillité : nous les assurons contre les risques de perte et d\'endommagement. Et si un incident survient sous notre responsabilité, nous nous occupons de tout pour vous accompagner et vous indemniser de façon claire et équitable.'
  },
  {
    id: '4',
    category: 'services',
    question: 'Comment préparer mes marchandises pour l\'expédition ?',
    answer: 'Contactez nous avant toute expédition, nous vous guiderons pas à pas : avec nous, préparer et expédier vos marchandises devient simple et sans stress.'
  },
  {
    id: '5',
    category: 'services',
    question: 'Quels documents dois-je fournir pour l\'expédition ?',
    answer: 'Avant toute livraison, merci de nous transmettre votre packing list (type de produits, nombre de cartons ou palettes, poids et volume) et votre shipping mark. Nous vous guiderons ensuite pas à pas : avec nous, préparer et expédier vos marchandises devient simple et sans stress.'
  },
  {
    id: '6',
    category: 'services',
    question: 'Quels sont vos tarifs ?',
    answer: 'Nos tarifs se basent sur le lieu de livraison et le poids de vos marchandises au mètre cube. Envoyez-nous votre packing list et nous vous préparerons un devis gratuit rapidement.'
  },
  {
    id: '7',
    category: 'services',
    question: 'Vous occupez-vous des formalités douanières ?',
    answer: 'Oui, les formalités douanières font partie de nos services. Avec plus de 18 ans d\'expérience, nous mettons notre expertise à votre service pour que vos envois passent la douane facilement et en toute sérénité.'
  },
  {
    id: '8',
    category: 'services',
    question: 'Quelles sont les taxes à prévoir ?',
    answer: 'Vous n\'avez pas à vous soucier des taxes, elles sont comprises dans notre forfait. Vous pouvez vous concentrer à 100 % sur votre business, pendant que nous transportons vos marchandises en toute sécurité.'
  },

  // Catégorie Suivi et Livraison
  {
    id: '9',
    category: 'suivi',
    question: 'Comment puis-je suivre mon colis ?',
    answer: 'Dès l\'expédition, vous pouvez suivre vos marchandises en temps réel grâce à notre application web? De plus, notre équipe reste à votre disposition pour vous accompagner pour toutes questions.'
  },
  {
    id: '10',
    category: 'suivi',
    question: 'Proposez-vous la livraison à domicile ?',
    answer: 'Nous pouvons organiser la livraison de vos marchandises à domicile, à Tananarive ou en province, avec votre transporteur habituel ou le nôtre. Prévenez-nous à l\'avance afin que nous puissions planifier la livraison en toute sérénité.'
  },
  {
    id: '11',
    category: 'suivi',
    question: 'Puis-je venir récupérer mes marchandises directement ?',
    answer: 'Bien sûr ! Vous pouvez récupérer vos marchandises directement dans notre entrepôt à Antananarivo. Nous vous préviendrons dès qu\'elles seront prêtes, pour un retrait simple et sans stress.'
  }
];

export const categories = [
  { id: 'all', label: 'Toutes les catégories' },
  { id: 'services', label: 'Services et Tarifs' },
  { id: 'suivi', label: 'Suivi et Livraison' },
];