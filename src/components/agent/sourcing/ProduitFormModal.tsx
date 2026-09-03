import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { CatalogueProduit, CatalogueCategorie } from '../../../services/catalogueService';
import { useCreateProduit, useUpdateProduit } from '../../../hooks/useCatalogueProduits';
import { useFournisseurs } from '../../../hooks/useFournisseurs';
import { useCatalogueSousCategories } from '../../../hooks/useCatalogueSousCategories';
import { useCompanySettings } from '../../../hooks/useCompanySettings';
import ProduitPhotoUpload from './ProduitPhotoUpload';

interface Props {
  produit: CatalogueProduit | null;
  categories: CatalogueCategorie[];
  onClose: () => void;
}

function calcPrixTana(
  prixExwRmb: string,
  prixExwUsd: string,
  qtePar: string,
  volPar: string,
  fret: number,
  tauxUsdAr: number,
  tauxRmbAr: number,
  marge1: number,
): number | null {
  const rmb = Number(prixExwRmb);
  const usd = Number(prixExwUsd);
  const qte = Number(qtePar);
  const vol = Number(volPar);

  const hasExw = (prixExwRmb !== '' && rmb > 0) || (prixExwUsd !== '' && usd > 0);
  if (!hasExw || volPar === '' || vol <= 0 || qtePar === '' || qte <= 0) return null;
  if (fret <= 0 || tauxUsdAr <= 0) return null;

  const coutFret = fret * vol * tauxUsdAr;
  const coutExw =
    prixExwRmb !== '' && rmb > 0
      ? rmb * qte * tauxRmbAr
      : usd * qte * tauxUsdAr;

  return Math.round((coutFret + coutExw) * (1 + marge1 / 100));
}

