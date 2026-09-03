import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Truck, Package, ArrowLeft, Ship, Calendar, MapPin, Users, CreditCard as Edit, Save, X, FileText, Warehouse, Building, Receipt, ChevronDown, ChevronUp, Trash2, AlertTriangle, Calculator, TrendingUp, CircleDollarSign } from 'lucide-react';
import { useDepartures } from '../../hooks/useDepartures';
import { useInventory } from '../../hooks/useInventory';
import { useNotesDebit, useAllNotesDebit } from '../../hooks/useNotesDebit';
import { useBonsLivraison } from '../../hooks/useBonsLivraison';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { getDepartureStatusLabel, getDepartureStatusColor, getInventoryStatusColor } from '../../utils/statusHelpers';
import NoteDebitConfigModal from './livraison/NoteDebitConfigModal';
import NoteDebitDocumentModal from './livraison/NoteDebitDocumentModal';
import BonLivraisonConfigModal from './livraison/BonLivraisonConfigModal';
import BonLivraisonDocumentModal from './livraison/BonLivraisonDocumentModal';
import { NoteDebit, NoteDebitColisDetail, NoteDebitCreateData, NoteDebitUpdateData } from '../../services/noteDebitService';
import { BonLivraison, BonLivraisonCreateData } from '../../services/bonLivraisonService';
import { inventoryService } from '../../services/inventoryService';
import toast from 'react-hot-toast';
import { useEmployeeProfileContext } from '../../contexts/EmployeeProfileContext';

