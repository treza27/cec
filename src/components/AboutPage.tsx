import React, { useEffect, useRef, useState } from 'react';
import { Building2, Users, Target, Award, Globe, Clock, Shield, Phone, Mail, Ship } from 'lucide-react';
import SEO from './SEO';

export default function AboutPage() {
  const stats = [
    { label: 'Années d\'expérience', value: '18+', icon: Award },
    { label: 'Tracking temps réel', value: '24h/7j', icon: Clock },
    { label: 'Entreprises partenaires', value: '20+', icon: Users }
  ];

  const values = [
    {
      icon: Shield,
      title: 'Fiabilité',
      description: 'Nous garantissons la sécurité et l\'intégrité de vos marchandises tout au long du processus d\'expédition.'
    },
    {
      icon: Target,
      title: 'Engagement',
      description: 'Notre engagement envers l\'excellence se traduit par un service de qualité et un suivi rigoureux de chaque envoi.'
    },
    {
      icon: Globe,
      title: 'Expertise internationale',
      description: 'Une connaissance approfondie des réglementations et des meilleures pratiques du commerce international.'
    },
    {
      icon: Ship,
      title: 'Proximité',
      description: 'Un accompagnement personnalisé et une présence dans toutes les provinces de Madagascar pour mieux vous servir.'
    }
  ];

  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = sectionRefs.current.map((ref, index) => {
      if (!ref) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleSections((prev) => new Set(prev).add(index));
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Continental Express Cargo',
    description: 'Spécialiste du transport maritime entre la Chine et Madagascar depuis plus de 18 ans. Fret groupage LCL, conteneur complet FCL, dédouanement et livraison dans toutes les provinces malgaches.',
    url: 'https://continentalexpresscargo.com',
    logo: 'https://continentalexpresscargo.com/Logo.jpg',
    image: 'https://continentalexpresscargo.com/Partnership_China_CEC.jpg',
    telephone: '+261340725292',
    email: 'cec.sales52@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Lot IVW 4 Bis, Anosizato Est',
      addressLocality: 'Antananarivo',
      addressCountry: 'MG',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:30',
      closes: '17:00',
    },
    sameAs: ['https://www.facebook.com/continentalexpresscargo'],
  };

  return (
    <>
      <SEO
        title="À propos de Continental Express Cargo — Transport Chine-Madagascar"
        description="Découvrez Continental Express Cargo, spécialiste du transport maritime entre la Chine et Madagascar depuis plus de 18 ans. Expertise, fiabilité et engagement pour vos importations."
        canonical="/about"
        ogImage="/Partnership_China_CEC.jpg"
        schema={localBusinessSchema}
      />
    <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 shadow-lg">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            À propos de nous
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Votre partenaire de confiance pour le transport de marchandises entre la Chine et Madagascar
          </p>
        </div>

        <div
          ref={(el) => (sectionRefs.current[0] = el)}
          className={`grid lg:grid-cols-2 gap-12 items-center mb-32 transition-all duration-700 ${
            visibleSections.has(0) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Notre Histoire
            </h2>
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Les Origines</h3>
              <p className="text-base text-gray-700 leading-relaxed">
                Fondée récemment, <span className="font-bold text-blue-600">CEC – Continental Express Cargo</span> est née d'une demande croissante des clients malgaches pour un service de transport maritime fiable entre la Chine et Madagascar.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-cyan-500">
              <h3 className="text-xl font-bold text-gray-900 mb-3">L'Expertise</h3>
              <p className="text-base text-gray-700 leading-relaxed mb-3">
                Derrière cette jeune entreprise se cachent des experts cumulant <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-sm">plus de 18 ans d'expérience</span> dans le fret et la logistique internationale.
              </p>
              <p className="text-base text-gray-700 leading-relaxed">
                Avant CEC, ses fondateurs ont bâti une société de transit reconnue pour son sérieux et son succès auprès des professionnels.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/Roll_Up_CEC.jpg"
                alt="Continental Express Cargo"
                className="w-full h-auto"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/Partnership_China_CEC.jpg"
                alt="Partenariat Chine CEC"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        <div
          ref={(el) => (sectionRefs.current[1] = el)}
          className={`grid lg:grid-cols-2 gap-12 items-center mb-32 transition-all duration-700 ${
            visibleSections.has(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="space-y-6 order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/Entrepot_Chine_CEC.jpg"
                alt="Entrepôt Chine CEC"
                className="w-full h-auto"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="/Chargement_Chine_CEC.jpg"
                  alt="Chargement Chine CEC"
                  className="w-full h-auto"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="/Chargement_Chine_CEC2.jpg"
                  alt="Chargement Chine CEC2"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
          <div className="space-y-6 order-1 lg:order-2">
            <h2 className="text-3xl font-bold text-gray-900">
              Nos Débuts
            </h2>
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-gray-900 mb-3">La Création de CEC</h3>
              <p className="text-base text-gray-700 leading-relaxed">
                Forts de cette expérience, ils ont créé CEC pour rendre l'importation depuis la Chine <span className="font-semibold text-blue-700">simple, rapide et sécurisée</span>.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 shadow-lg border-l-4 border-cyan-500">
              <p className="text-base text-gray-800 leading-relaxed italic">
                <span className="text-blue-600 font-bold text-lg">"</span>
                Chaque colis transporté incarne un projet et une ambition, et c'est cette confiance qui guide notre engagement chaque jour.
                <span className="text-blue-600 font-bold text-lg">"</span>
              </p>
            </div>
          </div>
        </div>

        <div
          ref={(el) => (sectionRefs.current[2] = el)}
          className={`grid lg:grid-cols-2 gap-12 items-center mb-32 transition-all duration-700 ${
            visibleSections.has(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Aujourd'hui
            </h2>
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
              <p className="text-base text-gray-700 leading-relaxed mb-4">
                CEC propose ses services de <span className="font-semibold">groupage maritime</span>, <span className="font-semibold">d'assistance aux achats en ligne</span> et de <span className="font-semibold">paiement fournisseur</span> dans <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-sm">toutes les provinces de Madagascar</span>.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 shadow-lg text-white">
              <p className="text-base leading-relaxed font-medium">
                <span className="font-bold">Notre ambition :</span> être un partenaire de confiance, proche de nos clients, qui leur permet de se concentrer sur leur activité sans se soucier de la logistique.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/Depotage_CEC.jpg"
                alt="Depotage CEC"
                className="w-full h-auto"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/Foire_Mahamasina_2025.jpg"
                alt="Foire Mahamasina 2025"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        <div className="mb-32 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 lg:p-12 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6 backdrop-blur-sm">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4">
                Prêt à simplifier votre logistique internationale ?
              </h3>
              <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                Contactez-nous dès aujourd'hui pour faciliter votre business avec un service d'expédition maritime transparent et professionnel.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#contact" className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-blue-50 hover:scale-105 transition-all duration-300">
                  <Phone className="w-5 h-5" />
                  Nous Appeler
                </a>
                <a href="#contact" className="inline-flex items-center justify-center gap-2 bg-blue-500/30 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg border-2 border-white/30 hover:bg-blue-500/50 hover:scale-105 transition-all duration-300">
                  <Mail className="w-5 h-5" />
                  Nous Écrire
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-12 mb-32 shadow-2xl text-white">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Notre Impact en Chiffres
            </h2>
            <p className="text-xl text-blue-100">
              Des résultats qui témoignent de notre engagement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl mb-6 backdrop-blur-sm group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-5xl lg:text-6xl font-bold mb-3">
                    {stat.value}
                  </div>
                  <div className="text-blue-50 text-base lg:text-lg font-medium">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          ref={(el) => (sectionRefs.current[3] = el)}
          className={`mb-32 transition-all duration-700 ${
            visibleSections.has(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Notre Mission
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des engagements concrets pour simplifier vos importations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-7 h-7 text-blue-600" />
                </div>
                <p className="text-base text-gray-800 leading-relaxed">
                  Faciliter le commerce entre la Chine et Madagascar grâce à un service maritime fiable et transparent
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-cyan-500 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <Ship className="w-7 h-7 text-cyan-600" />
                </div>
                <p className="text-base text-gray-800 leading-relaxed">
                  Accompagner nos clients à chaque étape : achat, paiement, groupage et livraison
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
                <p className="text-base text-gray-800 leading-relaxed">
                  Créer des partenariats durables basés sur la confiance et la transparence
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-cyan-500 hover:shadow-xl transition-shadow">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-7 h-7 text-cyan-600" />
                </div>
                <p className="text-base text-gray-800 leading-relaxed">
                  Faire gagner du temps pour vous concentrer sur votre business, pas la logistique
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={(el) => (sectionRefs.current[4] = el)}
          className={`transition-all duration-700 ${
            visibleSections.has(4) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nos Valeurs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Les principes qui guident chacune de nos actions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {values.map((value, index) => {
              const Icon = value.icon;
              const isBlue = index % 2 === 0;
              return (
                <div key={index} className={`bg-white rounded-2xl shadow-lg p-8 border-l-4 ${isBlue ? 'border-blue-500' : 'border-cyan-500'} hover:shadow-xl transition-shadow`}>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-14 h-14 ${isBlue ? 'bg-blue-100' : 'bg-cyan-100'} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-7 h-7 ${isBlue ? 'text-blue-600' : 'text-cyan-600'}`} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {value.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
    </>
  );
}
