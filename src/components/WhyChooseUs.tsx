import React, { memo } from 'react';
import { Shield, Clock, MapPin, Users, Award, Globe, CheckCircle, Phone, ArrowRight, Truck, Ship, Package } from 'lucide-react';

const STATS = [
  { 
    value: "18+", 
    label: "Années d'expérience", 
    sublabel: "En transport maritime",
    icon: Award,
    color: "from-blue-500 to-blue-600"
  },
  { 
    value: "24h/7j", 
    label: "Tracking temps réel", 
    sublabel: "Application de suivi innovante",
    icon: Clock,
    color: "from-green-500 to-green-600"
  },
  { 
    value: "20+", 
    label: "Entreprises partenaires", 
    sublabel: "Qui nous font confiance",
    icon: Users,
    color: "from-purple-500 to-purple-600"
  }
];

const ADVANTAGES = [
  {
    icon: Shield,
    title: "Fret maritime sécurisé",
    description: "Vos marchandises sont protégées et sécurisées tout au long du transport maritime. Manutention soignée et emballage professionnel de la Chine vers Madagascar.",
    keywords: "transport maritime sécurisé, assurance fret maritime, protection marchandises",
    color: "bg-blue-100 text-blue-600",
    hoverColor: "group-hover:bg-blue-600 group-hover:text-white",
    bgGradient: "from-blue-50 to-blue-100",
    borderColor: "border-blue-200"
  },
  {
    icon: Clock,
    title: "Transport maritime rapide",
    description: "Délai de livraison optimisé de 45 à 60 jours depuis la Chine. Organisation logistique efficace pour vos expéditions vers Antananarivo et redistribution Madagascar.",
    keywords: "délai livraison maritime, expédition rapide Chine-Madagascar",
    color: "bg-green-100 text-green-600",
    hoverColor: "group-hover:bg-green-600 group-hover:text-white",
    bgGradient: "from-green-50 to-green-100",
    borderColor: "border-green-200"
  },
  {
    icon: MapPin,
    title: "Suivi fret temps réel",
    description: "Application web intuitive pour suivre vos marchandises 24h/7j. Localisation précise de votre conteneur et notifications automatiques à chaque étape.",
    keywords: "tracking maritime, suivi conteneur temps réel, application suivi fret",
    color: "bg-purple-100 text-purple-600",
    hoverColor: "group-hover:bg-purple-600 group-hover:text-white",
    bgGradient: "from-purple-50 to-purple-100",
    borderColor: "border-purple-200"
  },
  {
    icon: Users,
    title: "Support logistique expert pour votre transport maritime",
    description: "Équipe dédiée disponible pour répondre à toutes vos questions logistiques. Accompagnement personnalisé de la préparation à la réception de vos marchandises.",
    keywords: "support logistique maritime, assistance expédition, service client transport",
    color: "bg-orange-100 text-orange-600",
    hoverColor: "group-hover:bg-orange-600 group-hover:text-white",
    bgGradient: "from-orange-50 to-orange-100",
    borderColor: "border-orange-200"
  },
  {
    icon: Award,
    title: "Spécialiste fret Chine-Madagascar",
    description: "18 années d'expertise en transit et logistique vers Madagascar. Maîtrise parfaite des procédures douanières malgaches et coordination des opérations d'import.",
    keywords: "expérience transport maritime, expert fret Chine-Madagascar, transporteur expérimenté",
    color: "bg-red-100 text-red-600",
    hoverColor: "group-hover:bg-red-600 group-hover:text-white",
    bgGradient: "from-red-50 to-red-100",
    borderColor: "border-red-200"
  },
  {
    icon: Globe,
    title: "Entrepôts multiples en Chine",
    description: "Entrepôts stratégiques proches des principales zones commerciales chinoises (Guangzhou, Yiwu, Foshan). Collecte facilitée et consolidation avant expédition vers Madagascar.",
    keywords: "villes commerçantes Chine Madagascar, réseau transport maritime étendu",
    color: "bg-indigo-100 text-indigo-600",
    hoverColor: "group-hover:bg-indigo-600 group-hover:text-white",
    bgGradient: "from-indigo-50 to-indigo-100",
    borderColor: "border-indigo-200"
  }
];

