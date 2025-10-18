// Fonctions utilitaires pour la validation des clients

export const validateClientData = (clientData: {
  nom: string;
  prenom: string;
  pseudo: string;
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

  // Validation du pseudo
  if (!clientData.pseudo || clientData.pseudo.trim().length < 3) {
    errors.push('Le pseudo doit contenir au moins 3 caractères');
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

// Validation en temps réel pour le pseudo
export const validatePseudo = (pseudo: string): { isValid: boolean; error?: string } => {
  const trimmed = pseudo.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Le pseudo ne peut pas être vide' };
  }
  
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Le pseudo doit contenir au moins 3 caractères' };
  }
  
  if (trimmed.length > 30) {
    return { isValid: false, error: 'Le pseudo ne peut pas dépasser 30 caractères' };
  }
  
  // Vérifier les caractères autorisés (lettres, chiffres, espaces, tirets)
  const allowedCharsRegex = /^[A-Za-z0-9\s\-]+$/;
  if (!allowedCharsRegex.test(trimmed)) {
    return { isValid: false, error: 'Seuls les lettres, chiffres, espaces et tirets sont autorisés' };
  }
  
  return { isValid: true };
};

// Validation en temps réel pour les shipping marks
export const validateShippingMark = (mark: string): { isValid: boolean; error?: string } => {
  const trimmed = mark.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'La shipping mark ne peut pas être vide' };
  }
  
  if (trimmed.length < 3) {
    return { isValid: false, error: 'La shipping mark doit contenir au moins 3 caractères' };
  }
  
  if (trimmed.length > 50) {
    return { isValid: false, error: 'La shipping mark ne peut pas dépasser 50 caractères' };
  }
  
  // Vérifier les caractères autorisés (lettres, chiffres, tirets, underscores)
  const allowedCharsRegex = /^[A-Za-z0-9_-]+$/;
  if (!allowedCharsRegex.test(trimmed)) {
    return { isValid: false, error: 'Seuls les lettres, chiffres, tirets et underscores sont autorisés' };
  }
  
  return { isValid: true };
};

// Validation en temps réel pour les téléphones
export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || phone.trim().length === 0) {
    return { isValid: true }; // Téléphone optionnel
  }
  
  const cleaned = phone.replace(/\s/g, '');
  const phoneRegex = /^(\+261|0)[0-9]{9}$/;
  
  if (!phoneRegex.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'Format invalide. Utilisez +261341234567 ou 0341234567' 
    };
  }
  
  return { isValid: true };
};