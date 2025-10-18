import React, { useEffect, useRef, useState } from 'react';
import { Building2, Users, Target, Award, Globe, Clock, Shield, TrendingUp, Anchor, MapPin, Phone, Mail, Ship, Heart, Lock } from 'lucide-react';

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
      icon: Lock,
      title: 'Confidentialité',
      description: 'Vos informations commerciales et données personnelles sont protégées avec le plus haut niveau de sécurité et de discrétion.'
    },
    {
      icon: Globe,
      title: 'Expertise internationale',
      description: 'Une connaissance approfondie des réglementations et des meilleures pratiques du commerce international.'
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

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
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

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-20">
          <div className="space-y-6 order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-100 rounded-full opacity-50 blur-2xl"></div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-cyan-100 rounded-full opacity-50 blur-2xl"></div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 relative">
                Notre Histoire
              </h2>
            </div>

            <div className="space-y-8">
              <div
                ref={(el) => (sectionRefs.current[0] = el)}
                className={`bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-all duration-700 ${
                  visibleSections.has(0) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Les Origines</h3>
                    <p className="text-base text-gray-700 leading-relaxed">
                      Fondée récemment, <span className="font-bold text-blue-600">CEC – Continental Express Cargo</span> est née d'une demande croissante des clients malgaches pour un service de transport maritime fiable entre la Chine et Madagascar.
                    </p>
                  </div>
                </div>
              </div>

              <div
                ref={(el) => (sectionRefs.current[1] = el)}
                className={`bg-white rounded-2xl p-6 shadow-lg border-l-4 border-cyan-500 hover:shadow-xl transition-all duration-700 delay-100 ${
                  visibleSections.has(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">L'Expertise</h3>
                    <div className="space-y-3">
                      <p className="text-base text-gray-700 leading-relaxed">
                        Derrière cette jeune entreprise se cachent des experts cumulant <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-sm">plus de 18 ans d'expérience</span> dans le fret et la logistique internationale.
                      </p>
                      <p className="text-base text-gray-700 leading-relaxed">
                        Avant CEC, ses fondateurs ont bâti une société de transit reconnue pour son sérieux et son succès auprès des professionnels.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                ref={(el) => (sectionRefs.current[2] = el)}
                className={`bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-all duration-700 delay-200 ${
                  visibleSections.has(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Anchor className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">La Création de CEC</h3>
                    <p className="text-base text-gray-700 leading-relaxed">
                      Forts de cette expérience, ils ont créé CEC pour rendre l'importation depuis la Chine <span className="font-semibold text-green-700">simple, rapide et sécurisée</span>.
                    </p>
                  </div>
                </div>
              </div>

              <div
                ref={(el) => (sectionRefs.current[3] = el)}
                className={`bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 shadow-lg border border-blue-200 transition-all duration-700 delay-300 ${
                  visibleSections.has(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Aujourd'hui</h3>
                    <p className="text-base text-gray-700 leading-relaxed mb-4">
                      CEC propose ses services de <span className="font-semibold">groupage maritime</span>, <span className="font-semibold">d'assistance aux achats en ligne</span> et de <span className="font-semibold">paiement fournisseur</span> dans <span className="inline-flex items-center px-3 py-1 bg-white text-blue-700 font-bold rounded-full text-sm shadow-sm">toutes les provinces de Madagascar</span>.
                    </p>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="text-base text-gray-800 leading-relaxed font-medium">
                        <span className="text-blue-600 font-bold">Notre ambition :</span> être un partenaire de confiance, proche de nos clients, qui leur permet de se concentrer sur leur activité sans se soucier de la logistique.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                ref={(el) => (sectionRefs.current[4] = el)}
                className={`bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-blue-200 transition-all duration-700 delay-500 ${
                  visibleSections.has(4) ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <p className="text-base text-gray-800 leading-relaxed text-center italic">
                  <span className="text-blue-600 font-bold text-lg">"</span>
                  Chaque colis transporté incarne un projet et une ambition, et c'est cette confiance qui guide notre engagement chaque jour.
                  <span className="text-blue-600 font-bold text-lg">"</span>
                </p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-1 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
              <img
                src="/Roll_Up_CEC.jpg"
                alt="Continental Express Cargo"
                className="w-full h-auto rounded-3xl"
              />
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-1 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
              <img
                src="/Partnership_China_CEC.jpg"
                alt="Partenariat Chine CEC"
                className="w-full h-auto rounded-3xl"
              />
            </div>
          </div>
        </div>

        <div className="mb-20 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 lg:p-12 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6 backdrop-blur-sm">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold mb-4">
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

        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-12 mb-20 shadow-2xl text-white">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
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

        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Notre Mission
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des engagements concrets pour simplifier vos importations
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div
              ref={(el) => (sectionRefs.current[5] = el)}
              className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-700 ${
                visibleSections.has(5) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-base text-gray-800 leading-relaxed">
                    Faciliter le commerce entre la Chine et Madagascar grâce à un service maritime fiable et transparent
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={(el) => (sectionRefs.current[6] = el)}
              className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-cyan-500 hover:shadow-xl transition-all duration-700 delay-75 ${
                visibleSections.has(6) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <Ship className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <p className="text-base text-gray-800 leading-relaxed">
                    Simplifier l'importation pour les particuliers, commerçants et entreprises malgaches
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={(el) => (sectionRefs.current[7] = el)}
              className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-all duration-700 delay-150 ${
                visibleSections.has(7) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-base text-gray-800 leading-relaxed">
                    Accompagner nos clients à chaque étape : achat en ligne, paiement fournisseur, groupage maritime et livraison finale
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={(el) => (sectionRefs.current[8] = el)}
<<<<<<< HEAD
              className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-pink-500 hover:shadow-xl transition-all duration-700 delay-225 ${
=======
              className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-all duration-700 delay-225 ${
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
                visibleSections.has(8) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="flex items-start gap-4">
<<<<<<< HEAD
                <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-600" />
=======
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-purple-600" />
>>>>>>> cf6006487c52e715d9e65e259f4485990e3a63ec
                </div>
                <div>
                  <p className="text-base text-gray-800 leading-relaxed">
                    Créer des partenariats durables basés sur la confiance, la proximité et la transparence
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={(el) => (sectionRefs.current[9] = el)}
              className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-all duration-700 delay-300 ${
                visibleSections.has(9) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-base text-gray-800 leading-relaxed">
                    Faire gagner du temps à nos clients pour qu'ils se concentrent sur leur business, pas sur la logistique
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={(el) => (sectionRefs.current[10] = el)}
              className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-teal-500 hover:shadow-xl transition-all duration-700 delay-375 ${
                visibleSections.has(10) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-base text-gray-800 leading-relaxed">
                    Offrir un service complet dans toutes les provinces de Madagascar, sans exception
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Nos Valeurs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Les principes qui guident chacune de nos actions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Icon className="w-7 h-7 text-white" />
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
  );
}
