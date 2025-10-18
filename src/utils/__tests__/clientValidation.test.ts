import { describe, it, expect } from 'vitest';

// Fonctions utilitaires pour la validation des clients
export const validateClientData = (clientData: {
  nom: string;
  prenom: string;
  entreprise?: string;
  telephone?: string;
  shipping_marks: string[];
}) => {
  const errors: string[] = [];

  // Validation du nom
  if (!clientData.nom || clientData.nom.trim().length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères');
  }

  // Validation du prénom
  if (!clientData.prenom || clientData.prenom.trim().length < 2) {
    errors.push('Le prénom doit contenir au moins 2 caractères');
  }

  // Validation du téléphone (optionnel mais format si fourni)
  if (clientData.telephone && clientData.telephone.trim()) {
    const phoneRegex = /^(\+261|0)[0-9]{9}$/;
    if (!phoneRegex.test(clientData.telephone.replace(/\s/g, ''))) {
      errors.push('Format de téléphone invalide (ex: +261341234567)');
    }
  }

  // Validation des shipping marks
  if (clientData.shipping_marks.length === 0) {
    errors.push('Au moins une shipping mark est requise');
  }

  // Vérifier les doublons dans les shipping marks
  const uniqueMarks = new Set(clientData.shipping_marks.map(mark => mark.trim().toUpperCase()));
  if (uniqueMarks.size !== clientData.shipping_marks.length) {
    errors.push('Les shipping marks doivent être uniques');
  }

  // Vérifier le format des shipping marks
  clientData.shipping_marks.forEach((mark, index) => {
    if (!mark || mark.trim().length < 3) {
      errors.push(`La shipping mark ${index + 1} doit contenir au moins 3 caractères`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatShippingMark = (mark: string): string => {
  return mark.trim().toUpperCase();
};

export const formatPhoneNumber = (phone: string): string => {
  // Supprimer tous les espaces et caractères non numériques sauf +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ajouter +261 si le numéro commence par 0
  if (cleaned.startsWith('0')) {
    return '+261' + cleaned.substring(1);
  }
  
  return cleaned;
};

describe('Client Validation Utils', () => {
  describe('validateClientData', () => {
    it('should validate correct client data', () => {
      const validClient = {
        nom: 'Rakoto',
        prenom: 'Jean',
        entreprise: 'Test SARL',
        telephone: '+261341234567',
        shipping_marks: ['JR2024001', 'JR2024002']
      };

      const result = validateClientData(validClient);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject client with short name', () => {
      const invalidClient = {
        nom: 'A',
        prenom: 'Jean',
        shipping_marks: ['TEST001']
      };

      const result = validateClientData(invalidClient);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Le nom doit contenir au moins 2 caractères');
    });

    it('should reject client with no shipping marks', () => {
      const invalidClient = {
        nom: 'Rakoto',
        prenom: 'Jean',
        shipping_marks: []
      };

      const result = validateClientData(invalidClient);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Au moins une shipping mark est requise');
    });

    it('should reject duplicate shipping marks', () => {
      const invalidClient = {
        nom: 'Rakoto',
        prenom: 'Jean',
        shipping_marks: ['TEST001', 'test001'] // Doublons (insensible à la casse)
      };

      const result = validateClientData(invalidClient);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Les shipping marks doivent être uniques');
    });

    it('should reject invalid phone format', () => {
      const invalidClient = {
        nom: 'Rakoto',
        prenom: 'Jean',
        telephone: '123', // Format invalide
        shipping_marks: ['TEST001']
      };

      const result = validateClientData(invalidClient);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Format de téléphone invalide (ex: +261341234567)');
    });
  });

  describe('formatShippingMark', () => {
    it('should format shipping mark correctly', () => {
      expect(formatShippingMark('  test001  ')).toBe('TEST001');
      expect(formatShippingMark('jr2024001')).toBe('JR2024001');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format phone number correctly', () => {
      expect(formatPhoneNumber('034 12 34 567')).toBe('+261341234567');
      expect(formatPhoneNumber('+261 34 12 34 567')).toBe('+261341234567');
      expect(formatPhoneNumber('0341234567')).toBe('+261341234567');
    });
  });
});