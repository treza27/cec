import { z } from 'zod';

export const inventorySchema = z.object({
  dateEntree: z.string().min(1, 'La date d\'entrée est requise'),
  numRecu: z.string().optional(),
  entrepot: z.enum(['Guangzhou', 'Yiwu'], {
    errorMap: () => ({ message: 'Veuillez sélectionner un entrepôt valide' })
  }).optional(),
  shippingMark: z.string().optional(),
  description: z.string().min(1, 'La description est requise'),
  nbPalettes: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0 && Number.isInteger(Number(val)),
    'Le nombre de palettes doit être un nombre entier positif'
  ),
  nbCartons: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 1 && Number.isInteger(Number(val)),
    'Le nombre de cartons doit être un nombre entier (minimum 1)'
  ),
  poids: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Le poids doit être un nombre positif'
  ),
  volume: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Le volume doit être un nombre positif'
  ),
  nature: z.enum(['GG', 'SG', 'DG'], {
    errorMap: () => ({ message: 'Veuillez sélectionner une nature valide' })
  }).optional(),
  msds: z.boolean().optional(),
  statut: z.string().optional()
});

export type InventoryFormData = z.infer<typeof inventorySchema>;