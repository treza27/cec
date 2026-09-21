import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { BulkImportRow } from '../../types/bulkImport';
import { Trash2, Copy, AlertCircle } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';

interface BulkImportTableProps {
  rows: BulkImportRow[];
  onUpdateRow: (rowIndex: number, updates: Partial<BulkImportRow>) => void;
  onDeleteRow: (rowIndex: number) => void;
  onDuplicateRow: (rowIndex: number) => void;
  existingPseudos: string[];
  existingShippingMarks: string[];
}

interface TextCellProps {
  value: string;
  rowIndex: number;
  field: keyof BulkImportRow;
  onCommit: (rowIndex: number, updates: Partial<BulkImportRow>) => void;
  placeholder?: string;
  className?: string;
  listId?: string;
}

const TextCell: React.FC<TextCellProps> = ({ value, rowIndex, field, onCommit, placeholder, className, listId }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = useCallback(() => {
    if (localValue !== value) {
      onCommit(rowIndex, { [field]: localValue } as Partial<BulkImportRow>);
    }
  }, [localValue, value, rowIndex, field, onCommit]);

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      list={listId}
      className={className}
    />
  );
};

interface NumberCellProps {
  value: string;
  rowIndex: number;
  field: keyof BulkImportRow;
  onCommit: (rowIndex: number, updates: Partial<BulkImportRow>) => void;
  min?: string;
  step?: string;
  className?: string;
}

const NumberCell: React.FC<NumberCellProps> = ({ value, rowIndex, field, onCommit, min, step, className }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = useCallback(() => {
    if (localValue !== value) {
      onCommit(rowIndex, { [field]: localValue } as Partial<BulkImportRow>);
    }
  }, [localValue, value, rowIndex, field, onCommit]);

  return (
    <input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      min={min}
      step={step}
      className={className}
    />
  );
};

const columnHelper = createColumnHelper<BulkImportRow>();

