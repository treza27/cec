import React, { useState, useRef, useCallback } from 'react';
import { X, Image, Search, Loader2, Plus, Trash2, UserPlus, User } from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { useDebounce } from '../../hooks/useDebounce';
import { achatService, DemandeAchatFormData } from '../../services/achatService';
import { achatArticleService } from '../../services/achatArticleService';
import { clientService } from '../../services/clientService';
import { ClientWithShippingMarks } from '../../types';
import { validatePhoneNumber } from '../../utils/clientValidation';
import { autoOptimizeImage } from '../../utils/imageOptimization';

interface DemandeAchatFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ArticleRow {
  localId: string;
  nom_article: string;
  quantite: number;
  remarques: string;
  photoFile: File | null;
  photoPreview: string | null;
}

function makeRow(): ArticleRow {
  return {
    localId: `row_${Date.now()}_${Math.random()}`,
    nom_article: '',
    quantite: 1,
    remarques: '',
    photoFile: null,
    photoPreview: null,
  };
}

type ClientMode = 'existing' | 'new';

export default function DemandeAchatForm({ onSuccess, onCancel }: DemandeAchatFormProps) {
  const { clients } = useClients();

  const [clientMode, setClientMode] = useState<ClientMode>('new');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientWithShippingMarks | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [newClientNom, setNewClientNom] = useState('');
  const [newClientPseudo, setNewClientPseudo] = useState('');
  const [newClientTelephone, setNewClientTelephone] = useState('');

  const [remarquesGlobales, setRemarquesGlobales] = useState('');
  const [articles, setArticles] = useState<ArticleRow[]>([makeRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const debouncedSearch = useDebounce(clientSearch, 200);

  const filteredClients = clients.filter(c => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return true;
    return (
      c.nom?.toLowerCase().includes(q) ||
      c.prenom.toLowerCase().includes(q) ||
      c.pseudo?.toLowerCase().includes(q) ||
      c.entreprise?.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  const handleSelectClient = (client: ClientWithShippingMarks) => {
    setSelectedClient(client);
    setClientSearch(`${client.prenom}${client.nom ? ' ' + client.nom : ''} (${client.pseudo})`);
    setShowClientDropdown(false);
  };

  const updateArticle = (localId: string, field: keyof ArticleRow, value: unknown) => {
    setArticles(prev => prev.map(a => a.localId === localId ? { ...a, [field]: value } : a));
  };

  const handlePhotoChange = useCallback((localId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateArticle(localId, 'photoPreview', ev.target?.result as string);
    reader.readAsDataURL(file);
    updateArticle(localId, 'photoFile', file);
  }, []);

  const handleRemovePhoto = useCallback((localId: string) => {
    updateArticle(localId, 'photoFile', null);
    updateArticle(localId, 'photoPreview', null);
    const input = fileInputRefs.current[localId];
    if (input) input.value = '';
  }, []);

  const addArticle = () => {
    setArticles(prev => [...prev, makeRow()]);
  };

  const removeArticle = (localId: string) => {
    if (articles.length <= 1) return;
    setArticles(prev => prev.filter(a => a.localId !== localId));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (clientMode === 'existing') {
      if (!selectedClient) newErrors.client = 'Veuillez sélectionner un client';
    } else {
      if (!newClientNom.trim()) newErrors.newClientNom = 'Le nom est obligatoire';
      if (!newClientTelephone.trim()) {
        newErrors.newClientTelephone = 'Le téléphone est obligatoire';
      } else {
        const phoneValidation = validatePhoneNumber(newClientTelephone);
        if (!phoneValidation.isValid) newErrors.newClientTelephone = phoneValidation.error!;
      }
    }

    articles.forEach((a, i) => {
      if (!a.nom_article.trim()) newErrors[`nom_${i}`] = 'Obligatoire';
      if (!a.quantite || a.quantite < 1) newErrors[`qte_${i}`] = 'Min 1';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let clientId: number;

      if (clientMode === 'new') {
        const nameParts = newClientNom.trim().split(/\s+/);
        const prenom = nameParts[0];
        const nom = nameParts.slice(1).join(' ') || undefined;

        const pseudo = newClientPseudo.trim() || `${prenom.toLowerCase().replace(/[^a-z0-9]/g, '')}${nom ? nom.toLowerCase().replace(/[^a-z0-9]/g, '') : ''}`;

        const newClient = await clientService.create({
          prenom,
          nom,
          pseudo,
          telephone: newClientTelephone.trim(),
          statut_contact: 'Prospect',
          shipping_marks: [],
        });
        clientId = newClient.id;
      } else {
        clientId = selectedClient!.id;
      }

      const firstArticle = articles[0];
      let firstPhotoUrl: string | null = null;
      if (firstArticle.photoFile) {
        const optimized = await autoOptimizeImage(firstArticle.photoFile, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
        firstPhotoUrl = await achatService.uploadPhoto(optimized);
      }

      const formData: DemandeAchatFormData = {
        client_id: clientId,
        nom_article: firstArticle.nom_article.trim(),
        photo_url: firstPhotoUrl,
        lien_exemple: null,
        quantite: firstArticle.quantite,
        remarques: remarquesGlobales.trim() || null,
      };

      const demande = await achatService.create(formData);

      for (let i = 0; i < articles.length; i++) {
        const a = articles[i];
        let photoUrl: string | null = null;
        if (a.photoFile) {
          const optimized = await autoOptimizeImage(a.photoFile, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
          photoUrl = await achatArticleService.uploadPhoto(optimized, demande.id);
        }
        await achatArticleService.create({
          demande_achat_id: demande.id,
          nom_article: a.nom_article.trim(),
          lien_achat: null,
          photo_url: photoUrl,
          quantite: a.quantite,
          ordre: i,
        });
      }

      onSuccess();
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Nouvelle Demande d'Achat</h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Client section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client <span className="text-red-500">*</span>
        </label>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => { setClientMode('new'); setSelectedClient(null); setClientSearch(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors font-medium ${
              clientMode === 'new'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Nouveau client
          </button>
          <button
            type="button"
            onClick={() => { setClientMode('existing'); setNewClientNom(''); setNewClientTelephone(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors font-medium ${
              clientMode === 'existing'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Client existant
          </button>
        </div>

        {/* New client form */}
        {clientMode === 'new' && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
            <p className="text-xs text-gray-500">Le client sera créé en tant que <span className="font-semibold text-gray-700">Prospect</span>.</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newClientNom}
                onChange={(e) => setNewClientNom(e.target.value)}
                placeholder="Ex: Jean Dupont"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.newClientNom ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
              />
              {errors.newClientNom && <p className="text-xs text-red-600 mt-1">{errors.newClientNom}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Pseudo <span className="text-gray-400 font-normal">(facultatif)</span>
                </label>
                <input
                  type="text"
                  value={newClientPseudo}
                  onChange={(e) => setNewClientPseudo(e.target.value)}
                  placeholder="Ex: jean.dupont"
                  className="w-full px-3 py-2 text-sm border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newClientTelephone}
                  onChange={(e) => setNewClientTelephone(e.target.value)}
                  placeholder="+261 34 12 345 67"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.newClientTelephone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                />
                {errors.newClientTelephone && <p className="text-xs text-red-600 mt-1">{errors.newClientTelephone}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Existing client search */}
        {clientMode === 'existing' && (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setSelectedClient(null);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Rechercher un client..."
                className={`w-full pl-9 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.client ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.client && <p className="text-xs text-red-600 mt-1">{errors.client}</p>}

            {showClientDropdown && !selectedClient && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    Aucun client trouvé
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">
                            {client.prenom}{client.nom ? ' ' + client.nom : ''}
                          </span>
                          <span className="ml-2 text-sm text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                            {client.pseudo}
                          </span>
                        </div>
                        {client.statut_contact && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            client.statut_contact === 'Client Or'
                              ? 'bg-amber-100 text-amber-700'
                              : client.statut_contact === 'Client Argent'
                              ? 'bg-slate-100 text-slate-700'
                              : client.statut_contact === 'Client Bronze'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {client.statut_contact}
                          </span>
                        )}
                      </div>
                      {client.telephone && (
                        <p className="text-xs text-gray-500 mt-0.5">{client.telephone}</p>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedClient && (
              <div className="mt-2 flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {selectedClient.prenom[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedClient.prenom} {selectedClient.nom || ''}
                  </p>
                  <p className="text-xs text-gray-500">{selectedClient.pseudo} · {selectedClient.telephone || 'Pas de tél.'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedClient(null); setClientSearch(''); }}
                  className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Articles */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Articles <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-gray-400">{articles.length} article{articles.length > 1 ? 's' : ''}</span>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid bg-gray-50 border-b border-gray-200 px-3 py-2" style={{ gridTemplateColumns: '1fr 72px 52px 36px' }}>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Nom de l'article <span className="text-red-500">*</span>
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Qté <span className="text-red-500">*</span></span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Photo</span>
            <span />
          </div>

          {articles.map((article, idx) => (
            <div key={article.localId} className="border-b border-gray-100 last:border-0">
              <div className="grid items-center gap-2 px-3 py-2" style={{ gridTemplateColumns: '1fr 72px 52px 36px' }}>
                <div>
                  <input
                    type="text"
                    value={article.nom_article}
                    onChange={(e) => updateArticle(article.localId, 'nom_article', e.target.value)}
                    placeholder="Ex: Chaussures Nike Air Max"
                    className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`nom_${idx}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors[`nom_${idx}`] && <p className="text-xs text-red-600 mt-0.5">{errors[`nom_${idx}`]}</p>}
                </div>

                <div>
                  <input
                    type="number"
                    min="1"
                    value={article.quantite}
                    onChange={(e) => updateArticle(article.localId, 'quantite', parseInt(e.target.value) || 1)}
                    className={`w-full px-2 py-1.5 text-sm border rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`qte_${idx}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-center">
                  {article.photoPreview ? (
                    <div className="relative">
                      <img
                        src={article.photoPreview}
                        alt="Aperçu"
                        onClick={() => fileInputRefs.current[article.localId]?.click()}
                        className="w-9 h-9 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        title="Changer la photo"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(article.localId)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Supprimer la photo"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[article.localId]?.click()}
                      className="w-9 h-9 border border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                      title="Ajouter une photo"
                    >
                      <Image className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                    </button>
                  )}
                  <input
                    ref={el => { fileInputRefs.current[article.localId] = el; }}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(article.localId, e)}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeArticle(article.localId)}
                    disabled={articles.length <= 1}
                    className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 disabled:opacity-0 disabled:pointer-events-none transition-colors rounded"
                    title="Supprimer cet article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addArticle}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors border-t border-dashed border-blue-200"
          >
            <Plus className="w-4 h-4" />
            Ajouter un article
          </button>
        </div>
      </div>

      {/* Remarques globales */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Remarques globales <span className="text-gray-400 font-normal">(facultatif)</span>
        </label>
        <textarea
          value={remarquesGlobales}
          onChange={(e) => setRemarquesGlobales(e.target.value)}
          rows={3}
          placeholder="Instructions générales, délais, contraintes particulières..."
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errors.submit}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Création...' : `Créer la demande${articles.length > 1 ? ` (${articles.length} articles)` : ''}`}
        </button>
      </div>
    </form>
  );
}
