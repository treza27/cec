import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check, Building2 } from 'lucide-react';
import { useFournisseurs, useCreateFournisseur, useUpdateFournisseur, useDeleteFournisseur } from '../../../hooks/useFournisseurs';
import { useCatalogueCategories } from '../../../hooks/useCatalogueCategories';
import { CatalogueFournisseur } from '../../../services/fournisseurService';

export default function FournisseursManager() {
  const { data: fournisseurs = [], isLoading } = useFournisseurs();
  const { data: categories = [] } = useCatalogueCategories();
  const createMut = useCreateFournisseur();
  const updateMut = useUpdateFournisseur();
  const deleteMut = useDeleteFournisseur();

  const [modalData, setModalData] = useState<CatalogueFournisseur | null | false>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setModalData(null)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau fournisseur
        </button>
      </div>

      {fournisseurs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun fournisseur enregistré</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Numéro</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Code fournisseur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Catégorie</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Nom d'usine</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Téléphone / WeChat</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Ville</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[220px]">Adresse</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fournisseurs.map((f, idx) => {
                const catNom = categories.find(c => c.id === f.categorie_id)?.nom ?? '—';
                return (
                  <tr
                    key={f.id}
                    className={`transition-colors hover:bg-blue-50/40 ${idx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-mono font-semibold text-gray-700">{f.numero ?? '—'}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {f.code_fournisseur ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {f.categorie_id ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium whitespace-nowrap">
                          {catNom}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{f.nom_usine}</td>
                    <td className="px-4 py-2.5 text-gray-600">{f.contact || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{f.telephone_wechat || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{f.ville || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs max-w-[240px]">
                      <span className="line-clamp-2">{f.adresse || <span className="text-gray-300">—</span>}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModalData(f)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {deleteConfirmId === f.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-red-600 font-medium whitespace-nowrap">Confirmer ?</span>
                            <button
                              onClick={() => { deleteMut.mutate(f.id); setDeleteConfirmId(null); }}
                              className="px-2 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                            >
                              Oui
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
                            >
                              Non
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(f.id)}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalData !== false && (
        <FournisseurModal
          fournisseur={modalData}
          categories={categories}
          onClose={() => setModalData(false)}
          onCreate={createMut.mutateAsync}
          onUpdate={(id, payload) => updateMut.mutateAsync({ id, payload })}
          isPending={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  );
}

interface ModalProps {
  fournisseur: CatalogueFournisseur | null;
  categories: { id: string; nom: string }[];
  onClose: () => void;
  onCreate: (payload: Parameters<typeof import('../../../services/fournisseurService').fournisseurService.createFournisseur>[0]) => Promise<unknown>;
  onUpdate: (id: string, payload: Partial<Omit<CatalogueFournisseur, 'id' | 'numero' | 'code_fournisseur' | 'created_at' | 'updated_at' | 'catalogue_categories'>>) => Promise<unknown>;
  isPending: boolean;
}

function FournisseurModal({ fournisseur, categories, onClose, onCreate, onUpdate, isPending }: ModalProps) {
  const [categorieId, setCategorieId] = useState('');
  const [nomUsine, setNomUsine] = useState('');
  const [contact, setContact] = useState('');
  const [tel, setTel] = useState('');
  const [ville, setVille] = useState('');
  const [adresse, setAdresse] = useState('');

  useEffect(() => {
    if (fournisseur) {
      setCategorieId(fournisseur.categorie_id ?? '');
      setNomUsine(fournisseur.nom_usine);
      setContact(fournisseur.contact ?? '');
      setTel(fournisseur.telephone_wechat ?? '');
      setVille(fournisseur.ville ?? '');
      setAdresse(fournisseur.adresse ?? '');
    } else {
      setCategorieId('');
      setNomUsine('');
      setContact('');
      setTel('');
      setVille('');
      setAdresse('');
    }
  }, [fournisseur]);

  const isValid = nomUsine.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    const payload = {
      categorie_id: categorieId || null,
      nom_usine: nomUsine.trim(),
      contact: contact.trim() || undefined,
      telephone_wechat: tel.trim() || undefined,
      ville: ville.trim() || undefined,
      adresse: adresse.trim() || undefined,
    };
    if (fournisseur) {
      await onUpdate(fournisseur.id, payload);
    } else {
      await onCreate(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {fournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
            </h2>
            {fournisseur && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono font-semibold text-gray-500">{fournisseur.numero}</span>
                <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  {fournisseur.code_fournisseur}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'usine *</label>
              <input
                value={nomUsine}
                onChange={e => setNomUsine(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Shower Set Factory"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={categorieId}
                onChange={e => setCategorieId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Sans catégorie —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
              {!fournisseur && (
                <p className="text-xs text-gray-400 mt-1">Le code fournisseur sera généré selon la catégorie.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
              <input
                value={contact}
                onChange={e => setContact(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Rebecca"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone / WeChat</label>
              <input
                value={tel}
                onChange={e => setTel(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: +86 138..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                value={ville}
                onChange={e => setVille(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Yiwu"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <textarea
                value={adresse}
                onChange={e => setAdresse(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Ex: 义乌国际商贸城2区，30号门，F4-19290"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isValid || isPending}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Enregistrement...' : (fournisseur ? 'Enregistrer' : 'Ajouter le fournisseur')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