const BulkImportTable: React.FC<BulkImportTableProps> = ({
  rows,
  onUpdateRow,
  onDeleteRow,
  onDuplicateRow,
  existingPseudos,
  existingShippingMarks,
}) => {
  const columns = useMemo<ColumnDef<BulkImportRow, any>[]>(
    () => [
      columnHelper.accessor('rowIndex', {
        header: 'Ligne',
        cell: (info) => (
          <span className="text-xs font-medium text-gray-600">#{info.getValue()}</span>
        ),
        size: 60,
      }),
      columnHelper.accessor('dateEntree', {
        header: 'Date entrée',
        cell: (info) => {
          const row = info.row.original;
          return (
            <TextCell
              value={info.getValue()}
              rowIndex={row.rowIndex}
              field="dateEntree"
              onCommit={onUpdateRow}
              placeholder="jj/mm/aaaa"
              className={`w-full px-2 py-1 text-xs border rounded ${
                row.errors.some((e) => e.includes('Date'))
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
          );
        },
        size: 130,
      }),
      columnHelper.accessor('entrepot', {
        header: 'Entrepôt',
        cell: (info) => {
          const row = info.row.original;
          return (
            <select
              value={info.getValue()}
              onChange={(e) =>
                onUpdateRow(row.rowIndex, { entrepot: e.target.value })
              }
              className={`w-full px-2 py-1 text-xs border rounded ${
                row.errors.some((e) => e.includes('Entrepôt'))
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionner</option>
              <option value="Guangzhou">Guangzhou</option>
              <option value="Yiwu">Yiwu</option>
            </select>
          );
        },
        size: 120,
      }),
      columnHelper.accessor('pseudo', {
        header: 'PSEUDO',
        cell: (info) => {
          const row = info.row.original;
          return (
            <>
              <datalist id={`pseudo-list-${row.rowIndex}`}>
                {existingPseudos.map((pseudo) => (
                  <option key={pseudo} value={pseudo} />
                ))}
              </datalist>
              <TextCell
                value={info.getValue()}
                rowIndex={row.rowIndex}
                field="pseudo"
                onCommit={onUpdateRow}
                listId={`pseudo-list-${row.rowIndex}`}
                className={`w-full px-2 py-1 text-xs border rounded ${
                  row.errors.some((e) => e.includes('PSEUDO'))
                    ? 'border-red-300 bg-red-50'
                    : row.warnings.some((w) => w.includes('PSEUDO'))
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-gray-300'
                }`}
              />
            </>
          );
        },
        size: 120,
      }),
      columnHelper.accessor('trackingNumber', {
        header: 'Tracking',
        cell: (info) => {
          const row = info.row.original;
          return (
            <TextCell
              value={info.getValue() || ''}
              rowIndex={row.rowIndex}
              field="trackingNumber"
              onCommit={onUpdateRow}
              placeholder="Optionnel"
              className={`w-full px-2 py-1 text-xs border rounded ${
                row.errors.some((e) => e.includes('suivi'))
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
          );
        },
        size: 120,
      }),
      columnHelper.accessor('shippingMark', {
        header: 'Shipping Mark',
        cell: (info) => {
          const row = info.row.original;
          return (
            <>
              <datalist id={`shipping-mark-list-${row.rowIndex}`}>
                {existingShippingMarks.map((mark) => (
                  <option key={mark} value={mark} />
                ))}
              </datalist>
              <TextCell
                value={info.getValue() || ''}
                rowIndex={row.rowIndex}
                field="shippingMark"
                onCommit={onUpdateRow}
                placeholder="Optionnel"
                listId={`shipping-mark-list-${row.rowIndex}`}
                className={`w-full px-2 py-1 text-xs border rounded ${
                  row.warnings.some((w) => w.includes('Shipping Mark'))
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-gray-300'
                }`}
              />
            </>
          );
        },
        size: 150,
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => {
          const row = info.row.original;
          return (
            <TextCell
              value={info.getValue()}
              rowIndex={row.rowIndex}
              field="description"
              onCommit={onUpdateRow}
              className={`w-full px-2 py-1 text-xs border rounded ${
                row.errors.some((e) => e.includes('Description'))
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
          );
        },
        size: 200,
      }),
      columnHelper.accessor('nbPalettes', {
        header: 'Pal.',
        cell: (info) => {
          const row = info.row.original;
          return (
            <NumberCell
              value={info.getValue()}
              rowIndex={row.rowIndex}
              field="nbPalettes"
              onCommit={onUpdateRow}
              min="0"
              step="1"
              className={`w-full px-2 py-1 text-xs border rounded ${
                row.errors.some((e) => e.includes('palettes'))
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
          );
        },
        size: 70,
      }),
      columnHelper.accessor('nbCartons', {
        header: 'Cart.',
        cell: (info) => {
          const row = info.row.original;
          return (
            <NumberCell
              value={info.getValue()}
              rowIndex={row.rowIndex}
              field="nbCartons"
              onCommit={onUpdateRow}
              min="1"
              step="1"
              className={`w-full px-2 py-1 text-xs border rounded ${
                row.errors.some((e) => e.includes('cartons'))
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
          );
        },
        size: 70,
      }),
      columnHelper.accessor('poids', {
        header: 'Poids (kg)',
        cell: (info) => {
          const row = info.row.original;
          return (
            <NumberCell
              value={info.getValue()}
              rowIndex={row.rowIndex}
              field="poids"
              onCommit={onUpdateRow}
              min="0.1"
              step="0.1"
              className={`w-full px-2 py-1 text-xs border rounded ${
                row.errors.some((e) => e.includes('Poids'))
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
          );
        },
        size: 90,
      }),
      columnHelper.accessor('volume', {
        header: 'Volume (m³)',
        cell: (info) => {
          const row = info.row.original;
          return (
            <NumberCell
              value={info.getValue()}
              rowIndex={row.rowIndex}
              field="volume"
              onCommit={onUpdateRow}
              min="0.1"
              step="0.1"
              className={`w-full px-2 py-1 text-xs border rounded ${
                row.errors.some((e) => e.includes('Volume'))
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
          );
        },
        size: 100,
      }),
      columnHelper.accessor('choixClient', {
        header: 'Choix client',
        cell: (info) => {
          const row = info.row.original;
          return (
            <select
              value={info.getValue() || ''}
              onChange={(e) =>
                onUpdateRow(row.rowIndex, { choixClient: e.target.value as 'depot_anosizato' | 'bureaux_ambodivona' | '' })
              }
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            >
              <option value="">Non renseigné</option>
              <option value="depot_anosizato">Dépôt Anosizato</option>
              <option value="bureaux_ambodivona">Bureaux Ambodivona</option>
            </select>
          );
        },
        size: 160,
      }),
      columnHelper.display({
        id: 'errors',
        header: 'Statut',
        cell: (info) => {
          const row = info.row.original;
          if (row.errors.length > 0) {
            return (
              <div className="relative group flex items-center space-x-1 cursor-pointer">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-xs text-red-600 underline decoration-dotted">
                  {row.errors.length} erreur(s)
                </span>
                <div className="absolute bottom-full right-0 mb-2 z-50 hidden group-hover:block w-64 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3">
                    <p className="font-semibold text-red-300 mb-2">Erreurs à corriger :</p>
                    <ul className="space-y-1">
                      {row.errors.map((err, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                          <span className="leading-tight">{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="w-3 h-3 bg-gray-900 rotate-45 mr-3 ml-auto -mt-1.5"></div>
                </div>
              </div>
            );
          }
          if (row.warnings.length > 0) {
            return (
              <div className="relative group flex items-center space-x-1 cursor-pointer">
                <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="text-xs text-orange-600 underline decoration-dotted">
                  {row.warnings.length} avertissement(s)
                </span>
                <div className="absolute bottom-full right-0 mb-2 z-50 hidden group-hover:block w-64 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded-lg shadow-xl p-3">
                    <p className="font-semibold text-orange-300 mb-2">Avertissements :</p>
                    <ul className="space-y-1">
                      {row.warnings.map((w, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>
                          <span className="leading-tight">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="w-3 h-3 bg-gray-900 rotate-45 mr-3 ml-auto -mt-1.5"></div>
                </div>
              </div>
            );
          }
          return (
            <span className="text-xs text-green-600 font-medium">Valide</span>
          );
        },
        size: 150,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onDuplicateRow(row.rowIndex)}
                className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                title="Dupliquer"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteRow(row.rowIndex)}
                className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        },
        size: 90,
      }),
    ],
    [onUpdateRow, onDeleteRow, onDuplicateRow, existingPseudos, existingShippingMarks]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">Aucune donnée à afficher. Importez un fichier Excel ou ajoutez des lignes manuellement.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
      <table className="w-full min-w-max">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                  style={{ width: header.getSize() }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => {
            const rowData = row.original;
            const bgColor = rowData.errors.length > 0
              ? 'bg-red-50'
              : rowData.warnings.length > 0
              ? 'bg-orange-50'
              : 'bg-green-50';

            return (
              <tr key={row.id} className={`${bgColor} hover:opacity-80 transition-colors`}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-2 py-2 text-sm text-gray-900 border-b border-gray-100"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BulkImportTable;
