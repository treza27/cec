import { supabase } from '../utils/supabase';
import { CompanySettings } from '../types';

export const companySettingsService = {
  async get(): Promise<CompanySettings | null> {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  async upsert(updates: Partial<Omit<CompanySettings, 'id' | 'created_at' | 'updated_at'>>): Promise<CompanySettings> {
    const { data, error } = await supabase
      .from('company_settings')
      .upsert({ id: 1, ...updates }, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async uploadLogo(file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const filePath = `company-logo/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('achat-photos')
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage
      .from('achat-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },
};
