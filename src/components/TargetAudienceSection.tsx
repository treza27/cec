import React, { memo } from 'react';
import { Store, Building2, User, ShoppingBag } from 'lucide-react';

const AUDIENCES = [
  {
    icon: Store,
    title: 'Commerçants & Revendeurs',
    description: 'Vous importez des marchandises depuis la Chine pour les revendre à Madagascar. Nous gérons vos envois groupés ou conteneurs complets avec des délais maîtrisés.',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: Building2,
    title: 'Entreprises & Industries',
    description: 'Matières premières, équipements industriels ou fournitures en grande quantité — nous adaptons nos solutions logistiques à vos volumes et contraintes professionnelles.',
    color: 'from-sky-500 to-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
  },
  {
    icon: ShoppingBag,
    title: 'Acheteurs en foire',
    description: "Vous assistez aux foires commerciales chinoises (Canton Fair, etc.) et avez besoin d'un partenaire fiable pour rapatrier vos achats. Nous vous accompagnons de A à Z.",
    color: 'from-teal-500 to-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
  },
  {
    icon: User,
    title: 'Particuliers',
    description: 'Vous souhaitez faire venir des colis personnels ou des achats en ligne depuis la Chine ? Notre service LCL est accessible aux particuliers avec un suivi en temps réel.',
    color: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
  },
];

const TargetAudienceSection = memo(() => {
  return (
    <section className="py-14 bg-gradient-to-b from-[#1a3a6b] to-[#0f2554]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold tracking-widest text-blue-300 uppercase mb-3">
            Nos clients
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            À qui s'adressent nos services ?
          </h2>
          <p className="text-blue-200 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Que vous soyez professionnel ou particulier, nous disposons d'une solution adaptée à vos besoins d'import depuis la Chine vers Madagascar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {AUDIENCES.map(({ icon: Icon, title, description, color, bg, border }) => (
            <div
              key={title}
              className={`rounded-2xl border ${border} ${bg} p-6 flex flex-col gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md flex-shrink-0`}>
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-1">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

TargetAudienceSection.displayName = 'TargetAudienceSection';

export default TargetAudienceSection;
