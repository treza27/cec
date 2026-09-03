import React, { useEffect, useRef } from 'react';
import { X, Printer, Building2 } from 'lucide-react';
import { NoteDebit, NoteDebitColisDetail } from '../../../services/noteDebitService';
import { CompanySettings } from '../../../types';

interface NoteDebitDocumentModalProps {
  noteDebit: NoteDebit;
  settings: CompanySettings | null;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function NoteDebitDocumentModal({
  noteDebit,
  settings,
  onClose,
}: NoteDebitDocumentModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handlePrint = () => {
    const nomEnt = settings?.nom_entreprise || 'Votre Entreprise';
    const adr = settings?.adresse || '';
    const tel = settings?.telephone || '';
    const site = settings?.site_web || '';
    const logoUrl = settings?.logo_url || '';
    const det: NoteDebitColisDetail[] = noteDebit.colis_details;

    const totalCartons = det.reduce((sum, d) => sum + (d.nbCartons || 0), 0);
    const totalPoids = det.reduce((sum, d) => sum + (d.poidsTana || 0), 0);

    const rowsHtml = det.map((d, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;color:#374151;">${idx + 1}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;font-weight:600;color:#1d4ed8;">${d.shippingMark || '—'}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;color:#374151;font-size:10px;">${d.trackingNumber || '—'}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;color:#374151;">${d.description}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;color:#1f2937;font-weight:500;">${d.nbCartons || 0}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;color:#1f2937;font-weight:500;">${d.volumeTana.toFixed(3)}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-weight:600;color:#111827;">${(d.poidsTana || 0).toFixed(2)}</td>
      </tr>`).join('');

    const totalRowHtml = `
      <tr style="background-color:#1e40af;color:white;font-weight:700;">
        <td colspan="4" style="border:1px solid #1e3a8a;padding:8px 10px;text-align:right;">TOTAL</td>
        <td style="border:1px solid #1e3a8a;padding:8px 10px;text-align:center;">${totalCartons}</td>
        <td style="border:1px solid #1e3a8a;padding:8px 10px;text-align:center;">${noteDebit.volume_total_tana.toFixed(3)}</td>
        <td style="border:1px solid #1e3a8a;padding:8px 10px;text-align:center;">${totalPoids.toFixed(2)}</td>
      </tr>`;

    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="${nomEnt}" style="width:72px;height:72px;object-fit:contain;flex-shrink:0;" />`
      : `<div style="width:60px;height:60px;background:#dbeafe;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
           <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
         </div>`;

    const noteExterneHtml = noteDebit.note_externe
      ? `<div style="padding:0 0 24px;"><div style="background:#fffbeb;border:1px solid #fcd34d;border-left:4px solid #f59e0b;border-radius:6px;padding:12px 14px;"><div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">Note externe</div><div style="font-size:12px;color:#78350f;white-space:pre-wrap;line-height:1.5;">${noteDebit.note_externe.replace(/</g, '&lt;')}</div></div></div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>Note de Débit ${noteDebit.reference}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm 16mm; }
    *, *::before, *::after { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background: white; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111827; }
    table { border-collapse: collapse; width: 100%; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
  </style>
</head>
<body>
  <div style="background:white;padding:0;">

    <!-- En-tête -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding-bottom:20px;border-bottom:1px solid #d1d5db;margin-bottom:0;">
      <div style="display:flex;align-items:flex-start;gap:14px;flex:1;min-width:0;">
        ${logoHtml}
        <div style="padding-top:2px;">
          <div style="font-size:14px;font-weight:700;color:#111827;line-height:1.2;">${nomEnt}</div>
          ${adr ? `<div style="font-size:11px;color:#6b7280;margin-top:4px;line-height:1.5;white-space:pre-line;">${adr}</div>` : ''}
          ${tel ? `<div style="font-size:11px;color:#6b7280;margin-top:2px;">Tél : ${tel}</div>` : ''}
          ${site ? `<div style="font-size:11px;color:#6b7280;margin-top:1px;">Site : ${site}</div>` : ''}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;padding-top:2px;">
        <div style="font-size:14px;font-weight:700;color:#111827;line-height:1.2;">Note de Débit</div>
        <div style="font-size:22px;font-weight:700;color:#111827;line-height:1.2;margin-top:2px;">${noteDebit.reference}</div>
        <div style="font-size:11px;color:#4b5563;margin-top:8px;">Date : ${formatDate(noteDebit.created_at)}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px;">Départ #${noteDebit.depart_id}</div>
        ${noteDebit.client_nom ? `<div style="font-size:11px;color:#374151;margin-top:2px;font-weight:600;">Client : ${noteDebit.client_nom}</div>` : ''}
        ${noteDebit.client_phone ? `<div style="font-size:11px;color:#6b7280;margin-top:1px;">Tél : ${noteDebit.client_phone}</div>` : ''}
      </div>
    </div>

    <!-- Tableau colis -->
    <div style="padding:20px 0 16px;">
      <table>
        <thead>
          <tr style="background-color:#1e40af;color:white;">
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:center;font-weight:600;width:44px;">N°</th>
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:left;font-weight:600;width:120px;">Shipping Mark</th>
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:left;font-weight:600;width:110px;">Tracking</th>
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:left;font-weight:600;">Description</th>
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:center;font-weight:600;width:70px;">Cartons</th>
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:center;font-weight:600;width:90px;">Volume Tana (m³)</th>
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:center;font-weight:600;width:90px;">Poids (kg)</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}${totalRowHtml}</tbody>
      </table>
    </div>

    <!-- Totaux -->
    <div style="display:flex;justify-content:flex-end;padding-bottom:24px;page-break-inside:avoid;">
      <div style="width:300px;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #e5e7eb;">
          <span style="font-size:11px;color:#4b5563;">Taux de change</span>
          <span style="font-size:11px;font-weight:500;color:#1f2937;">${noteDebit.taux_change.toLocaleString('fr-FR')} Ar/USD</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #e5e7eb;">
          <span style="font-size:11px;color:#4b5563;">Prix CBM</span>
          <span style="font-size:11px;font-weight:500;color:#1f2937;">${(noteDebit.prix_cbm_usd * noteDebit.taux_change).toLocaleString('fr-FR')} Ar</span>
        </div>
        ${noteDebit.frais_livraison_ariary ? `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #e5e7eb;">
          <span style="font-size:11px;color:#4b5563;">Frais de livraison</span>
          <span style="font-size:11px;font-weight:500;color:#1f2937;">${noteDebit.frais_livraison_ariary.toLocaleString('fr-FR')} Ar</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0 0;margin-top:4px;border-top:2px solid #111827;">
          <span style="font-size:13px;font-weight:700;color:#111827;">TOTAL NOTE DE DÉBIT</span>
          <span style="font-size:14px;font-weight:700;color:#1d4ed8;">${(noteDebit.montant_total_ariary + (noteDebit.frais_livraison_ariary || 0)).toLocaleString('fr-FR')} Ar</span>
        </div>
      </div>
    </div>

    ${noteExterneHtml}

  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 600);
    });
  <\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onbeforeunload = () => URL.revokeObjectURL(url);
    } else {
      URL.revokeObjectURL(url);
    }
  };

  const nomEntreprise = settings?.nom_entreprise || 'Votre Entreprise';
  const adresse = settings?.adresse || '';
  const telephone = settings?.telephone || '';
  const siteWeb = settings?.site_web || '';

  const details: NoteDebitColisDetail[] = noteDebit.colis_details;
  const totalCartons = details.reduce((sum, d) => sum + (d.nbCartons || 0), 0);
  const totalPoids = details.reduce((sum, d) => sum + (d.poidsTana || 0), 0);

  return (
    <>
      <div className="no-print fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
        <div className="relative w-full max-w-4xl">
          <div className="no-print flex items-center justify-between mb-4">
            <span className="text-white font-semibold text-sm">Note de Débit {noteDebit.reference}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimer / Enregistrer PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Document A4 */}
          <div ref={printRef} id="nd-print-area" className="bg-white shadow-2xl rounded-lg overflow-hidden">

            {/* En-tête */}
            <div className="px-10 pt-8 pb-6 border-b border-gray-300">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {settings?.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt={nomEntreprise}
                      className="w-20 h-20 object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-8 h-8 text-blue-600" />
                    </div>
                  )}
                  <div className="min-w-0 pt-1">
                    <h1 className="text-base font-bold text-gray-900 leading-tight">{nomEntreprise}</h1>
                    {adresse && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed whitespace-pre-line">{adresse}</p>
                    )}
                    <div className="mt-1 space-y-0.5">
                      {telephone && <p className="text-xs text-gray-500">Tél : {telephone}</p>}
                      {siteWeb && <p className="text-xs text-gray-500">Site : {siteWeb}</p>}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 pt-1">
                  <p className="text-base font-bold text-gray-900 leading-tight">Note de Débit</p>
                  <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{noteDebit.reference}</p>
                  <p className="text-xs text-gray-600 mt-2">Date : {formatDate(noteDebit.created_at)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Départ #{noteDebit.depart_id}</p>
                  {noteDebit.client_nom && (
                    <p className="text-xs font-semibold text-gray-700 mt-0.5">Client : {noteDebit.client_nom}</p>
                  )}
                  {noteDebit.client_phone && (
                    <p className="text-xs text-gray-500 mt-0.5">Tél : {noteDebit.client_phone}</p>
                  )}
                </div>
              </div>
            </div>


            {/* Tableau colis */}
            <div className="px-10 py-6">
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                    <th className="px-3 py-2.5 font-semibold text-center" style={{ border: '1px solid #1e3a8a', width: '44px' }}>N°</th>
                    <th className="px-3 py-2.5 font-semibold text-left" style={{ border: '1px solid #1e3a8a', width: '120px' }}>Shipping Mark</th>
                    <th className="px-3 py-2.5 font-semibold text-left" style={{ border: '1px solid #1e3a8a', width: '110px' }}>Tracking</th>
                    <th className="px-3 py-2.5 font-semibold text-left" style={{ border: '1px solid #1e3a8a' }}>Description</th>
                    <th className="px-3 py-2.5 font-semibold text-center" style={{ border: '1px solid #1e3a8a', width: '70px' }}>Cartons</th>
                    <th className="px-3 py-2.5 font-semibold text-center" style={{ border: '1px solid #1e3a8a', width: '90px' }}>Volume Tana (m³)</th>
                    <th className="px-3 py-2.5 font-semibold text-center" style={{ border: '1px solid #1e3a8a', width: '90px' }}>Poids (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail, idx) => (
                    <tr key={detail.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td className="px-3 py-3 text-center text-gray-700" style={{ border: '1px solid #d1d5db' }}>{idx + 1}</td>
                      <td className="px-3 py-3 font-semibold text-blue-700" style={{ border: '1px solid #d1d5db' }}>{detail.shippingMark || '—'}</td>
                      <td className="px-3 py-3 text-gray-600 text-xs" style={{ border: '1px solid #d1d5db' }}>{detail.trackingNumber || '—'}</td>
                      <td className="px-3 py-3 text-gray-700" style={{ border: '1px solid #d1d5db' }}>{detail.description}</td>
                      <td className="px-3 py-3 text-center text-gray-800 font-medium" style={{ border: '1px solid #d1d5db' }}>
                        {detail.nbCartons || 0}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-800 font-medium" style={{ border: '1px solid #d1d5db' }}>
                        {detail.volumeTana.toFixed(3)}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-gray-900" style={{ border: '1px solid #d1d5db' }}>
                        {(detail.poidsTana || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                    <tr style={{ backgroundColor: '#1e40af', color: 'white', fontWeight: 700 }}>
                      <td className="px-3 py-3 text-right" colSpan={4} style={{ border: '1px solid #1e3a8a' }}>TOTAL</td>
                      <td className="px-3 py-3 text-center" style={{ border: '1px solid #1e3a8a' }}>{totalCartons}</td>
                      <td className="px-3 py-3 text-center" style={{ border: '1px solid #1e3a8a' }}>{noteDebit.volume_total_tana.toFixed(3)}</td>
                      <td className="px-3 py-3 text-center" style={{ border: '1px solid #1e3a8a' }}>{totalPoids.toFixed(2)}</td>
                    </tr>
                </tbody>
              </table>
            </div>

            {/* Récapitulatif totaux */}
            <div className="px-10 pb-6 nd-totaux-block">
              <div className="flex justify-end">
                <div className="w-80">
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-200">
                    <span className="text-xs text-gray-600">Taux de change</span>
                    <span className="text-xs font-medium text-gray-800">{noteDebit.taux_change.toLocaleString('fr-FR')} Ar/USD</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-200">
                    <span className="text-xs text-gray-600">Prix CBM</span>
                    <span className="text-xs font-medium text-gray-800">{(noteDebit.prix_cbm_usd * noteDebit.taux_change).toLocaleString('fr-FR')} Ar</span>
                  </div>
                  {noteDebit.frais_livraison_ariary != null && (
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-200">
                      <span className="text-xs text-gray-600">Frais de livraison</span>
                      <span className="text-xs font-medium text-gray-800">{noteDebit.frais_livraison_ariary.toLocaleString('fr-FR')} Ar</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-gray-800">
                    <span className="text-sm font-bold text-gray-900">TOTAL NOTE DE DÉBIT</span>
                    <span className="text-base font-bold text-blue-700">
                      {(noteDebit.montant_total_ariary + (noteDebit.frais_livraison_ariary || 0)).toLocaleString('fr-FR')} Ar
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Note externe */}
            {noteDebit.note_externe && (
              <div className="px-10 pb-6">
                <div className="bg-amber-50 border border-amber-300 border-l-4 border-l-amber-500 rounded-lg p-4">
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Note externe</div>
                  <div className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{noteDebit.note_externe}</div>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </>
  );
}
