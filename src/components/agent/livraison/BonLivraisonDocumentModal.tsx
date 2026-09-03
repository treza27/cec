import React, { useEffect } from 'react';
import { X, Printer, Building2 } from 'lucide-react';
import { BonLivraison, BonLivraisonColisDetail } from '../../../services/bonLivraisonService';
import { CompanySettings } from '../../../types';

interface BonLivraisonDocumentModalProps {
  bonLivraison: BonLivraison;
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

export default function BonLivraisonDocumentModal({
  bonLivraison,
  settings,
  onClose,
}: BonLivraisonDocumentModalProps) {
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
    const det: BonLivraisonColisDetail[] = bonLivraison.colis_details;

    const rowsHtml = det.map((d, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;color:#374151;">${idx + 1}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;font-weight:600;color:#1d4ed8;">${d.shippingMark || '—'}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;color:#374151;font-size:10px;">${d.trackingNumber || '—'}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;color:#374151;">${d.description}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;color:#374151;">${d.nbPalettesTana}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-weight:500;color:#1f2937;">${d.nbCartonsLivres}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-weight:500;color:#1f2937;">${d.poidsLivre.toFixed(3)}</td>
        <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-weight:500;color:#1f2937;">${d.volumeLivre.toFixed(3)}</td>
      </tr>`).join('');

    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="${nomEnt}" style="width:72px;height:72px;object-fit:contain;flex-shrink:0;" />`
      : `<div style="width:60px;height:60px;background:#dbeafe;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
           <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
         </div>`;

    const partialBadge = bonLivraison.is_partial
      ? `<div style="display:inline-block;margin-top:6px;padding:3px 10px;background:#fef3c7;border:1px solid #fcd34d;border-radius:20px;font-size:10px;font-weight:700;color:#92400e;">LIVRAISON PARTIELLE</div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>Bon de Livraison ${bonLivraison.reference}</title>
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
        <div style="font-size:14px;font-weight:700;color:#111827;line-height:1.2;">Bon de Livraison</div>
        <div style="font-size:22px;font-weight:700;color:#111827;line-height:1.2;margin-top:2px;">${bonLivraison.reference}</div>
        ${partialBadge}
        <div style="font-size:11px;color:#4b5563;margin-top:8px;">Date : ${formatDate(bonLivraison.created_at)}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px;">Départ #${bonLivraison.depart_id}</div>
        ${bonLivraison.client_nom ? `<div style="font-size:11px;color:#374151;margin-top:4px;font-weight:600;border-top:1px solid #e5e7eb;padding-top:4px;">Destinataire : ${bonLivraison.client_nom}</div>` : ''}
      </div>
    </div>

    <!-- Tableau colis -->
    <div style="padding:20px 0 16px;">
      <table>
        <thead>
          <tr style="background-color:#1e40af;color:white;">
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:center;font-weight:600;width:44px;">N°</th>
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:left;font-weight:600;width:120px;">Shipping Mark</th>
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:left;font-weight:600;width:120px;">Tracking</th>
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:left;font-weight:600;">Description</th>
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:center;font-weight:600;width:70px;">Palettes</th>
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:center;font-weight:600;width:70px;">Cartons</th>
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:center;font-weight:600;width:80px;">Poids (kg)</th>
            <th style="border:1px solid #1e3a8a;padding:8px 10px;text-align:center;font-weight:600;width:80px;">Volume (m³)</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
        <tfoot>
          <tr style="background-color:#f3f4f6;">
            <td colspan="5" style="border:1px solid #d1d5db;padding:8px 10px;text-align:right;font-weight:700;color:#111827;">TOTAUX</td>
            <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-weight:700;color:#111827;">${bonLivraison.nb_cartons_total_livre}</td>
            <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-weight:700;color:#111827;">${Number(bonLivraison.poids_total_livre).toFixed(3)}</td>
            <td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-weight:700;color:#111827;">${Number(bonLivraison.volume_total_livre).toFixed(3)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Signatures -->
    <div style="display:flex;justify-content:space-between;margin-top:40px;page-break-inside:avoid;">
      <div style="width:200px;">
        <div style="border-top:1px solid #9ca3af;padding-top:6px;">
          <p style="font-size:11px;color:#6b7280;text-align:center;">Signature livreur</p>
        </div>
      </div>
      <div style="width:200px;">
        <div style="border-top:1px solid #9ca3af;padding-top:6px;">
          <p style="font-size:11px;color:#6b7280;text-align:center;">Signature destinataire</p>
        </div>
      </div>
    </div>

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
  const details: BonLivraisonColisDetail[] = bonLivraison.colis_details;

  return (
    <div className="no-print fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="relative w-full max-w-4xl">
        <div className="no-print flex items-center justify-between mb-4">
          <span className="text-white font-semibold text-sm">
            Bon de Livraison {bonLivraison.reference}
            {bonLivraison.is_partial && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-amber-900">
                Partiel
              </span>
            )}
          </span>
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
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden">

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
                <p className="text-base font-bold text-gray-900 leading-tight">Bon de Livraison</p>
                <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{bonLivraison.reference}</p>
                {bonLivraison.is_partial && (
                  <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Livraison partielle
                  </span>
                )}
                <p className="text-xs text-gray-600 mt-2">Date : {formatDate(bonLivraison.created_at)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Départ #{bonLivraison.depart_id}</p>
                {bonLivraison.client_nom && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Destinataire</p>
                    <p className="text-sm font-bold text-gray-800">{bonLivraison.client_nom}</p>
                  </div>
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
                  <th className="px-3 py-2.5 font-semibold text-left" style={{ border: '1px solid #1e3a8a', width: '120px' }}>Tracking</th>
                  <th className="px-3 py-2.5 font-semibold text-left" style={{ border: '1px solid #1e3a8a' }}>Description</th>
                  <th className="px-3 py-2.5 font-semibold text-center" style={{ border: '1px solid #1e3a8a', width: '70px' }}>Palettes</th>
                  <th className="px-3 py-2.5 font-semibold text-center" style={{ border: '1px solid #1e3a8a', width: '70px' }}>Cartons</th>
                  <th className="px-3 py-2.5 font-semibold text-center" style={{ border: '1px solid #1e3a8a', width: '80px' }}>Poids (kg)</th>
                  <th className="px-3 py-2.5 font-semibold text-center" style={{ border: '1px solid #1e3a8a', width: '80px' }}>Volume (m³)</th>
                </tr>
              </thead>
              <tbody>
                {details.map((detail, idx) => (
                  <tr key={detail.id} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td className="px-3 py-3 text-center text-gray-700" style={{ border: '1px solid #d1d5db' }}>{idx + 1}</td>
                    <td className="px-3 py-3 font-semibold text-blue-700" style={{ border: '1px solid #d1d5db' }}>{detail.shippingMark || '—'}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs" style={{ border: '1px solid #d1d5db' }}>{detail.trackingNumber || '—'}</td>
                    <td className="px-3 py-3 text-gray-700" style={{ border: '1px solid #d1d5db' }}>{detail.description}</td>
                    <td className="px-3 py-3 text-center text-gray-700" style={{ border: '1px solid #d1d5db' }}>{detail.nbPalettesTana}</td>
                    <td className="px-3 py-3 text-center text-gray-800 font-medium" style={{ border: '1px solid #d1d5db' }}>
                      {detail.nbCartonsLivres}
                      {detail.nbCartonsLivres < detail.nbCartonsTana && (
                        <span className="ml-1 text-amber-600 text-xs">/{detail.nbCartonsTana}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-800 font-medium" style={{ border: '1px solid #d1d5db' }}>
                      {detail.poidsLivre.toFixed(3)}
                      {detail.poidsLivre < detail.poidsTana && (
                        <span className="ml-1 text-amber-600 text-xs">/{detail.poidsTana}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-800 font-medium" style={{ border: '1px solid #d1d5db' }}>
                      {detail.volumeLivre.toFixed(3)}
                      {detail.volumeLivre < detail.volumeTana && (
                        <span className="ml-1 text-amber-600 text-xs">/{detail.volumeTana}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <td colSpan={5} className="px-3 py-3 text-right font-bold text-gray-900" style={{ border: '1px solid #d1d5db' }}>TOTAUX</td>
                  <td className="px-3 py-3 text-center font-bold text-gray-900" style={{ border: '1px solid #d1d5db' }}>
                    {bonLivraison.nb_cartons_total_livre}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-gray-900" style={{ border: '1px solid #d1d5db' }}>
                    {Number(bonLivraison.poids_total_livre).toFixed(3)}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-gray-900" style={{ border: '1px solid #d1d5db' }}>
                    {Number(bonLivraison.volume_total_livre).toFixed(3)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures */}
          <div className="px-10 pb-10">
            <div className="flex justify-between mt-10">
              <div className="w-48">
                <div className="border-t border-gray-400 pt-2">
                  <p className="text-xs text-gray-500 text-center">Signature livreur</p>
                </div>
              </div>
              <div className="w-48">
                <div className="border-t border-gray-400 pt-2">
                  <p className="text-xs text-gray-500 text-center">Signature destinataire</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