export default function ProduitFormModal({ produit, categories, onClose }: Props) {
  const createMut = useCreateProduit();
  const updateMut = useUpdateProduit();
  const { data: fournisseurs = [] } = useFournisseurs();
  const { settings } = useCompanySettings();

  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [categorieId, setCategorieId] = useState('');
  const [sousCategorieId, setSousCategorieId] = useState('');
  const [codeFournisseur, setCodeFournisseur] = useState('');
  const [prixAriary, setPrixAriary] = useState('');
  const [moq, setMoq] = useState('1');
  const [prixExwRmb, setPrixExwRmb] = useState('');
  const [prixExwUsd, setPrixExwUsd] = useState('');
  const [unite, setUnite] = useState('');
  const [qtePar, setQtePar] = useState('');
  const [volPar, setVolPar] = useState('');
  const [poidsPar, setPoidsPar] = useState('');
  const [actif, setActif] = useState(true);

  const { data: sousCategories = [] } = useCatalogueSousCategories(categorieId || undefined);

  useEffect(() => {
    if (produit) {
      setNom(produit.nom);
      setDescription(produit.description ?? '');
      setCategorieId(produit.categorie_id);
      setSousCategorieId(produit.sous_categorie_id ?? '');
      setCodeFournisseur(produit.code_fournisseur ?? '');
      setPrixAriary(String(produit.prix_ariary));
      setMoq(String(produit.moq));
      setPrixExwRmb(produit.prix_exw_rmb != null ? String(produit.prix_exw_rmb) : '');
      setPrixExwUsd(produit.prix_exw_usd != null ? String(produit.prix_exw_usd) : '');
      setUnite(produit.unite ?? '');
      setQtePar(produit.quantite_par_unite != null ? String(produit.quantite_par_unite) : '');
      setVolPar(produit.volume_par_unite != null ? String(produit.volume_par_unite) : '');
      setPoidsPar(produit.poids_par_unite != null ? String(produit.poids_par_unite) : '');
      setActif(produit.actif);
    } else {
      setNom('');
      setDescription('');
      setCategorieId(categories[0]?.id ?? '');
      setSousCategorieId('');
      setCodeFournisseur('');
      setPrixAriary('');
      setMoq('1');
      setPrixExwRmb('');
      setPrixExwUsd('');
      setUnite('');
      setQtePar('');
      setVolPar('');
      setPoidsPar('');
      setActif(true);
    }
  }, [produit, categories]);

  const canCalc = (() => {
    const fret = settings?.sourcing_fret_usd_cbm ?? 0;
    const tauxUsdAr = settings?.sourcing_taux_usd_ar ?? 0;
    const tauxRmbAr = settings?.sourcing_taux_rmb_ar ?? 0;
    const marge1 = settings?.sourcing_marge_1 ?? 0;
    return calcPrixTana(prixExwRmb, prixExwUsd, qtePar, volPar, fret, tauxUsdAr, tauxRmbAr, marge1) !== null;
  })();

  const handleCalculer = () => {
    const fret = settings?.sourcing_fret_usd_cbm ?? 0;
    const tauxUsdAr = settings?.sourcing_taux_usd_ar ?? 0;
    const tauxRmbAr = settings?.sourcing_taux_rmb_ar ?? 0;
    const marge1 = settings?.sourcing_marge_1 ?? 0;
    const result = calcPrixTana(prixExwRmb, prixExwUsd, qtePar, volPar, fret, tauxUsdAr, tauxRmbAr, marge1);
    if (result !== null) setPrixAriary(String(result));
  };

  const isValid = nom.trim() && categorieId && prixAriary !== '' && Number(prixAriary) >= 0 && Number(moq) >= 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    const payload = {
      categorie_id: categorieId,
      sous_categorie_id: sousCategorieId || null,
      nom: nom.trim(),
      description: description.trim() || undefined,
      code_fournisseur: codeFournisseur.trim() || undefined,
      prix_ariary: Number(prixAriary),
      moq: Number(moq),
      prix_exw_rmb: prixExwRmb !== '' ? Number(prixExwRmb) : undefined,
      prix_exw_usd: prixExwUsd !== '' ? Number(prixExwUsd) : undefined,
      unite: unite.trim() || undefined,
      quantite_par_unite: qtePar !== '' ? Number(qtePar) : undefined,
      volume_par_unite: volPar !== '' ? Number(volPar) : undefined,
      poids_par_unite: poidsPar !== '' ? Number(poidsPar) : undefined,
      actif,
    };
    if (produit) {
      await updateMut.mutateAsync({ id: produit.id, payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">{produit ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Auto-generated fields (read-only, edit mode only) */}
          {produit && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Numéro</p>
                <p className="text-sm font-mono font-semibold text-gray-700">#{produit.numero}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Référence produit</p>
                <p className="text-sm font-mono font-semibold text-blue-700">{produit.reference_produit ?? '—'}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nom */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
              <input
                value={nom}
                onChange={e => setNom(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Ventilateur industriel 50cm"
              />
            </div>

            {/* Categorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
              <select
                value={categorieId}
                onChange={e => { setCategorieId(e.target.value); setSousCategorieId(''); }}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choisir --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>

            {/* Sous-categorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sous-catégorie</label>
              <select
                value={sousCategorieId}
                onChange={e => setSousCategorieId(e.target.value)}
                disabled={!categorieId || sousCategories.length === 0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">— Aucune sous-catégorie —</option>
                {sousCategories.map(sc => (
                  <option key={sc.id} value={sc.id}>{sc.nom}</option>
                ))}
              </select>
              {categorieId && sousCategories.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">Aucune sous-catégorie pour cette catégorie.</p>
              )}
            </div>

            {/* Code fournisseur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code fournisseur</label>
              <select
                value={codeFournisseur}
                onChange={e => setCodeFournisseur(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Aucun fournisseur —</option>
                {fournisseurs.map(f => (
                  <option key={f.id} value={f.code_fournisseur ?? ''}>
                    {f.code_fournisseur} — {f.nom_usine}
                  </option>
                ))}
              </select>
            </div>

            {/* Prix Ariary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix rendu Tana (Ar) *</label>
              <input
                type="number"
                min="0"
                value={prixAriary}
                onChange={e => setPrixAriary(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 250000"
              />
              <button
                type="button"
                onClick={handleCalculer}
                disabled={!canCalc}
                className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Calculer depuis EXW
              </button>
            </div>

            {/* MOQ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MOQ (qté minimum) *</label>
              <input
                type="number"
                min="1"
                value={moq}
                onChange={e => setMoq(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Prix EXW RMB */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix EXW (RMB ¥)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={prixExwRmb}
                onChange={e => setPrixExwRmb(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 65"
              />
            </div>

            {/* Prix EXW USD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix EXW (USD $)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={prixExwUsd}
                onChange={e => setPrixExwUsd(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 9.50"
              />
            </div>

            {/* Unite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
              <input
                value={unite}
                onChange={e => setUnite(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Carton, Pièce"
              />
            </div>

            {/* Quantite par unite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité / Unité</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={qtePar}
                onChange={e => setQtePar(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 10"
              />
            </div>

            {/* Volume par unite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volume / Unité (m³)</label>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={volPar}
                onChange={e => setVolPar(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 0.31"
              />
            </div>

            {/* Poids par unite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poids / Unité (kg)</label>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={poidsPar}
                onChange={e => setPoidsPar(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 12.5"
              />
            </div>

            {/* Visible */}
            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="actif"
                checked={actif}
                onChange={e => setActif(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="actif" className="text-sm font-medium text-gray-700">Produit visible dans le catalogue</label>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Décrivez le produit, ses caractéristiques, son utilisation..."
              />
            </div>
          </div>

          {produit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
              <ProduitPhotoUpload produitId={produit.id} />
            </div>
          )}

          {!produit && (
            <p className="text-xs text-gray-400">Les photos pourront être ajoutées après la création du produit.</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isValid || isPending}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Enregistrement...' : (produit ? 'Enregistrer' : 'Créer le produit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