export default function LivraisonEnlevementPage() {
  const { profileData } = useEmployeeProfileContext();
  const isAdmin = profileData?.role === 'administrateur';
  const { items: departItems, loading: departLoading, error: departError } = useDepartures();
  const { items: inventoryItems, loading: inventoryLoading, updateItem, isUpdating, refreshItems } = useInventory();
  const [selectedDepartId, setSelectedDepartId] = useState<number | null>(null);
  const [editingColisId, setEditingColisId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<string>('');
  const [editingPickupChoice, setEditingPickupChoice] = useState<string>('');
  const [editingPickupChoiceId, setEditingPickupChoiceId] = useState<number | null>(null);

  const [showNoteDebitConfig, setShowNoteDebitConfig] = useState(false);
  const [showNoteDebitDocument, setShowNoteDebitDocument] = useState(false);
  const [currentNoteDebit, setCurrentNoteDebit] = useState<NoteDebit | null>(null);
  const [showNotesDebitHistory, setShowNotesDebitHistory] = useState(false);
  const [editingNoteDebit, setEditingNoteDebit] = useState<NoteDebit | null>(null);

  const [showBonLivraisonConfig, setShowBonLivraisonConfig] = useState(false);
  const [showBonLivraisonDocument, setShowBonLivraisonDocument] = useState(false);
  const [currentBonLivraison, setCurrentBonLivraison] = useState<BonLivraison | null>(null);
  const [showBonsLivraisonHistory, setShowBonsLivraisonHistory] = useState(false);

  const { notesDebit, loading: notesDebitLoading, createNote, isCreating: isCreatingNote, deleteNote, updateNote, isUpdating: isUpdatingNote } = useNotesDebit(selectedDepartId || 0);
  const { allNotesDebit } = useAllNotesDebit();
  const { bonsLivraison, loading: bonsLivraisonLoading, createBon, isCreating: isCreatingBon, deleteBon } = useBonsLivraison(selectedDepartId || 0);
  const { settings: companySettings } = useCompanySettings();

  const loading = departLoading || inventoryLoading;

  const notesDebitByDepartId = useMemo(() => {
    const map = new Map<number, typeof allNotesDebit>();
    for (const note of allNotesDebit) {
      const arr = map.get(note.depart_id) || [];
      arr.push(note);
      map.set(note.depart_id, arr);
    }
    return map;
  }, [allNotesDebit]);

  const getContreMesureTotals = useCallback((colis: import('../../types').InventoryItem[]) => {
    return colis.reduce((acc, c) => ({
      nbPalettes: acc.nbPalettes + (parseInt(c.nbPalettesTana || c.nbPalettes || '0') || 0),
      nbCartons: acc.nbCartons + (parseInt(c.nbCartonsTana || c.nbCartons || '0') || 0),
      poids: acc.poids + (parseFloat(c.poidsTana || c.poids || '0') || 0),
      volume: acc.volume + (parseFloat(c.volumeTana || c.volume || '0') || 0),
    }), { nbPalettes: 0, nbCartons: 0, poids: 0, volume: 0 });
  }, []);

  const getFactureTotals = useCallback((departId: number) => {
    const notes = notesDebitByDepartId.get(departId) || [];
    const facturedColisIds = new Set(notes.flatMap(note => note.colis_details.map(detail => Number(detail.id))));
    return notes.reduce((acc, note) => ({
      nbPalettes: acc.nbPalettes + note.colis_details.reduce((s, d) => s + (d.nbPalettes || 0), 0),
      nbCartons: acc.nbCartons + note.colis_details.reduce((s, d) => s + (d.nbCartons || 0), 0),
      poids: acc.poids + note.colis_details.reduce((s, d) => s + (d.poidsTana || 0), 0),
      volume: acc.volume + (note.volume_total_tana || 0),
      montant: acc.montant + (note.montant_total_ariary || 0),
      count: acc.count + 1,
      colis: facturedColisIds.size,
    }), { nbPalettes: 0, nbCartons: 0, poids: 0, volume: 0, montant: 0, count: 0, colis: 0 });
  }, [notesDebitByDepartId]);

  const [extraColis, setExtraColis] = useState<import('../../types').InventoryItem[]>([]);
  const [extraColisLoading, setExtraColisLoading] = useState(false);

  useEffect(() => {
    if (!selectedDepartId) {
      setExtraColis([]);
      return;
    }
    const depart = departItems.find(d => d.id === selectedDepartId);
    if (!depart) {
      setExtraColis([]);
      return;
    }
    const idSet = new Set(depart.colisAssocies.map(Number));
    const foundIds = new Set(inventoryItems.filter(item => idSet.has(Number(item.id))).map(item => Number(item.id)));
    const missingIds = depart.colisAssocies.map(Number).filter(id => !foundIds.has(id));
    if (missingIds.length === 0) {
      setExtraColis([]);
      return;
    }
    setExtraColisLoading(true);
    inventoryService.getByIds(missingIds)
      .then(items => setExtraColis(items))
      .catch(() => setExtraColis([]))
      .finally(() => setExtraColisLoading(false));
  }, [selectedDepartId, departItems, inventoryItems]);

  const getColisForDepart = useCallback((departId: number) => {
    const depart = departItems.find(d => d.id === departId);
    if (!depart) return [];
    const idSet = new Set(depart.colisAssocies.map(Number));
    const fromInventory = inventoryItems.filter(item => idSet.has(Number(item.id)));
    const foundIds = new Set(fromInventory.map(item => Number(item.id)));
    const fromExtra = extraColis.filter(item => idSet.has(Number(item.id)) && !foundIds.has(Number(item.id)));
    return [...fromInventory, ...fromExtra];
  }, [departItems, inventoryItems, extraColis]);

  const getColisCountForDepart = (departId: number) => {
    const depart = departItems.find(d => d.id === departId);
    if (!depart) return 0;
    return depart.colisAssocies.length;
  };

  const enrichNoteDebit = useCallback((note: NoteDebit): NoteDebit => {
    if (!note.colis_details || note.colis_details.length === 0) return note;
    const colisMap = new Map<number, import('../../types').InventoryItem>();
    for (const item of [...inventoryItems, ...extraColis]) {
      colisMap.set(Number(item.id), item);
    }
    const enrichedDetails = note.colis_details.map((d) => {
      const colis = colisMap.get(Number(d.id));
      if (!colis) return d;
      const nbCartonsTana = colis.nbCartonsTana ? parseInt(colis.nbCartonsTana, 10) || 0 : 0;
      const nbPalettesTana = colis.nbPalettesTana ? parseInt(colis.nbPalettesTana, 10) || 0 : 0;
      const nbCartonsOrig = colis.nbCartons ? parseInt(colis.nbCartons, 10) || 0 : 0;
      const nbPalettesOrig = colis.nbPalettes ? parseInt(colis.nbPalettes, 10) || 0 : 0;
      return {
        ...d,
        trackingNumber: d.trackingNumber || colis.trackingNumber || '',
        nbCartons: d.nbCartons ?? (nbCartonsTana || nbCartonsOrig || 0),
        nbPalettes: d.nbPalettes ?? (nbPalettesTana || nbPalettesOrig || 0),
      };
    });
    return { ...note, colis_details: enrichedDetails };
  }, [inventoryItems, extraColis]);

  const getDepartureCardStyle = (statut: string) => {
    switch (statut) {
      case 'preparation_depart':
        return { bgGradient: 'from-gray-100 via-gray-50 to-white', borderColor: 'border-gray-300', iconBg: 'bg-gray-100', iconColor: 'text-gray-600' };
      case 'conteneur_charge':
        return { bgGradient: 'from-orange-100 via-orange-50 to-white', borderColor: 'border-orange-300', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' };
      case 'depart_chine':
        return { bgGradient: 'from-blue-100 via-blue-50 to-white', borderColor: 'border-blue-300', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' };
      case 'arrivee_toamasina':
        return { bgGradient: 'from-cyan-100 via-cyan-50 to-white', borderColor: 'border-cyan-300', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' };
      case 'dedouanement_en_cours':
        return { bgGradient: 'from-yellow-100 via-yellow-50 to-white', borderColor: 'border-yellow-300', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' };
      case 'arrivee_antananarivo':
        return { bgGradient: 'from-teal-100 via-teal-50 to-white', borderColor: 'border-teal-300', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' };
      case 'decharge_trie':
        return { bgGradient: 'from-green-100 via-green-50 to-white', borderColor: 'border-green-300', iconBg: 'bg-green-100', iconColor: 'text-green-600' };
      default:
        return { bgGradient: 'from-gray-100 via-gray-50 to-white', borderColor: 'border-gray-300', iconBg: 'bg-gray-100', iconColor: 'text-gray-600' };
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'preparation_depart': return Package;
      case 'conteneur_charge': return Truck;
      case 'depart_chine': return Ship;
      case 'arrivee_toamasina':
      case 'dedouanement_en_cours': return MapPin;
      case 'arrivee_antananarivo':
      case 'decharge_trie': return Truck;
      default: return Package;
    }
  };

  const getPackageStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      'en_attente_confirmation': 'En attente de confirmation',
      'enregistre_chine': 'Enregistré en Chine',
      'charge_expedition': 'Chargé pour l\'expédition',
      'en_route_madagascar': 'En route vers Madagascar',
      'arrive_toamasina': 'Arrivé au port de Toamasina',
      'dedouanement_cours': 'En cours de dédouanement',
      'arrive_antananarivo': 'Arrivé à Antananarivo',
      'pret_livraison_enlevement': 'Prêt pour livraison/enlèvement',
      'en_cours_livraison': 'En cours de livraison',
      'livre': 'Livré'
    };
    return statusLabels[status] || status;
  };

  const [locationFilter, setLocationFilter] = useState<'all' | 'depot_anosizato' | 'bureaux_ambodivona' | 'unassigned'>('all');

  const allAssociatedColis = selectedDepartId ? getColisForDepart(selectedDepartId) : [];

  const locationCounts = useMemo(() => ({
    depot: allAssociatedColis.filter(c => c.point_enlevement_souhaite === 'depot_anosizato').length,
    office: allAssociatedColis.filter(c => c.point_enlevement_souhaite === 'bureaux_ambodivona').length,
    unassigned: allAssociatedColis.filter(c => !c.point_enlevement_souhaite).length,
  }), [allAssociatedColis]);

  const handleEditStatus = (colisId: number, currentStatus: string) => {
    setEditingColisId(colisId);
    setEditingStatus(currentStatus);
  };

  const handleSaveStatus = async (colisId: number) => {
    try {
      await updateItem(colisId, { statut: editingStatus });
      toast.success('Statut mis à jour avec succès !');
      setEditingColisId(null);
      setEditingStatus('');
    } catch (error: any) {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingColisId(null);
    setEditingStatus('');
  };

  const handleEditPickupChoice = (colisId: number, currentChoice: string) => {
    setEditingPickupChoiceId(colisId);
    setEditingPickupChoice(currentChoice || '');
  };

  const handleSavePickupChoice = async (colisId: number) => {
    try {
      await updateItem(colisId, { point_enlevement_souhaite: editingPickupChoice || null });
      toast.success('Choix du point d\'enlèvement enregistré !');
      setEditingPickupChoiceId(null);
      setEditingPickupChoice('');
    } catch (error: any) {
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
    }
  };

  const handleCancelPickupChoice = () => {
    setEditingPickupChoiceId(null);
    setEditingPickupChoice('');
  };

  const handleGenerateNoteDebit = async (data: NoteDebitCreateData, _details: NoteDebitColisDetail[]) => {
    try {
      const created = await createNote(data);
      setCurrentNoteDebit(enrichNoteDebit(created));
      setShowNoteDebitConfig(false);
      setShowNoteDebitDocument(true);
    } catch {
      // error handled by hook
    }
  };

  const handleEditNoteDebit = async (id: number, data: NoteDebitUpdateData, _details: NoteDebitColisDetail[]) => {
    try {
      const updated = await updateNote({ id, data });
      setEditingNoteDebit(null);
      setShowNoteDebitConfig(false);
      setCurrentNoteDebit(enrichNoteDebit(updated));
      setShowNoteDebitDocument(true);
    } catch {
      // error handled by hook
    }
  };

  const handleDeleteBonLivraison = async (bon: BonLivraison) => {
    if (bon.colis_ids && bon.colis_ids.length > 0) {
      try {
        await inventoryService.updateStatus(bon.colis_ids, 'en_cours_livraison');
        refreshItems();
      } catch {
        toast.error('Erreur lors de la remise du statut des colis');
        return;
      }
    }
    deleteBon(bon.id);
  };

  const handleGenerateBonLivraison = async (data: BonLivraisonCreateData) => {
    try {
      const created = await createBon(data);
      if (data.update_status_to_livre && data.colis_ids.length > 0) {
        try {
          await inventoryService.updateStatus(data.colis_ids, 'livre');
          refreshItems();
        } catch {
          toast.error('Bon créé mais erreur lors de la mise à jour du statut des colis');
        }
      }
      setCurrentBonLivraison(created);
      setShowBonLivraisonConfig(false);
      setShowBonLivraisonDocument(true);
    } catch {
      // error handled by hook
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement...</span>
      </div>
    );
  }

  if (departError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erreur: {departError}</p>
      </div>
    );
  }

  if (selectedDepartId) {
    const selectedDepart = departItems.find(d => d.id === selectedDepartId);
    const associatedColis = allAssociatedColis;
    const filteredColis = locationFilter === 'all'
      ? associatedColis
      : locationFilter === 'unassigned'
        ? associatedColis.filter(c => !c.point_enlevement_souhaite)
        : associatedColis.filter(c => c.point_enlevement_souhaite === locationFilter);

    if (!selectedDepart) {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSelectedDepartId(null)} className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Retour aux départs</span>
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-600">Départ non trouvé</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button onClick={() => setSelectedDepartId(null)} className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors w-fit">
              <ArrowLeft className="w-5 h-5" />
              <span>Retour aux départs</span>
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Départ #{selectedDepart.id} - {selectedDepart.numBL}
              </h2>
              <p className="text-gray-600">{filteredColis.length} colis associés</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setEditingNoteDebit(null); setShowNoteDebitConfig(true); }}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <Receipt className="w-4 h-4" />
              <span>Note de Débit</span>
            </button>
            <button
              onClick={() => setShowBonLivraisonConfig(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700"
            >
              <FileText className="w-4 h-4" />
              <span>Bon de Livraison</span>
            </button>
          </div>
        </div>

        {/* Badge d'alerte pour colis sans contre-mesures */}
        {allAssociatedColis.filter(c => !c.nbCartonsTana && !c.poidsTana && !c.volumeTana).length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800">Contre-mesures manquantes</h3>
                <p className="text-xs text-red-700 mt-1">
                  {allAssociatedColis.filter(c => !c.nbCartonsTana && !c.poidsTana && !c.volumeTana).length} colis n'ont pas de contre-mesures enregistrées. Veuillez effectuer les contre-mesures avant de générer une note de débit ou un bon de livraison.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Informations du départ */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Date chargement</p>
                <p className="font-medium">{selectedDepart.dateChargement ? new Date(selectedDepart.dateChargement).toLocaleDateString('fr-FR') : 'Non défini'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Ship className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Départ Chine</p>
                <p className="font-medium">{selectedDepart.dateDepartChine ? new Date(selectedDepart.dateDepartChine).toLocaleDateString('fr-FR') : 'Non défini'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-cyan-600" />
              <div>
                <p className="text-sm text-gray-500">Arrivée Tana</p>
                <p className="font-medium">{selectedDepart.dateArriveTana ? new Date(selectedDepart.dateArriveTana).toLocaleDateString('fr-FR') : 'Non défini'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDepartureStatusColor(selectedDepart.statut)}`}>
                {getDepartureStatusLabel(selectedDepart.statut)}
              </span>
            </div>
          </div>
        </div>

        {/* Panneau de comparaison Contre-mesure vs Facturé */}
        {(() => {
          const cmTotals = getContreMesureTotals(allAssociatedColis);
          const facTotals = getFactureTotals(selectedDepart.id);
          const volRestant = cmTotals.volume - facTotals.volume;
          const pctFacture = cmTotals.volume > 0 ? Math.min(100, (facTotals.volume / cmTotals.volume) * 100) : 0;
          return (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Calculator className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">Contre-mesure vs Facturé</h3>
                <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                  <Receipt className="w-3.5 h-3.5" />
                  {facTotals.count} note{facTotals.count > 1 ? 's' : ''} de débit
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Contre-mesure totale */}
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-teal-600" />
                    <span className="text-sm font-semibold text-teal-800">Contre-mesure totale</span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Palettes</span><span className="font-bold text-gray-900">{cmTotals.nbPalettes}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Cartons</span><span className="font-bold text-gray-900">{cmTotals.nbCartons.toLocaleString('fr-FR')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Colis</span><span className="font-bold text-gray-900">{allAssociatedColis.length.toLocaleString('fr-FR')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Poids</span><span className="font-bold text-gray-900">{cmTotals.poids.toFixed(1)} kg</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Volume</span><span className="font-bold text-teal-700">{cmTotals.volume.toFixed(3)} m³</span></div>
                  </div>
                </div>

                {/* Facturé */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CircleDollarSign className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">Facturé (notes de débit)</span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Palettes</span><span className="font-bold text-gray-900">{facTotals.nbPalettes}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Cartons</span><span className="font-bold text-gray-900">{facTotals.nbCartons.toLocaleString('fr-FR')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Colis</span><span className="font-bold text-gray-900">{facTotals.colis.toLocaleString('fr-FR')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Poids</span><span className="font-bold text-gray-900">{facTotals.poids.toFixed(1)} kg</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Volume</span><span className="font-bold text-blue-700">{facTotals.volume.toFixed(3)} m³</span></div>
                  </div>
                </div>

                {/* Restant à facturer */}
                <div className={`rounded-xl border p-4 ${volRestant > 0.001 ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className={`w-4 h-4 ${volRestant > 0.001 ? 'text-orange-600' : 'text-green-600'}`} />
                    <span className={`text-sm font-semibold ${volRestant > 0.001 ? 'text-orange-800' : 'text-green-800'}`}>Restant à facturer</span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Palettes</span><span className="font-bold text-gray-900">{Math.max(0, cmTotals.nbPalettes - facTotals.nbPalettes)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Cartons</span><span className="font-bold text-gray-900">{Math.max(0, cmTotals.nbCartons - facTotals.nbCartons).toLocaleString('fr-FR')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Colis</span><span className="font-bold text-gray-900">{Math.max(0, allAssociatedColis.length - facTotals.colis).toLocaleString('fr-FR')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Poids</span><span className="font-bold text-gray-900">{Math.max(0, cmTotals.poids - facTotals.poids).toFixed(1)} kg</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Volume</span><span className={`font-bold ${volRestant > 0.001 ? 'text-orange-700' : 'text-green-700'}`}>{Math.max(0, volRestant).toFixed(3)} m³</span></div>
                  </div>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-2">
                  <span>Progression de la facturation</span>
                  <span className={pctFacture >= 100 ? 'text-green-600' : pctFacture > 0 ? 'text-blue-600' : 'text-gray-400'}>
                    {pctFacture.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${pctFacture >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${pctFacture}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Location Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLocationFilter('all')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${locationFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <Package className="w-4 h-4" />
              <span>Tous ({allAssociatedColis.length})</span>
            </button>
            <button
              onClick={() => setLocationFilter('depot_anosizato')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${locationFilter === 'depot_anosizato' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <Warehouse className="w-4 h-4" />
              <span>Dépôt Anosizato ({locationCounts.depot})</span>
            </button>
            <button
              onClick={() => setLocationFilter('bureaux_ambodivona')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${locationFilter === 'bureaux_ambodivona' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <Building className="w-4 h-4" />
              <span>Bureaux Ambodivona ({locationCounts.office})</span>
            </button>
            <button
              onClick={() => setLocationFilter('unassigned')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${locationFilter === 'unassigned' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <MapPin className="w-4 h-4" />
              <span>À assigner ({locationCounts.unassigned})</span>
            </button>
          </div>
        </div>

        {/* Historique des Bons de Livraison */}
        {(bonsLivraison.length > 0 || bonsLivraisonLoading) && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setShowBonsLivraisonHistory(!showBonsLivraisonHistory)}
              className="w-full px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Bons de Livraison ({bonsLivraison.length})</span>
              </div>
              {showBonsLivraisonHistory ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {showBonsLivraisonHistory && (
              <div className="divide-y divide-gray-100">
                {bonsLivraisonLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-500">Chargement...</span>
                  </div>
                ) : (
                  bonsLivraison.map((bon) => (
                    <div key={bon.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Truck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{bon.reference}</p>
                            {bon.client_nom && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {bon.client_nom}
                              </span>
                            )}
                            {bon.is_partial && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                Partiel
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(bon.created_at).toLocaleDateString('fr-FR')} · {bon.colis_ids.length} colis · {Number(bon.volume_total_livre).toFixed(3)} m³ · {Number(bon.poids_total_livre).toFixed(1)} kg
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setCurrentBonLivraison(bon); setShowBonLivraisonDocument(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Réimprimer
                        </button>
                        <button
                          onClick={() => handleDeleteBonLivraison(bon)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Historique des Notes de Débit */}
        {(notesDebit.length > 0 || notesDebitLoading) && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setShowNotesDebitHistory(!showNotesDebitHistory)}
              className="w-full px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Notes de Débit ({notesDebit.length})</span>
              </div>
              {showNotesDebitHistory ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {showNotesDebitHistory && (
              <div className="divide-y divide-gray-100">
                {notesDebitLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-500">Chargement...</span>
                  </div>
                ) : (
                  notesDebit.map((note) => (
                    <div key={note.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Receipt className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">{note.reference}</p>
                            {note.client_nom && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {note.client_nom}
                              </span>
                            )}
                            {note.statut_paiement === 'payee' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                Payée
                              </span>
                            )}
                            {note.statut_paiement === 'partielle' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                Partielle
                              </span>
                            )}
                            {(note.statut_paiement === 'impayee' || !note.statut_paiement) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                Impayée
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(note.created_at).toLocaleDateString('fr-FR')} · {note.colis_ids.length} colis · {note.volume_total_tana.toFixed(3)} m³
                          </p>
                        </div>
                        <div className="hidden sm:block">
                          <span className="text-sm font-bold text-blue-700">{note.montant_total_ariary.toLocaleString('fr-FR')} Ar</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setCurrentNoteDebit(enrichNoteDebit(note)); setShowNoteDebitDocument(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Réimprimer
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => { setEditingNoteDebit(note); setShowNoteDebitConfig(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Modifier la note de débit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Modifier
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Supprimer la note de débit ${note.reference} ? Cette action est irréversible.`)) {
                                deleteNote(note.id);
                              }
                            }}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer (administrateur uniquement)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Liste des colis */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Colis associés ({filteredColis.length})</span>
            </h3>
          </div>

          {filteredColis.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun colis associé à ce départ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipping Mark</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Palettes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Cartons</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Poids</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Volume</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredColis.map((colis) => (
                    <tr key={colis.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{colis.id}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-700 font-medium">
                        {colis.shippingMark || 'Sans shipping mark'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs hidden sm:table-cell">
                        <div className="truncate" title={colis.description}>{colis.description}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center hidden lg:table-cell">
                        {colis.nbPalettesTana ? (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {colis.nbPalettesTana}
                          </span>
                        ) : (
                          <span className="text-xs text-red-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center hidden md:table-cell">
                        {colis.nbCartonsTana ? (
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                            {colis.nbCartonsTana}
                          </span>
                        ) : (
                          <span className="text-xs text-red-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center hidden md:table-cell">
                        {colis.poidsTana ? (
                          <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded-full text-xs font-medium">
                            {colis.poidsTana} kg
                          </span>
                        ) : (
                          <span className="text-xs text-red-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center hidden md:table-cell">
                        {colis.volumeTana ? (
                          <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded-full text-xs font-medium">
                            {parseFloat(String(colis.volumeTana)).toFixed(3)} m³
                          </span>
                        ) : (
                          <span className="text-xs text-red-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {editingColisId === colis.id ? (
                          <div className="flex items-center space-x-2">
                            <select
                              value={editingStatus}
                              onChange={(e) => setEditingStatus(e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              disabled={isUpdating}
                            >
                              <option value="en_attente_confirmation">En attente de confirmation</option>
                              <option value="enregistre_chine">Enregistré en Chine</option>
                              <option value="charge_expedition">Chargé pour l'expédition</option>
                              <option value="en_route_madagascar">En route vers Madagascar</option>
                              <option value="arrive_toamasina">Arrivé au port de Toamasina</option>
                              <option value="dedouanement_cours">En cours de dédouanement</option>
                              <option value="arrive_antananarivo">Arrivé à Antananarivo</option>
                              <option value="pret_livraison_enlevement">Prêt pour livraison/enlèvement</option>
                              <option value="en_cours_livraison">En cours de livraison</option>
                              <option value="livre">Livré</option>
                            </select>
                            <button onClick={() => handleSaveStatus(colis.id)} disabled={isUpdating} className="text-green-600 hover:text-green-800 p-1 disabled:opacity-50">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={handleCancelEdit} disabled={isUpdating} className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${getInventoryStatusColor(colis.statut)}`}>
                              {getPackageStatusLabel(colis.statut)}
                            </span>
                            <button onClick={() => handleEditStatus(colis.id, colis.statut)} className="text-blue-600 hover:text-blue-800 p-1">
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Configuration Note de Débit */}
        {showNoteDebitConfig && (
          <NoteDebitConfigModal
            departId={selectedDepartId}
            colis={allAssociatedColis}
            alreadyInvoicedColisIds={(() => {
              const notes = notesDebitByDepartId.get(selectedDepartId!) || [];
              const ids = new Set<number>();
              for (const note of notes) {
                if (editingNoteDebit && note.id === editingNoteDebit.id) continue;
                for (const cid of note.colis_ids) {
                  ids.add(Number(cid));
                }
              }
              return ids;
            })()}
            onClose={() => { setShowNoteDebitConfig(false); setEditingNoteDebit(null); }}
            onGenerate={handleGenerateNoteDebit}
            isCreating={isCreatingNote}
            editNote={editingNoteDebit}
            onEdit={handleEditNoteDebit}
            isEditing={isUpdatingNote}
          />
        )}

        {/* Modal: Document Note de Débit */}
        {showNoteDebitDocument && currentNoteDebit && (
          <NoteDebitDocumentModal
            noteDebit={currentNoteDebit}
            settings={companySettings}
            onClose={() => { setShowNoteDebitDocument(false); setCurrentNoteDebit(null); }}
          />
        )}

        {/* Modal: Configuration Bon de Livraison */}
        {showBonLivraisonConfig && (
          <BonLivraisonConfigModal
            departId={selectedDepartId}
            colis={allAssociatedColis}
            onClose={() => setShowBonLivraisonConfig(false)}
            onGenerate={handleGenerateBonLivraison}
            isCreating={isCreatingBon}
          />
        )}

        {/* Modal: Document Bon de Livraison */}
        {showBonLivraisonDocument && currentBonLivraison && (
          <BonLivraisonDocumentModal
            bonLivraison={currentBonLivraison}
            settings={companySettings}
            onClose={() => { setShowBonLivraisonDocument(false); setCurrentBonLivraison(null); }}
          />
        )}
      </div>
    );
  }

  // Affichage principal avec toutes les cartes de départ
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-blue-100 rounded-xl">
          <Truck className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Livraison / Enlèvement</h2>
          <p className="text-gray-600">Cliquez sur un départ pour voir les colis associés</p>
        </div>
      </div>

      {/* Statistiques — réservées aux administrateurs */}
      {isAdmin && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Ship className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Départs</p>
              <p className="text-2xl font-bold text-gray-900">{departItems.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Colis</p>
              <p className="text-2xl font-bold text-gray-900">
                {departItems.reduce((total, depart) => total + depart.colisAssocies.length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-3 bg-teal-100 rounded-xl">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Prêts livraison</p>
              <p className="text-2xl font-bold text-gray-900">
                {departItems.filter(d => d.statut === 'arrivee_antananarivo' || d.statut === 'decharge_trie').length}
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Liste des départs */}
      {departItems.length === 0 ? (
        <div className="text-center py-12">
          <Ship className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun départ disponible</h3>
          <p className="text-gray-500">Les départs apparaîtront ici une fois créés.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Départ</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">BL / TC</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Vol. Contre-mesure</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Vol. Facturé</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Vol. Restant</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Colis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(() => {
                const grandTotals = { volContreMesure: 0, volFacture: 0, colis: 0 };
                const rows = departItems.map((depart) => {
                  const StatusIcon = getStatusIcon(depart.statut);
                  const cardStyle = getDepartureCardStyle(depart.statut);
                  const associatedColis = getColisForDepart(depart.id);
                  const cmTotals = getContreMesureTotals(associatedColis);
                  const facTotals = getFactureTotals(depart.id);
                  const volRestant = cmTotals.volume - facTotals.volume;
                  const colisCount = getColisCountForDepart(depart.id);

                  grandTotals.volContreMesure += cmTotals.volume;
                  grandTotals.volFacture += facTotals.volume;
                  grandTotals.colis += colisCount;

                  const leftBorderColor: Record<string, string> = {
                    decharge_trie: 'bg-green-500',
                    arrivee_antananarivo: 'bg-blue-500',
                    arrivee_toamasina: 'bg-cyan-500',
                    dedouanement_en_cours: 'bg-yellow-500',
                    depart_chine: 'bg-blue-400',
                    conteneur_charge: 'bg-orange-500',
                    preparation_depart: 'bg-gray-400',
                  };
                  const barColor = leftBorderColor[depart.statut] ?? 'bg-gray-300';

                  return (
                    <tr
                      key={depart.id}
                      onClick={() => setSelectedDepartId(depart.id)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-1 h-10 rounded-full flex-shrink-0 ${barColor}`} />
                          <div className={`p-2 rounded-lg ${cardStyle.iconBg} flex-shrink-0`}>
                            <StatusIcon className={`w-4 h-4 ${cardStyle.iconColor}`} />
                          </div>
                          <span className="font-semibold text-gray-900 text-sm">Départ #{depart.id}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-800">{depart.numBL}</p>
                        {depart.numTC && <p className="text-xs text-gray-400 font-mono mt-0.5">{depart.numTC}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getDepartureStatusColor(depart.statut)}`}>
                          {getDepartureStatusLabel(depart.statut)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-gray-700 hidden md:table-cell">
                        {cmTotals.volume > 0 ? <span className="font-medium text-teal-700">{cmTotals.volume.toFixed(3)} m³</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-gray-700 hidden md:table-cell">
                        {facTotals.volume > 0 ? <span className="font-medium text-blue-700">{facTotals.volume.toFixed(3)} m³</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right text-sm hidden lg:table-cell">
                        {volRestant > 0.001 ? (
                          <span className="font-medium text-orange-600">{volRestant.toFixed(3)} m³</span>
                        ) : cmTotals.volume > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Facturé</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg">
                          {colisCount}
                        </span>
                      </td>
                    </tr>
                  );
                });

                return (
                  <>
                    {rows}
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider" colSpan={3}>
                        Total — {departItems.length} départ{departItems.length > 1 ? 's' : ''}
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-teal-700 hidden md:table-cell">{grandTotals.volContreMesure > 0 ? `${grandTotals.volContreMesure.toFixed(3)} m³` : '—'}</td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-blue-700 hidden md:table-cell">{grandTotals.volFacture > 0 ? `${grandTotals.volFacture.toFixed(3)} m³` : '—'}</td>
                      <td className="px-5 py-3 text-right text-sm font-bold text-orange-600 hidden lg:table-cell">{(grandTotals.volContreMesure - grandTotals.volFacture) > 0.001 ? `${(grandTotals.volContreMesure - grandTotals.volFacture).toFixed(3)} m³` : '—'}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-gray-200 text-gray-700 text-sm font-bold rounded-lg">
                          {grandTotals.colis}
                        </span>
                      </td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
