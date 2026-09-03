export interface BulkImportRow {
  rowIndex: number;
  dateEntree: string;
  entrepot: string;
  pseudo: string;
  trackingNumber?: string;
  shippingMark?: string;
  description: string;
  nbPalettes: string;
  nbCartons: string;
  poids: string;
  volume: string;
  choixClient?: 'depot_anosizato' | 'bureaux_ambodivona' | '';
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export interface BulkImportStats {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  totalPalettes: number;
  totalCartons: number;
  totalPoids: number;
  totalVolume: number;
  guangzhouCount: number;
  yiwuCount: number;
}

export interface BulkImportResult {
  successCount: number;
  failureCount: number;
  successIds: number[];
  failures: {
    rowIndex: number;
    error: string;
    data: Partial<BulkImportRow>;
  }[];
}

export interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
  status: 'idle' | 'importing' | 'completed' | 'error';
  message?: string;
}
