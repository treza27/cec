import * as XLSX from 'xlsx';
import { BulkImportRow } from '../types/bulkImport';

const COLUMN_MAPPING: Record<string, string[]> = {
  dateEntree: ['date entree', "date d'entree", 'date', 'date_entree'],
  entrepot: ['entrepot', 'entrepôt', 'warehouse'],
  pseudo: ['pseudo', 'client', 'nom client'],
  trackingNumber: ['tracking', 'tracking number', 'numero suivi', 'tracking_number', 'num_tracking'],
  shippingMark: ['shipping mark', 'shipping_mark', 'mark', 'marque'],
  description: ['description', 'desc', 'contenu'],
  nbPalettes: ['nb palettes', 'palettes', 'nb_palettes', 'nombre palettes'],
  nbCartons: ['nb cartons', 'cartons', 'nb_cartons', 'nombre cartons'],
  poids: ['poids', 'weight', 'poids kg'],
  volume: ['volume', 'volume m3', 'volume_m3', 'm3']
};

function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/[_\s]+/g, ' ');
}

function mapColumnToField(columnName: string): string | null {
  const normalized = normalizeColumnName(columnName);

  for (const [field, variants] of Object.entries(COLUMN_MAPPING)) {
    if (variants.some(variant => normalized.includes(variant) || variant.includes(normalized))) {
      return field;
    }
  }

  return null;
}

function parseDateValue(value: any): string {
  if (value === null || value === undefined) return '';

  // Handle Excel date numbers (days since 1900-01-01)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const day = String(date.d).padStart(2, '0');
      const month = String(date.m).padStart(2, '0');
      const year = date.y;
      return `${day}/${month}/${year}`;
    }
    return value.toString();
  }

  // Handle Date objects
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Handle string dates
  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Check if already in dd/mm/yyyy format
    const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = trimmed.match(ddmmyyyyRegex);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${day}/${month}/${year}`;
    }

    // Check if in YYYY-MM-DD format and convert to dd/mm/yyyy
    const isoRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const isoMatch = trimmed.match(isoRegex);
    if (isoMatch) {
      const year = isoMatch[1];
      const month = isoMatch[2];
      const day = isoMatch[3];
      return `${day}/${month}/${year}`;
    }

    return trimmed;
  }

  return String(value).trim();
}

function parseValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return value.trim();
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return String(value).trim();
}

export async function parseExcelFile(file: File): Promise<BulkImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          reject(new Error('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données'));
          return;
        }

        const headers = jsonData[0].map((h: any) => String(h || ''));
        const columnMap = new Map<number, string>();

        headers.forEach((header, index) => {
          const field = mapColumnToField(header);
          if (field) {
            columnMap.set(index, field);
          }
        });

        const requiredFields = ['dateEntree', 'entrepot', 'pseudo', 'description', 'nbPalettes', 'nbCartons', 'poids', 'volume'];
        const missingFields = requiredFields.filter(field =>
          !Array.from(columnMap.values()).includes(field)
        );

        if (missingFields.length > 0) {
          reject(new Error(`Colonnes manquantes: ${missingFields.join(', ')}`));
          return;
        }

        const rows: BulkImportRow[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const rowData = jsonData[i];
          if (!rowData || rowData.every((cell: any) => !cell)) continue;

          const row: Partial<BulkImportRow> = {
            rowIndex: i,
            errors: [],
            warnings: [],
            isValid: true
          };

          columnMap.forEach((field, colIndex) => {
            const cellValue = rowData[colIndex];
            let value: string;
            if (field === 'dateEntree') {
              value = parseDateValue(cellValue);
            } else {
              value = parseValue(cellValue);
            }
            (row as any)[field] = value;
          });

          rows.push(row as BulkImportRow);
        }

        resolve(rows);
      } catch (error) {
        reject(new Error(`Erreur lors du parsing du fichier: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsBinaryString(file);
  });
}

export async function parseCSVFile(file: File): Promise<BulkImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          reject(new Error('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données'));
          return;
        }

        const headers = lines[0].split(/[,;\t]/).map(h => h.trim().replace(/^"|"$/g, ''));
        const columnMap = new Map<number, string>();

        headers.forEach((header, index) => {
          const field = mapColumnToField(header);
          if (field) {
            columnMap.set(index, field);
          }
        });

        const rows: BulkImportRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(/[,;\t]/).map(v => v.trim().replace(/^"|"$/g, ''));
          if (values.every(v => !v)) continue;

          const row: Partial<BulkImportRow> = {
            rowIndex: i,
            errors: [],
            warnings: [],
            isValid: true
          };

          columnMap.forEach((field, colIndex) => {
            const cellValue = values[colIndex];
            let value: string;
            if (field === 'dateEntree') {
              value = parseDateValue(cellValue);
            } else {
              value = parseValue(cellValue);
            }
            (row as any)[field] = value;
          });

          rows.push(row as BulkImportRow);
        }

        resolve(rows);
      } catch (error) {
        reject(new Error(`Erreur lors du parsing du CSV: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsText(file);
  });
}

export async function parseFile(file: File): Promise<BulkImportRow[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSVFile(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseExcelFile(file);
  } else {
    throw new Error('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv');
  }
}

export function downloadTemplate() {
  const data = [
    ['Date entree', 'Entrepot', 'PSEUDO', 'Tracking Number', 'Shipping Mark', 'Description', 'Nb Palettes', 'Nb Cartons', 'Poids kg', 'Volume m3'],
    ['11/02/2025', 'Guangzhou', 'CLIENT123', 'TRK001', 'MARK-001', 'Électronique', '2', '50', '500', '2.5'],
    ['15/03/2025', 'Yiwu', 'CLIENT456', 'TRK002', 'MARK-002', 'Vêtements', '0', '30', '120', '1.2']
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 30 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');

  XLSX.writeFile(wb, 'template-import-colis.xlsx');
}
