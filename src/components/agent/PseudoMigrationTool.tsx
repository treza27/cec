import React, { useState, useEffect } from 'react';
import { Package, User, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';

interface PackageWithoutPseudo {
  id: number;
  bl: string;
  shipping_mark: string | null;
  description: string;
  statut: string;
  created_at: string;
  suggestedPseudo?: string;
  suggestedClient?: {
    id: number;
    nom: string;
    prenom: string;
    pseudo: string;
    telephone: string;
  };
}

export default function PseudoMigrationTool() {
  const [packages, setPackages] = useState<PackageWithoutPseudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [stats, setStats] = useState({ total: 0, withPseudo: 0, withoutPseudo: 0 });

  useEffect(() => {
    loadPackagesWithoutPseudo();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { count: total } = await supabase
        .from('inventaire')
        .select('*', { count: 'exact', head: true })
        .neq('statut', 'archive');

      const { count: withPseudo } = await supabase
        .from('inventaire')
        .select('*', { count: 'exact', head: true })
        .neq('statut', 'archive')
        .not('pseudo', 'is', null)
        .neq('pseudo', '');

      setStats({
        total: total || 0,
        withPseudo: withPseudo || 0,
        withoutPseudo: (total || 0) - (withPseudo || 0)
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const loadPackagesWithoutPseudo = async () => {
    setLoading(true);
    try {
      const { data: packagesData, error: packagesError } = await supabase
        .from('inventaire')
        .select('id, bl, shipping_mark, description, statut, created_at, pseudo')
        .neq('statut', 'archive')
        .or('pseudo.is.null,pseudo.eq.')
        .order('created_at', { ascending: false })
        .limit(100);

      if (packagesError) throw packagesError;

      const packagesWithSuggestions = await Promise.all(
        (packagesData || []).map(async (pkg) => {
          if (pkg.shipping_mark) {
            const { data: clientData } = await supabase
              .from('client_shipping_marks')
              .select(`
                client_id,
                clients(id, nom, prenom, pseudo, telephone)
              `)
              .eq('shipping_mark', pkg.shipping_mark)
              .eq('is_active', true)
              .maybeSingle();

            if (clientData && clientData.clients) {
              const client = clientData.clients as any;
              return {
                ...pkg,
                suggestedPseudo: client.pseudo,
                suggestedClient: {
                  id: client.id,
                  nom: client.nom,
                  prenom: client.prenom,
                  pseudo: client.pseudo,
                  telephone: client.telephone
                }
              };
            }
          }
          return pkg;
        })
      );

      setPackages(packagesWithSuggestions);
    } catch (error) {
      console.error('Erreur lors du chargement des colis:', error);
      toast.error('Erreur lors du chargement des colis sans pseudo');
    } finally {
      setLoading(false);
    }
  };

  const updatePackagePseudo = async (packageId: number, pseudo: string) => {
    setUpdating(packageId);
    try {
      const { error } = await supabase
        .from('inventaire')
        .update({ pseudo: pseudo })
        .eq('id', packageId);

      if (error) throw error;

      toast.success('Pseudo mis à jour avec succès');

      setPackages(prev => prev.filter(p => p.id !== packageId));

      await loadStats();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour du pseudo');
    } finally {
      setUpdating(null);
    }
  };

  const updateAllWithSuggestions = async () => {
    const packagesWithSuggestions = packages.filter(p => p.suggestedPseudo);

    if (packagesWithSuggestions.length === 0) {
      toast.error('Aucun colis avec suggestion de pseudo');
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous mettre à jour ${packagesWithSuggestions.length} colis avec leurs suggestions de pseudo ?`
    );

    if (!confirmed) return;

    let successCount = 0;
    let errorCount = 0;

    for (const pkg of packagesWithSuggestions) {
      if (pkg.suggestedPseudo) {
        try {
          await updatePackagePseudo(pkg.id, pkg.suggestedPseudo);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }
    }

    toast.success(`${successCount} colis mis à jour avec succès${errorCount > 0 ? `, ${errorCount} erreurs` : ''}`);
    await loadPackagesWithoutPseudo();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <RefreshCw className="w-6 h-6" />
              Outil de Migration des Pseudos
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Assignez les pseudos clients aux colis existants
            </p>
          </div>
          <button
            onClick={loadPackagesWithoutPseudo}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <Package className="w-5 h-5" />
              <span className="text-sm font-medium">Total des colis</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Avec pseudo</span>
            </div>
            <p className="text-3xl font-bold text-green-900">{stats.withPseudo}</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-700 mb-1">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Sans pseudo</span>
            </div>
            <p className="text-3xl font-bold text-orange-900">{stats.withoutPseudo}</p>
          </div>
        </div>

        {packages.length > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={updateAllWithSuggestions}
              disabled={!packages.some(p => p.suggestedPseudo)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mettre à jour tous avec suggestions
            </button>
          </div>
        )}

        <div className="space-y-3">
          {packages.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tous les colis ont un pseudo !
              </h3>
              <p className="text-gray-600">
                Aucun colis sans pseudo trouvé dans la base de données.
              </p>
            </div>
          ) : (
            packages.map((pkg) => (
              <div
                key={pkg.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">
                        Colis #{pkg.id}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {pkg.statut}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>BL:</strong> {pkg.bl || 'N/A'}</p>
                      <p><strong>Shipping Mark:</strong> {pkg.shipping_mark || 'N/A'}</p>
                      <p><strong>Description:</strong> {pkg.description}</p>
                      <p className="text-xs text-gray-500">
                        Créé le {new Date(pkg.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    {pkg.suggestedClient && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-900">
                            Suggestion de client
                          </span>
                        </div>
                        <div className="text-sm text-blue-800 space-y-1">
                          <p><strong>Pseudo:</strong> {pkg.suggestedClient.pseudo}</p>
                          <p><strong>Nom:</strong> {pkg.suggestedClient.nom} {pkg.suggestedClient.prenom}</p>
                          <p><strong>Tél:</strong> {pkg.suggestedClient.telephone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    {pkg.suggestedPseudo ? (
                      <button
                        onClick={() => updatePackagePseudo(pkg.id, pkg.suggestedPseudo!)}
                        disabled={updating === pkg.id}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                      >
                        {updating === pkg.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Mise à jour...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Appliquer
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="text-xs text-orange-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Pas de suggestion
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
