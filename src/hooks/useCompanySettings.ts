import { useState, useEffect, useCallback } from 'react';
import { CompanySettings } from '../types';
import { companySettingsService } from '../services/companySettingsService';

interface UseCompanySettingsResult {
  settings: CompanySettings | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCompanySettings(): UseCompanySettingsResult {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companySettingsService.get();
      setSettings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, refetch: fetchSettings };
}
