import { z } from 'zod';

export const departureSchema = z.object({
  numBL: z.string().min(1, 'Le numéro BL est requis'),
  numTC: z.string().optional(),
  dateChargement: z.string().optional(),
  dateDepartChine: z.string().optional(),
  dateArriveTamatave: z.string().optional(),
  dateArriveTana: z.string().optional(),
  dateReceptionColis: z.string().optional(),
  statut: z.enum([
    'preparation_depart',
    'conteneur_charge',
    'depart_chine',
    'arrivee_toamasina',
    'dedouanement_en_cours',
    'arrivee_antananarivo',
    'decharge_trie'
  ]).optional(),
  colisAssocies: z.array(z.number()).optional()
});

export type DepartureFormData = z.infer<typeof departureSchema>;