const TRUST_BADGES = [
  {
    icon: Shield,
    text: "Assurance tous risques",
    color: "text-green-600 bg-green-50 border-green-200"
  },
  {
    icon: Truck,
    text: "Transport sécurisé",
    color: "text-blue-600 bg-blue-50 border-blue-200"
  },
  {
    icon: Clock,
    text: "Suivi temps réel",
    color: "text-purple-600 bg-purple-50 border-purple-200"
  },
  {
    icon: Users,
    text: "Service personnalisé",
    color: "text-orange-600 bg-orange-50 border-orange-200"
  }
];

const WhyChooseUs = memo(function WhyChooseUs() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-200/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header optimisé SEO */}
        <header className="text-center mb-16 relative">
          <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-cyan-800 bg-clip-text text-transparent mb-4 leading-relaxed">
            Nos avantages pour votre transport maritime Chine-Madagascar
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-loose">
            Découvrez les avantages de notre expertise en <strong>fret maritime international</strong> pour vos 
            <strong> expéditions depuis la Chine vers Madagascar</strong>. Service professionnel assuré.
          </p>
        </header>


        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {STATS.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="text-center group"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-cyan-800 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 leading-relaxed">{stat.label}</h3>
                <p className="text-gray-600 leading-loose">{stat.sublabel}</p>
              </div>
            );
          })}
        </div>

        {/* Grille des avantages */}
        <div className="advantages-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {ADVANTAGES.map((advantage, index) => {
            const Icon = advantage.icon;
            return (
              <article
                key={index}
                className={`group bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-6 hover:scale-105 border-2 ${advantage.borderColor} relative overflow-hidden`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Card background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${advantage.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                {/* Icône avec animation */}
                <div className={`w-16 h-16 ${advantage.color} ${advantage.hoverColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 shadow-lg relative z-10`}>
                  <Icon className="w-8 h-8 transition-colors duration-500" />
                </div>

                {/* Titre optimisé SEO */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 relative z-10 group-hover:text-blue-700 transition-colors duration-300 leading-relaxed">
                  {advantage.title}
                </h3>

                {/* Description avec mots-clés */}
                <p className="text-gray-600 leading-loose relative z-10 group-hover:text-gray-700 transition-colors duration-300">
                  {advantage.description}
                </p>

                {/* Mots-clés cachés pour SEO */}
                <div className="sr-only" aria-hidden="true">
                  {advantage.keywords}
                </div>
              </article>
            );
          })}
        </div>

        {/* Call-to-action principal */}
        <div className="text-center bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl p-8 lg:p-12 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl lg:text-3xl font-bold mb-4 leading-relaxed">
              Prêt à expédier vos marchandises depuis la Chine ?
            </h3>
            <p className="text-blue-100 mb-8 text-lg leading-loose max-w-2xl mx-auto">
              Rejoignez plus de 20 entreprises qui nous font confiance pour leurs expéditions maritimes. 
              Devis gratuit et personnalisé après reception du packing list.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/261340725292"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-3 border border-white/30 hover:scale-105 transform shadow-lg group"
              >
                <Phone className="w-5 h-5 group-hover:animate-pulse" />
                <span>+261 34 07 252 92</span>
              </a>
              <a
                href="mailto:cec.sales52@gmail.com"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:scale-105 transform group"
              >
                <span>Demander un devis gratuit</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Structured data pour SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Transport Maritime Chine-Madagascar",
            "provider": {
              "@type": "Organization",
              "name": "Continental Express Cargo",
<<<<<<< HEAD
              "url": "https://cec-mg.com",
=======
              "url": "https://continental-express-cargo.com",
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
              "telephone": "+261340725292",
              "email": "cec.sales52@gmail.com"
            },
            "serviceType": "Fret Maritime International",
            "areaServed": [
              {
                "@type": "Country",
                "name": "Chine"
              },
              {
                "@type": "Country", 
                "name": "Madagascar"
              }
            ],
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Services de Transport Maritime",
              "itemListElement": ADVANTAGES.map((advantage, index) => ({
                "@type": "Offer",
                "name": advantage.title,
                "description": advantage.description,
                "position": index + 1
              }))
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5",
              "reviewCount": "100",
              "bestRating": "5",
              "worstRating": "1"
            }
          })
        }}
      />
    </section>
  );
});

export default WhyChooseUs;