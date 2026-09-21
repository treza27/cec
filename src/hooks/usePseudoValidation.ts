import { useState, useEffect } from 'react';
import { inventoryService } from '../services/inventoryService';
import { useDebounce } from './useDebounce';

interface PseudoValidationResult {
  isValidating: boolean;
  isValid: boolean | null;
  clientInfo?: {
    id: number;
    nom: string;
    prenom: string;
    pseudo: string;
    telephone: string;
  };
}

export function usePseudoValidation(pseudo: string): PseudoValidationResult {
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [clientInfo, setClientInfo] = useState<PseudoValidationResult['clientInfo']>(undefined);

  const debouncedPseudo = useDebounce(pseudo, 500);

  useEffect(() => {
    const validatePseudo = async () => {
      if (!debouncedPseudo || debouncedPseudo.trim() === '') {
        setIsValid(null);
        setClientInfo(undefined);
        setIsValidating(false);
        return;
      }

      setIsValidating(true);
      try {
        const result = await inventoryService.validatePseudoExists(debouncedPseudo);
        setIsValid(result.exists);
        setClientInfo(result.client);
      } catch (error) {
        console.error('Erreur lors de la validation du pseudo:', error);
        setIsValid(null);
        setClientInfo(undefined);
      } finally {
        setIsValidating(false);
      }
    };

    validatePseudo();
  }, [debouncedPseudo]);

  return { isValidating, isValid, clientInfo };
}
