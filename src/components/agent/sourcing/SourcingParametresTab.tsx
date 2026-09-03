import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, DollarSign, TrendingUp, Ship } from 'lucide-react';
import { useCompanySettings } from '../../../hooks/useCompanySettings';
import { companySettingsService } from '../../../services/companySettingsService';
import toast from 'react-hot-toast';

function NumericField({
  label,
  value,
  onChange,
  step = '0.01',
  unit,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  unit?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative flex items-center">
        <input
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
          placeholder="0"
        />
        {unit && (
          <span className="absolute right-3 text-xs font-medium text-gray-400 select-none">{unit}</span>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function SourcingParametresTab() {
  const { settings, loading, refetch } = useCompanySettings();
  const [saving, setSaving] = useState(false);

  const [fret, setFret] = useState('');
  const [tauxUsdAr, setTauxUsdAr] = useState('');
  const [tauxRmbAr, setTauxRmbAr] = useState('');
  const [tauxRmbUsd, setTauxRmbUsd] = useState('');
  const [marge1, setMarge1] = useState('');
  const [marge2, setMarge2] = useState('');
  const [marge3, setMarge3] = useState('');

  useEffect(() => {
    if (!settings) return;
    setFret(settings.sourcing_fret_usd_cbm != null ? String(settings.sourcing_fret_usd_cbm) : '');
    setTauxUsdAr(settings.sourcing_taux_usd_ar != null ? String(settings.sourcing_taux_usd_ar) : '');
    setTauxRmbAr(settings.sourcing_taux_rmb_ar != null ? String(settings.sourcing_taux_rmb_ar) : '');
    setTauxRmbUsd(settings.sourcing_taux_rmb_usd != null ? String(settings.sourcing_taux_rmb_usd) : '');
    setMarge1(settings.sourcing_marge_1 != null ? String(settings.sourcing_marge_1) : '');
    setMarge2(settings.sourcing_marge_2 != null ? String(settings.sourcing_marge_2) : '');
    setMarge3(settings.sourcing_marge_3 != null ? String(settings.sourcing_marge_3) : '');
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await companySettingsService.upsert({
        sourcing_fret_usd_cbm: fret !== '' ? Number(fret) : null,
        sourcing_taux_usd_ar: tauxUsdAr !== '' ? Number(tauxUsdAr) : null,
        sourcing_taux_rmb_ar: tauxRmbAr !== '' ? Number(tauxRmbAr) : null,
        sourcing_taux_rmb_usd: tauxRmbUsd !== '' ? Number(tauxRmbUsd) : null,
        sourcing_marge_1: marge1 !== '' ? Number(marge1) : null,
        sourcing_marge_2: marge2 !== '' ? Number(marge2) : null,
        sourcing_marge_3: marge3 !== '' ? Number(marge3) : null,
      });
      toast.success('Paramètres enregistrés');
      refetch();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Fret */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Ship className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Coût de fret</h3>
        </div>
        <NumericField
          label="Fret maritime (USD / CBM)"
          value={fret}
          onChange={setFret}
          step="0.01"
          unit="USD/CBM"
          hint="Coût moyen du fret par mètre cube de conteneur"
        />
      </div>

      {/* Taux de change */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-green-50 rounded-lg">
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Taux de change</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumericField
            label="USD → Ariary"
            value={tauxUsdAr}
            onChange={setTauxUsdAr}
            step="1"
            unit="Ar"
            hint="1 USD = ? Ar"
          />
          <NumericField
            label="RMB → Ariary"
            value={tauxRmbAr}
            onChange={setTauxRmbAr}
            step="1"
            unit="Ar"
            hint="1 ¥ = ? Ar"
          />
          <NumericField
            label="RMB → USD"
            value={tauxRmbUsd}
            onChange={setTauxRmbUsd}
            step="0.0001"
            unit="USD"
            hint="1 ¥ = ? USD"
          />
        </div>
      </div>

      {/* Marges */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-amber-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">Niveaux de marge</h3>
          <span className="text-xs text-gray-400 font-normal ml-1">Appliqués au prix de revient pour calculer le prix catalogue</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumericField
            label="Marge 1"
            value={marge1}
            onChange={setMarge1}
            step="0.1"
            unit="%"
          />
          <NumericField
            label="Marge 2"
            value={marge2}
            onChange={setMarge2}
            step="0.1"
            unit="%"
          />
          <NumericField
            label="Marge 3"
            value={marge3}
            onChange={setMarge3}
            step="0.1"
            unit="%"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Recharger
        </button>
      </div>
    </div>
  );
}
