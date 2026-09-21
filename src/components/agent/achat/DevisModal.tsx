import React, { useEffect, useRef } from 'react';
import { X, Printer, Building2 } from 'lucide-react';
import { DemandeAchat, AchatArticle, CompanySettings } from '../../../types';

interface DevisModalProps {
  demande: DemandeAchat;
  articles: AchatArticle[];
  settings: CompanySettings | null;
  onClose: () => void;
}

function formatDevisNumber(id: number): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const paddedId = String(id).padStart(3, '0');
  return `SA${year}${paddedId}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function calcPrixLigne(
  prixUnitaire: number | null | undefined,
  quantite: number,
  taux: number | null | undefined
): number | null {
  const p = Number(prixUnitaire ?? 0);
  const t = Number(taux ?? 0);
  const q = Number(quantite ?? 1);
  if (!t || !p) return null;
  return p * q * t;
}

export default function DevisModal({ demande, articles, settings, onClose }: DevisModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const devisNumber = formatDevisNumber(demande.id);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handlePrint = () => {
    const printArea = printRef.current;
    if (!printArea) return;

    const styleSheets = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((rule) => rule.cssText).join('\n');
        } catch {
          return '';
        }
      })
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Devis ${devisNumber}</title>
    <style>
      ${styleSheets}
      @page { size: A4 portrait; margin: 12mm 14mm; }
      html, body { margin: 0; padding: 0; background: white; font-family: sans-serif; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
      .no-print { display: none !important; }
      #devis-print-area { box-shadow: none !important; border-radius: 0 !important; width: 100%; }
      @media screen {
        body { padding: 20px; background: #f3f4f6; }
        #devis-wrap { max-width: 210mm; margin: 0 auto; background: white; box-shadow: 0 4px 24px rgba(0,0,0,0.12); border-radius: 0.5rem; overflow: hidden; }
      }
      @media print {
        @page { size: A4 portrait; margin: 12mm 14mm; }
        body { background: white !important; padding: 0 !important; margin: 0 !important; }
        #devis-wrap { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
        #devis-print-area { position: static !important; width: 100% !important; height: auto !important; overflow: visible !important; box-shadow: none !important; }
        table { page-break-inside: auto; width: 100%; border-collapse: collapse; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        td, th { page-break-inside: avoid; }
        .devis-totaux-block { page-break-inside: avoid; }
        .devis-conditions-block { page-break-inside: avoid; }
        .devis-footer-block { page-break-inside: avoid; }
        img { max-height: 60px !important; }
      }
    </style>
  </head>
  <body>
    <div id="devis-wrap">
      ${printArea.outerHTML}
    </div>
    <script>
      window.addEventListener('load', function() {
        setTimeout(function() { window.print(); }, 800);
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

  const dateDevis = formatDate(demande.date_validation || demande.date_creation);
  const taux = demande.taux_change_vendu;

  const fraisPortGlobaux = demande.frais_port_locaux_rmb;
  const fraisPortAr = (Number(fraisPortGlobaux ?? 0)) * (Number(taux ?? 0));

  const sousTotalArticles = articles.reduce((sum, a) => {
    const prix = calcPrixLigne(a.prix_unitaire_rmb, a.quantite, taux);
    return sum + (prix ?? 0);
  }, 0);
  const totalPrix = sousTotalArticles + fraisPortAr;

  const totalQuantite = articles.reduce((sum, a) => sum + (Number(a.quantite) || 0), 0);

  const nomEntreprise = settings?.nom_entreprise || 'Votre Entreprise';
  const adresse = settings?.adresse || '';
  const telephone = settings?.telephone || '';
  const siteWeb = settings?.site_web || '';
  const conditionsPaiement = settings?.conditions_paiement || '';
  const signatureDevis = settings?.signature_devis || '';

  return (
    <>
      <div className="no-print fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
        <div className="relative w-full max-w-4xl">
          <div className="no-print flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">Devis {devisNumber}</span>
            </div>
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
          <div ref={printRef} id="devis-print-area" className="bg-white shadow-2xl rounded-lg overflow-hidden devis-page">

            {/* En-tête */}
            <div className="px-10 pt-8 pb-6 border-b border-gray-300">
              <div className="flex items-start justify-between gap-6">
                {/* Logo + Infos entreprise */}
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
                      {telephone && (
                        <p className="text-xs text-gray-500">Tél : {telephone}</p>
                      )}
                      {siteWeb && (
                        <p className="text-xs text-gray-500">Site : {siteWeb}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bloc Devis ACHAT */}
                <div className="text-right flex-shrink-0 pt-1">
                  <p className="text-base font-bold text-gray-900 leading-tight">Devis ACHAT</p>
                  <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{devisNumber}</p>
                  <p className="text-xs text-gray-600 mt-2">Date : {dateDevis}</p>
                  {demande.assigne_a?.full_name && (
                    <p className="text-xs text-gray-600">Acheteur : {demande.assigne_a.full_name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bloc Client */}
            <div className="px-10 py-5 border-b border-gray-200">
              <p className="text-sm font-bold text-gray-900 mb-1">Client</p>
              <p className="text-sm text-gray-800">
                {demande.client?.prenom} {demande.client?.nom}
              </p>
              {demande.client?.pseudo && (
                <p className="text-xs text-gray-600">Pseudo : {demande.client.pseudo}</p>
              )}
              {demande.client?.telephone && (
                <p className="text-xs text-gray-600">Tél : {demande.client.telephone}</p>
              )}
            </div>

            {/* Tableau articles */}
            <div className="px-10 py-6">
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#2563EB', color: 'white' }}>
                    <th className="px-3 py-2.5 font-semibold text-center" style={{ border: '1px solid #1d4ed8', width: '48px' }}>Numéro</th>
                    <th className="px-3 py-2.5 font-semibold text-left" style={{ border: '1px solid #1d4ed8' }}>Article</th>
                    <th className="px-3 py-2.5 font-semibold text-center" style={{ border: '1px solid #1d4ed8', width: '90px' }}>Référence</th>
                    <th className="px-3 py-2.5 font-semibold text-center" style={{ border: '1px solid #1d4ed8', width: '72px' }}>Quantité</th>
                    <th className="px-3 py-2.5 font-semibold text-center" style={{ border: '1px solid #1d4ed8', width: '100px' }}>P.U.</th>
                    <th className="px-3 py-2.5 font-semibold text-center" style={{ border: '1px solid #1d4ed8', width: '110px' }}>Total MGA</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article, idx) => {
                    const prixUnitAr = taux ? (Number(article.prix_unitaire_rmb ?? 0) * taux) : null;
                    const prixLigne = calcPrixLigne(
                      article.prix_unitaire_rmb,
                      article.quantite,
                      taux
                    );

                    return (
                      <tr key={article.id} style={{ backgroundColor: 'white' }}>
                        <td className="px-3 py-3 text-center text-gray-700" style={{ border: '1px solid #d1d5db' }}>{idx + 1}</td>
                        <td className="px-3 py-3" style={{ border: '1px solid #d1d5db' }}>
                          <div className="flex items-center gap-3">
                            {article.photo_url && (
                              <img
                                src={article.photo_url}
                                alt={article.nom_article}
                                className="object-contain flex-shrink-0"
                                style={{ width: '60px', height: '60px' }}
                              />
                            )}
                            <span className="text-gray-900 font-medium">{article.nom_article}</span>
                          </div>
                          {article.description && (
                            <p className="text-gray-400 text-xs mt-0.5">{article.description}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-700 text-xs" style={{ border: '1px solid #d1d5db' }}>
                          {article.reference || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-800" style={{ border: '1px solid #d1d5db' }}>{article.quantite}</td>
                        <td className="px-3 py-3 text-center text-gray-800" style={{ border: '1px solid #d1d5db' }}>
                          {prixUnitAr != null
                            ? Math.round(prixUnitAr).toLocaleString('fr-FR')
                            : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-3 py-3 text-center font-medium text-gray-900" style={{ border: '1px solid #d1d5db' }}>
                          {prixLigne != null
                            ? Math.round(prixLigne).toLocaleString('fr-FR')
                            : <span className="text-gray-300 font-normal">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Récapitulatif totaux */}
            <div className="px-10 pb-6 devis-totaux-block">
              <div className="flex justify-end">
                <div className="w-64">
                  {totalQuantite > 0 && (
                    <div className="flex items-center justify-between py-1 border-b border-gray-200 mb-1">
                      <span className="text-xs text-gray-600">Quantite totale</span>
                      <span className="text-xs text-gray-800">{totalQuantite}</span>
                    </div>
                  )}
                  {sousTotalArticles > 0 && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs text-gray-600">Sous total achat</span>
                      <span className="text-xs text-gray-800">{Math.round(sousTotalArticles).toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                  {fraisPortAr > 0 && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs text-gray-600">Frais de port local</span>
                      <span className="text-xs text-gray-800">{Math.round(fraisPortAr).toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-300">
                    <span className="text-sm font-bold text-gray-900">TOTAL</span>
                    <span className="text-base font-bold text-gray-900">
                      {Math.round(totalPrix).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>


            {/* Conditions de paiement */}
            {(conditionsPaiement || signatureDevis) && (
              <div className="px-10 pb-6 devis-conditions-block">
                {conditionsPaiement && (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-900 mb-1">Conditions de paiement</p>
                    {conditionsPaiement.split('\n').map((line, i) => (
                      <p key={i} className="text-xs text-gray-600 italic leading-relaxed">{line}</p>
                    ))}
                  </div>
                )}
                {signatureDevis && (
                  <p className="text-xs text-gray-600 italic mt-3">{signatureDevis}</p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
