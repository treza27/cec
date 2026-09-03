import { useState, useCallback, useEffect } from 'react';
import { BulkImportRow, BulkImportStats, BulkImportResult, ImportProgress } from '../types/bulkImport';
import { validateAllRows, calculateStats } from '../utils/bulkValidation';
import { inventoryService } from '../services/inventoryService';
import { InventoryItem } from '../types';
import toast from 'react-hot-toast';

function convertDateToISO(dateStr: string): string {
  // Format dd/mm/yyyy
  const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateStr.match(ddmmyyyyRegex);

  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }

  // Format YYYY-MM-DD (rétrocompatibilité)
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (isoRegex.test(dateStr)) {
    return dateStr;
  }

  return dateStr;
}

export function useBulkImport(existingPseudos: string[], existingShippingMarks: string[]) {
  const [rows, setRows] = useState<BulkImportRow[]>([]);
  const [existingTrackingNumbers, setExistingTrackingNumbers] = useState<string[]>([]);
  const [isLoadingTrackingNumbers, setIsLoadingTrackingNumbers] = useState(true);
  const [stats, setStats] = useState<BulkImportStats>({
    totalRows: 0,
    validRows: 0,
    errorRows: 0,
    warningRows: 0,
    totalPalettes: 0,
    totalCartons: 0,
    totalPoids: 0,
    totalVolume: 0,
    guangzhouCount: 0,
    yiwuCount: 0
  });
  const [progress, setProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    status: 'idle'
  });
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  useEffect(() => {
    const loadTrackingNumbers = async () => {
      setIsLoadingTrackingNumbers(true);
      try {
        const trackingNumbers = await inventoryService.getAllTrackingNumbers();
        setExistingTrackingNumbers(trackingNumbers);
      } catch (error) {
        console.error('Erreur lors du chargement des tracking numbers:', error);
        toast.error('Erreur lors du chargement des numéros de suivi existants');
      } finally {
        setIsLoadingTrackingNumbers(false);
      }
    };

    loadTrackingNumbers();
  }, []);

  // Re-validate all rows when tracking numbers finish loading from DB.
  // Fixes race condition where file is loaded before the async DB fetch completes,
  // causing duplicate tracking numbers to be silently accepted.
  useEffect(() => {
    if (isLoadingTrackingNumbers || rows.length === 0) return;
    const revalidated = validateAllRows(rows, existingPseudos, existingShippingMarks, existingTrackingNumbers);
    setRows(revalidated);
    setStats(calculateStats(revalidated));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingTrackingNumbers, isLoadingTrackingNumbers]);

  const loadRows = useCallback((newRows: BulkImportRow[]) => {
    const validatedRows = validateAllRows(newRows, existingPseudos, existingShippingMarks, existingTrackingNumbers);
    setRows(validatedRows);
    setStats(calculateStats(validatedRows));
  }, [existingPseudos, existingShippingMarks, existingTrackingNumbers]);

  const updateRow = useCallback((rowIndex: number, updates: Partial<BulkImportRow>) => {
    setRows(prevRows => {
      const updatedRows = prevRows.map(row =>
        row.rowIndex === rowIndex ? { ...row, ...updates } : row
      );
      const validatedRows = validateAllRows(updatedRows, existingPseudos, existingShippingMarks, existingTrackingNumbers);
      setStats(calculateStats(validatedRows));
      return validatedRows;
    });
  }, [existingPseudos, existingShippingMarks, existingTrackingNumbers]);

  const deleteRow = useCallback((rowIndex: number) => {
    setRows(prevRows => {
      const updatedRows = prevRows.filter(row => row.rowIndex !== rowIndex);
      setStats(calculateStats(updatedRows));
      return updatedRows;
    });
  }, []);

  const addEmptyRow = useCallback(() => {
    const newRowIndex = rows.length > 0 ? Math.max(...rows.map(r => r.rowIndex)) + 1 : 1;
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const todayFormatted = `${day}/${month}/${year}`;

    const emptyRow: BulkImportRow = {
      rowIndex: newRowIndex,
      dateEntree: todayFormatted,
      entrepot: '',
      pseudo: '',
      trackingNumber: '',
      shippingMark: '',
      description: '',
      nbPalettes: '0',
      nbCartons: '1',
      poids: '',
      volume: '',
      choixClient: '',
      errors: [],
      warnings: [],
      isValid: false
    };
    const validatedRow = validateAllRows([emptyRow], existingPseudos, existingShippingMarks, existingTrackingNumbers)[0];
    setRows(prev => {
      const updatedRows = [...prev, validatedRow];
      setStats(calculateStats(updatedRows));
      return updatedRows;
    });
  }, [rows, existingPseudos, existingShippingMarks, existingTrackingNumbers]);

  const duplicateRow = useCallback((rowIndex: number) => {
    const rowToDuplicate = rows.find(r => r.rowIndex === rowIndex);
    if (!rowToDuplicate) return;

    const newRowIndex = Math.max(...rows.map(r => r.rowIndex)) + 1;
    const duplicatedRow: BulkImportRow = {
      ...rowToDuplicate,
      rowIndex: newRowIndex,
      trackingNumber: '',
      errors: [],
      warnings: [],
      isValid: false
    };
    const validatedRow = validateAllRows([duplicatedRow], existingPseudos, existingShippingMarks, existingTrackingNumbers)[0];
    setRows(prev => {
      const updatedRows = [...prev, validatedRow];
      setStats(calculateStats(updatedRows));
      return updatedRows;
    });
  }, [rows, existingPseudos, existingShippingMarks, existingTrackingNumbers]);

  const clearAll = useCallback(() => {
    setRows([]);
    setStats({
      totalRows: 0,
      validRows: 0,
      errorRows: 0,
      warningRows: 0,
      totalPalettes: 0,
      totalCartons: 0,
      totalPoids: 0,
      totalVolume: 0,
      guangzhouCount: 0,
      yiwuCount: 0
    });
    setProgress({
      current: 0,
      total: 0,
      percentage: 0,
      status: 'idle'
    });
    setImportResult(null);
  }, []);

  const executeImport = useCallback(async (): Promise<BulkImportResult> => {
    const validRows = rows.filter(row => row.isValid);

    if (validRows.length === 0) {
      toast.error('Aucune ligne valide à importer');
      throw new Error('Aucune ligne valide à importer');
    }

    setProgress({
      current: 0,
      total: validRows.length,
      percentage: 0,
      status: 'importing',
      message: 'Import en cours...'
    });

    try {
      const items: Omit<InventoryItem, 'id'>[] = validRows.map(row => ({
        bl: '',
        dateEntree: convertDateToISO(row.dateEntree),
        entrepot: row.entrepot,
        pseudo: row.pseudo,
        shippingMark: row.shippingMark || '',
        description: row.description,
        nbPalettes: row.nbPalettes,
        nbCartons: row.nbCartons,
        poids: row.poids && row.poids.trim() !== '' ? row.poids : null,
        volume: row.volume && row.volume.trim() !== '' ? row.volume : null,
        images: [],
        statut: 'en_attente_confirmation',
        nbPalettesTana: '',
        nbCartonsTana: '',
        poidsTana: '',
        volumeTana: '',
        id_depart: null,
        trackingNumber: row.trackingNumber || ''
      }));

      const result = await inventoryService.bulkCreate(items, (current, total) => {
        const percentage = Math.round((current / total) * 100);
        setProgress({
          current,
          total,
          percentage,
          status: 'importing',
          message: `Import en cours... ${current}/${total}`
        });
      });

      setProgress({
        current: result.successCount,
        total: validRows.length,
        percentage: 100,
        status: 'completed',
        message: `Import terminé: ${result.successCount} réussis, ${result.failureCount} échecs`
      });

      setImportResult(result);

      if (result.successCount > 0) {
        toast.success(`${result.successCount} colis importés avec succès`);
      }
      if (result.failureCount > 0) {
        toast.error(`${result.failureCount} colis ont échoué`);
      }

      return result;
    } catch (error: any) {
      setProgress({
        current: 0,
        total: validRows.length,
        percentage: 0,
        status: 'error',
        message: error.message || 'Erreur lors de l\'import'
      });
      toast.error('Erreur lors de l\'import');
      throw error;
    }
  }, [rows]);

  return {
    rows,
    stats,
    progress,
    importResult,
    isLoadingTrackingNumbers,
    loadRows,
    updateRow,
    deleteRow,
    addEmptyRow,
    duplicateRow,
    clearAll,
    executeImport
  };
}
