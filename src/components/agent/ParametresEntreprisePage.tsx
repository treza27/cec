import React, { useState, useEffect, useRef } from 'react';
import { Save, Loader2, Building2, Phone, Mail, Globe, FileText, Upload, X, Image, Lock } from 'lucide-react';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { companySettingsService } from '../../services/companySettingsService';
import { CompanySettings } from '../../types';
import toast from 'react-hot-toast';

type FormData = Omit<CompanySettings, 'id' | 'created_at' | 'updated_at'>;

export default function ParametresEntreprisePage() {
  const { settings, loading, refetch } = useCompanySettings();
  const [form, setForm] = useState<FormData>({
    nom_entreprise: '',
    adresse: '',
    telephone: '',
    email: '',
    site_web: '',
    num_stat: '',
    num_nif: '',
    num_rcs: '',
    logo_url: null,
    conditions_paiement: '',
    mentions_legales: '',
    signature_devis: '',
    upload_code: 'TPL',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        nom_entreprise: settings.nom_entreprise ?? '',
        adresse: settings.adresse ?? '',
        telephone: settings.telephone ?? '',
        email: settings.email ?? '',
        site_web: settings.site_web ?? '',
        num_stat: settings.num_stat ?? '',
        num_nif: settings.num_nif ?? '',
        num_rcs: settings.num_rcs ?? '',
        logo_url: settings.logo_url ?? null,
        conditions_paiement: settings.conditions_paiement ?? '',
        mentions_legales: settings.mentions_legales ?? '',
        signature_devis: settings.signature_devis ?? '',
        upload_code: settings.upload_code ?? 'TPL',
      });
    }
  }, [settings]);

  const handleChange = (field: keyof FormData, value: string | null) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (file: File) => {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setForm(prev => ({ ...prev, logo_url: null }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let logoUrl = form.logo_url;

      if (logoFile) {
        setUploadingLogo(true);
        logoUrl = await companySettingsService.uploadLogo(logoFile);
        setUploadingLogo(false);
        setLogoFile(null);
        setLogoPreview(null);
      }

      await companySettingsService.upsert({ ...form, logo_url: logoUrl });
      toast.success('Paramètres sauvegardés !');
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const currentLogo = logoPreview || form.logo_url;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres de l'entreprise</h1>
          <p className="text-sm text-gray-500 mt-1">Ces informations apparaîtront sur les devis générés.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer
        </button>
      </div>

      {/* Logo */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Image className="w-4 h-4" />
          Logo de l'entreprise
        </h2>
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {currentLogo ? (
              <div className="relative group">
                <img
                  src={currentLogo}
                  alt="Logo"
                  className="w-28 h-28 object-contain rounded-xl border border-gray-200 bg-gray-50 p-2"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                <Building2 className="w-8 h-8 mb-1" />
                <span className="text-xs">Aucun logo</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {currentLogo ? 'Changer le logo' : 'Téléverser un logo'}
            </button>
            <p className="text-xs text-gray-400">PNG, JPG ou SVG · Recommandé : 400×400 px</p>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoChange(file);
              }}
            />
          </div>
        </div>
      </div>

      {/* Informations générales */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Informations générales
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Nom de l'entreprise *</label>
            <input
              type="text"
              value={form.nom_entreprise}
              onChange={(e) => handleChange('nom_entreprise', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: CEC Madagascar"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Adresse complète *</label>
            <textarea
              value={form.adresse}
              onChange={(e) => handleChange('adresse', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Numéro, rue, quartier, ville, pays"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Téléphone *
            </label>
            <input
              type="tel"
              value={form.telephone}
              onChange={(e) => handleChange('telephone', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+261 XX XX XXX XX"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="contact@exemple.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3" /> Site web
            </label>
            <input
              type="url"
              value={form.site_web ?? ''}
              onChange={(e) => handleChange('site_web', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://www.exemple.com"
            />
          </div>
        </div>
      </div>

      {/* Informations légales */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Informations légales
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Numéro STAT</label>
            <input
              type="text"
              value={form.num_stat ?? ''}
              onChange={(e) => handleChange('num_stat', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="STAT..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Numéro NIF</label>
            <input
              type="text"
              value={form.num_nif ?? ''}
              onChange={(e) => handleChange('num_nif', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="NIF..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Numéro RCS</label>
            <input
              type="text"
              value={form.num_rcs ?? ''}
              onChange={(e) => handleChange('num_rcs', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="RCS..."
            />
          </div>
        </div>
      </div>

      {/* Textes devis */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Textes du devis
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Conditions de paiement</label>
            <textarea
              value={form.conditions_paiement ?? ''}
              onChange={(e) => handleChange('conditions_paiement', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Ex: Paiement à la commande. Arrhes de 50% à la validation du devis..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mentions légales (pied de page)</label>
            <textarea
              value={form.mentions_legales ?? ''}
              onChange={(e) => handleChange('mentions_legales', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Ex: Ce devis est valable 30 jours. Les prix sont indiqués en Ariary (MGA)..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Formule de signature</label>
            <textarea
              value={form.signature_devis ?? ''}
              onChange={(e) => handleChange('signature_devis', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Ex: Dans l'attente de votre confirmation, veuillez agréer nos cordiales salutations."
            />
          </div>
        </div>
      </div>

      {/* Sécurité - Upload photos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Sécurité — Upload photos
        </h2>
        <p className="text-xs text-gray-400">
          Ce code protège l'accès à la page publique d'envoi de photos. Les visiteurs devront le saisir avant de pouvoir uploader.
        </p>
        <div className="max-w-xs">
          <label className="block text-xs font-medium text-gray-500 mb-1">Code d'accès</label>
          <input
            type="text"
            value={form.upload_code}
            onChange={(e) => handleChange('upload_code', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono tracking-widest"
            placeholder="Ex: TPL"
          />
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer les paramètres
        </button>
      </div>
    </div>
  );
}
