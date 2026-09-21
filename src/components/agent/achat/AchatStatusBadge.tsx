import React from 'react';
import { StatutDemandeAchat } from '../../../types';

const STATUS_CONFIG: Record<StatutDemandeAchat, { label: string; className: string; dotColor: string }> = {
  'Nouveau': {
    label: 'Nouveau',
    className: 'bg-sky-50 text-sky-700 border border-sky-200',
    dotColor: 'bg-sky-400',
  },
  'En cours d\'analyse': {
    label: 'En cours d\'analyse',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    dotColor: 'bg-amber-400',
  },
  'Action requise': {
    label: 'Action requise',
    className: 'bg-orange-50 text-orange-700 border border-orange-200',
    dotColor: 'bg-orange-500',
  },
  'Devis Prêt': {
    label: 'Devis Prêt',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
    dotColor: 'bg-blue-500',
  },
  'Rejeté': {
    label: 'Rejeté',
    className: 'bg-red-50 text-red-700 border border-red-200',
    dotColor: 'bg-red-400',
  },
  'Payé': {
    label: 'Payé',
    className: 'bg-green-50 text-green-700 border border-green-200',
    dotColor: 'bg-green-500',
  },
  'Acheté': {
    label: 'Acheté',
    className: 'bg-teal-50 text-teal-700 border border-teal-200',
    dotColor: 'bg-teal-500',
  },
};

interface AchatStatusBadgeProps {
  statut: StatutDemandeAchat;
  size?: 'sm' | 'md';
}

export default function AchatStatusBadge({ statut, size = 'md' }: AchatStatusBadgeProps) {
  const config = STATUS_CONFIG[statut] ?? STATUS_CONFIG['Nouveau'];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${sizeClass} ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotColor}`} />
      {config.label}
    </span>
  );
}

export { STATUS_CONFIG };
export type { AchatStatusBadgeProps };
