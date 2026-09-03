import { supabase } from '../utils/supabase';
import { InventoryItem } from '../types';
import toast from 'react-hot-toast';
import { clientShippingMarkService } from './clientShippingMarkService';

// Types pour les données Supabase
export interface SupabaseInventoryItem {
  id: number;
  bl: string;
  date_entree: string;
  entrepot: string | null;
  pseudo: string | null;
  shipping_mark: string | null;
  description: string;
  nb_palettes: number | null;
  nb_cartons: number | null;
  poids: number;
  volume: number;
  statut: string | null;
  nb_palettes_tana: number | null;
  nb_cartons_tana: number | null;
  poids_tana: number | null;
  volume_tana: number | null;
  id_depart: number | null;
  created_at: string | null;
  updated_at: string | null;
  tracking_number: string | null;
  point_enlevement: string | null;
  point_enlevement_souhaite: string | null;
  date_mise_disposition: string | null;
}

// Conversion Supabase -> App
export const convertFromSupabase = (supabaseItem: SupabaseInventoryItem): InventoryItem => {
  return {
    id: supabaseItem.id,
    bl: supabaseItem.bl,
    dateEntree: supabaseItem.date_entree,
    entrepot: supabaseItem.entrepot || '',
    pseudo: supabaseItem.pseudo || '',
    shippingMark: supabaseItem.shipping_mark || '',
    description: supabaseItem.description,
    nbPalettes: supabaseItem.nb_palettes != null ? supabaseItem.nb_palettes.toString() : '',
    nbCartons: (supabaseItem.nb_cartons || 1).toString(),
    poids: supabaseItem.poids != null ? supabaseItem.poids.toString() : '',
    volume: supabaseItem.volume != null ? supabaseItem.volume.toString() : '',
    images: [],
    statut: supabaseItem.statut || 'enregistre_chine',
    nbPalettesTana: supabaseItem.nb_palettes_tana?.toString() || '',
    nbCartonsTana: supabaseItem.nb_cartons_tana?.toString() || '',
    poidsTana: supabaseItem.poids_tana?.toString() || '',
    volumeTana: supabaseItem.volume_tana?.toString() || '',
    id_depart: supabaseItem.id_depart,
    trackingNumber: supabaseItem.tracking_number || '',
    point_enlevement: supabaseItem.point_enlevement as 'depot_anosizato' | 'bureaux_ambodivona' | null,
    point_enlevement_souhaite: supabaseItem.point_enlevement_souhaite as 'depot_anosizato' | 'bureaux_ambodivona' | null,
    date_mise_disposition: supabaseItem.date_mise_disposition || undefined
  };
};

// Conversion App -> Supabase
export const convertToSupabase = (item: Partial<InventoryItem>) => {
  return {
    ...(item.bl !== undefined && { bl: item.bl || '' }),
    ...(item.dateEntree !== undefined && { date_entree: item.dateEntree }),
    ...(item.entrepot !== undefined && { entrepot: item.entrepot || null }),
    ...(item.pseudo !== undefined && { pseudo: item.pseudo || null }),
    ...(item.shippingMark !== undefined && { shipping_mark: item.shippingMark || null }),
    ...(item.description !== undefined && { description: item.description || '' }),
    ...(item.nbPalettes !== undefined && { nb_palettes: Math.max(0, parseInt(item.nbPalettes) || 0) }),
    ...(item.nbCartons !== undefined && { nb_cartons: Math.max(1, parseInt(item.nbCartons) || 1) }),
    ...(item.poids !== undefined && { poids: item.poids && item.poids.trim() ? parseFloat(item.poids) || null : null }),
    ...(item.volume !== undefined && { volume: item.volume && item.volume.trim() ? parseFloat(item.volume) || null : null }),
    ...(item.statut && { statut: item.statut }),
    ...(item.nbPalettesTana !== undefined && { nb_palettes_tana: item.nbPalettesTana && item.nbPalettesTana.trim() ? Math.max(0, parseInt(item.nbPalettesTana)) : null }),
    ...(item.nbCartonsTana !== undefined && { nb_cartons_tana: item.nbCartonsTana && item.nbCartonsTana.trim() ? Math.max(0, parseInt(item.nbCartonsTana)) : null }),
    ...(item.poidsTana !== undefined && { poids_tana: item.poidsTana && item.poidsTana.trim() ? (parseFloat(item.poidsTana) > 0 ? parseFloat(item.poidsTana) : null) : null }),
    ...(item.volumeTana !== undefined && { volume_tana: item.volumeTana && item.volumeTana.trim() ? (parseFloat(item.volumeTana) > 0 ? parseFloat(item.volumeTana) : null) : null }),
    ...(item.id_depart !== undefined && { id_depart: item.id_depart }),
    ...(item.trackingNumber !== undefined && { tracking_number: item.trackingNumber ? item.trackingNumber.trim().toUpperCase() : null }),
    ...(item.point_enlevement !== undefined && { point_enlevement: item.point_enlevement }),
    ...(item.point_enlevement_souhaite !== undefined && { point_enlevement_souhaite: item.point_enlevement_souhaite }),
    ...(item.date_mise_disposition !== undefined && { date_mise_disposition: item.date_mise_disposition })
  };
};

export const PAGE_SIZE = 500;

// Services API
export const inventoryService = {
  // Récupérer tous les items
  async getAll(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventaire')
      .select('*')
      .neq('statut', 'archive')
      .order('id', { ascending: false })
      .limit(10000);

    if (error) {
      throw new Error(`Erreur lors de la récupération de l'inventaire: ${error.message}`);
    }

    return (data || []).map(convertFromSupabase);
  },

  // Récupérer une page d'items avec count total
  async getPage(page: number, search: string): Promise<{ items: InventoryItem[]; total: number }> {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('inventaire')
      .select('*', { count: 'exact' })
      .neq('statut', 'archive')
      .order('id', { ascending: false });

    if (search.trim()) {
      const s = search.trim();
      query = query.or(
        `shipping_mark.ilike.%${s}%,description.ilike.%${s}%,bl.ilike.%${s}%,tracking_number.ilike.%${s}%,pseudo.ilike.%${s}%`
      );
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new Error(`Erreur lors de la récupération de l'inventaire: ${error.message}`);
    }

    return {
      items: (data || []).map(convertFromSupabase),
      total: count ?? 0
    };
  },

  // Récupérer tous les items (y compris archivés)
  async getAllIncludingArchived(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventaire')
      .select('*')
      .order('id', { ascending: true })
      .limit(10000);

    if (error) {
      throw new Error(`Erreur lors de la récupération de l'inventaire complet: ${error.message}`);
    }

    return (data || []).map(convertFromSupabase);
  },

  // Récupérer les statistiques globales (toutes pages confondues)
  async getGlobalStats(search: string): Promise<{ totalPalettes: number; totalCartons: number; totalPoids: number; totalVolume: number }> {
    let query = supabase
      .from('inventaire')
      .select('nb_palettes, nb_cartons, poids, volume')
      .neq('statut', 'archive');

    if (search.trim()) {
      const s = search.trim();
      query = query.or(
        `shipping_mark.ilike.%${s}%,description.ilike.%${s}%,bl.ilike.%${s}%,tracking_number.ilike.%${s}%,pseudo.ilike.%${s}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur lors du calcul des statistiques: ${error.message}`);
    }

    return (data || []).reduce((totals, row) => ({
      totalPalettes: totals.totalPalettes + (row.nb_palettes || 0),
      totalCartons: totals.totalCartons + (row.nb_cartons || 0),
      totalPoids: totals.totalPoids + (row.poids || 0),
      totalVolume: totals.totalVolume + (row.volume || 0)
    }), { totalPalettes: 0, totalCartons: 0, totalPoids: 0, totalVolume: 0 });
  },

  // Récupérer des items par liste d'IDs (sans filtre de statut)
  async getByIds(ids: number[]): Promise<InventoryItem[]> {
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('inventaire')
      .select('*')
      .in('id', ids);

    if (error) {
      throw new Error(`Erreur lors de la récupération des items: ${error.message}`);
    }

    return (data || []).map(convertFromSupabase);
  },

  // Récupérer un item par ID
  async getById(id: number): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventaire')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Erreur lors de la récupération de l'item ${id}: ${error.message}`);
    }

    return convertFromSupabase(data);
  },

  // Créer un nouvel item
  async create(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const supabaseData = convertToSupabase(item);
    
    const { data, error } = await supabase
      .from('inventaire')
      .insert(supabaseData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la création de l'item: ${error.message}`);
    }

    return convertFromSupabase(data);
  },

  // Mettre à jour un item
  async update(id: number, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const supabaseData = convertToSupabase(updates);
    
    const { data, error } = await supabase
      .from('inventaire')
      .update(supabaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour de l'item ${id}: ${error.message}`);
    }

    return convertFromSupabase(data);
  },

  // Supprimer un item
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('inventaire')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erreur lors de la suppression de l'item ${id}: ${error.message}`);
    }
  },

  // Supprimer plusieurs items
  async deleteMultiple(ids: number[]): Promise<void> {
    const { error } = await supabase
      .from('inventaire')
      .delete()
      .in('id', ids);

    if (error) {
      throw new Error(`Erreur lors de la suppression des items: ${error.message}`);
    }
  },

  // Mettre à jour le statut de plusieurs items
  async updateStatus(ids: number[], status: string): Promise<void> {
    const { error } = await supabase
      .from('inventaire')
      .update({ statut: status })
      .in('id', ids);

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
  },

  // Mettre à jour les valeurs mesurées à Tana
  async updateMeasuredValues(id: number, measuredValues: {
    nbPalettesTana?: string;
    nbCartonsTana?: string;
    poidsTana?: string;
    volumeTana?: string;
  }): Promise<InventoryItem> {
    const supabaseData = convertToSupabase(measuredValues);
    
    const { data, error } = await supabase
      .from('inventaire')
      .update(supabaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la mise à jour des valeurs mesurées pour l'item ${id}: ${error.message}`);
    }

    return convertFromSupabase(data);
  },

  // Archiver un colis
  async archive(id: number): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventaire')
      .update({ statut: 'archive' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de l'archivage du colis ${id}: ${error.message}`);
    }

    return convertFromSupabase(data);
  },

  // Récupérer tous les colis archivés
  async getAllArchived(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventaire')
      .select('*')
      .eq('statut', 'archive')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des colis archivés: ${error.message}`);
    }

    return (data || []).map(convertFromSupabase);
  },

  // Rechercher des colis par pseudo uniquement
  async searchPackagesByPseudo(pseudo: string): Promise<InventoryItem[]> {
    try {
      console.log('🔍 DEBUT - Recherche de colis par pseudo:', JSON.stringify(pseudo));
      console.log('🔍 Pseudo reçu - longueur:', pseudo.length);
      console.log('🔍 Pseudo reçu - caractères:', pseudo.split('').map(c => `"${c}"`).join(', '));

      // Test de connexion Supabase
      console.log('🔗 Test de connexion Supabase...');
      const { data: testConnection, error: connectionError } = await supabase
        .from('clients')
        .select('count')
        .limit(1);

      console.log('🔗 Résultat test connexion:', { testConnection, connectionError });

      if (connectionError) {
        console.error('❌ ERREUR DE CONNEXION SUPABASE:', connectionError);
        throw new Error(`Erreur de connexion Supabase: ${connectionError.message}`);
      }

      // Récupérer TOUS les clients pour diagnostic
      console.log('📋 DIAGNOSTIC - Récupération de TOUS les clients...');
      const { data: allClients, error: allClientsError } = await supabase
        .from('clients')
        .select('id, nom, prenom, pseudo, telephone')
        .order('id');

      console.log('📋 DIAGNOSTIC - Erreur lors de la récupération:', allClientsError);
      console.log('📋 DIAGNOSTIC - Nombre total de clients:', allClients?.length || 0);

      if (allClients && allClients.length > 0) {
        console.log('📋 DIAGNOSTIC - Liste complète des clients:');
        allClients.forEach((client, index) => {
          console.log(`👤 Client ${index + 1}:`, {
            id: client.id,
            nom: `"${client.nom}"`,
            prenom: `"${client.prenom}"`,
            pseudo: `"${client.pseudo}"`,
            telephone: `"${client.telephone}"`,
            pseudoMatch: client.pseudo === pseudo.trim(),
            pseudoMatchIgnoreCase: client.pseudo?.toLowerCase() === pseudo.trim().toLowerCase()
          });
        });

        // Recherche de correspondances partielles
        const partialMatches = allClients.filter(c =>
          c.pseudo?.toLowerCase().includes(pseudo.toLowerCase())
        );
        console.log('🎯 DIAGNOSTIC - Correspondances partielles trouvées:', partialMatches);
      }

      // Rechercher le client par pseudo
      console.log('🔍 Exécution de la requête principale...');
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select(`
          id,
          nom,
          prenom,
          pseudo,
          entreprise,
          telephone
        `)
        .ilike('pseudo', pseudo.trim());

      console.log('👤 RESULTAT - Recherche client par pseudo:', {
        client,
        error: clientError,
        pseudoRecherche: `"${pseudo.trim()}"`,
        nombreResultats: client?.length || 0
      });

      if (clientError) {
        throw new Error(`Erreur lors de la recherche du client: ${clientError.message}`);
      }

      if (!client || client.length === 0) {
        console.log('❌ AUCUN CLIENT TROUVÉ avec le pseudo:', `"${pseudo.trim()}"`);
        console.log('❌ Vérifiez que le pseudo existe exactement dans la table clients');
        return [];
      }

      const foundClient = client[0];
      console.log('✅ CLIENT TROUVÉ:', {
        id: foundClient.id,
        nom: foundClient.nom,
        prenom: foundClient.prenom,
        pseudo: `"${foundClient.pseudo}"`,
        telephone: foundClient.telephone
      });

      // NOUVELLE LOGIQUE: Rechercher directement les colis par pseudo
      console.log('📦 Recherche des colis par pseudo:', foundClient.pseudo);
      const { data: packages, error: packageError } = await supabase
        .from('inventaire')
        .select('*')
        .eq('pseudo', foundClient.pseudo)
        .order('created_at', { ascending: false });

      console.log('📦 RESULTAT COLIS:', {
        error: packageError,
        nombreColis: packages?.length || 0,
        colis: packages?.map(p => ({
          id: p.id,
          pseudo: p.pseudo,
          shipping_mark: p.shipping_mark,
          description: p.description,
          statut: p.statut
        })) || []
      });

      if (packageError) {
        throw new Error(`Erreur lors de la recherche de colis: ${packageError.message}`);
      }

      console.log('✅ FINAL - Colis trouvés et enrichis:', packages?.length || 0);

      // Récupérer les informations des départs pour associer les numéros de conteneur
      const { data: departures, error: departError } = await supabase
        .from('depart')
        .select('id, num_bl, num_tc, colis_associes, statut');

      if (departError) {
        console.warn('⚠️ Erreur lors de la récupération des départs:', departError.message);
      }

      // Enrichir les colis avec les informations du client
      return (packages || []).map(pkg => {
        const associatedDepart = departures?.find(depart =>
          depart.num_bl === pkg.bl ||
          depart.colis_associes?.map(Number).includes(Number(pkg.id))
        );

        return {
          ...convertFromSupabase(pkg),
          client_id: foundClient.id,
          client_nom: foundClient.nom,
          client_prenom: foundClient.prenom,
          client_pseudo: foundClient.pseudo,
          client_entreprise: foundClient.entreprise,
          client_phone: foundClient.telephone,
          id_depart: associatedDepart?.id || pkg.id_depart || null,
          numTC: associatedDepart?.num_tc || undefined,
          depart_statut: associatedDepart?.statut || undefined
        };
      });
    } catch (error) {
      console.error('❌ ERREUR GENERALE dans searchPackagesByPseudo:', error);
      throw new Error(`Erreur lors de la recherche: ${error}`);
    }
  },

  // Rechercher des colis par informations client (pseudo et téléphone)
  async searchPackagesByClientInfo(clientInfo: { pseudo: string; phone: string }): Promise<InventoryItem[]> {
    try {
      console.log('🔍 Recherche de colis par informations client:', clientInfo);
      console.log('🔍 Pseudo recherché (JSON):', JSON.stringify(clientInfo.pseudo));
      console.log('🔍 Phone recherché (JSON):', JSON.stringify(clientInfo.phone));

      // Test de connexion Supabase
      console.log('🔗 Test de connexion Supabase...');
      const { data: testConnection, error: connectionError } = await supabase
        .from('clients')
        .select('count')
        .limit(1);

      console.log('🔗 Résultat test connexion:', { testConnection, connectionError });

      if (connectionError) {
        console.error('❌ ERREUR DE CONNEXION SUPABASE:', connectionError);
        throw new Error(`Erreur de connexion Supabase: ${connectionError.message}`);
      }

      // Compter le nombre total de clients
      console.log('📊 Comptage du nombre total de clients...');
      const { count: totalClients, error: countError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      console.log('📊 Nombre total de clients dans la base:', totalClients);
      if (countError) {
        console.error('❌ Erreur lors du comptage:', countError);
      }

      // Rechercher le client par pseudo et téléphone
      console.log('🔍 Exécution de la requête Supabase...');
      console.log('🔍 Requête SQL équivalente: SELECT * FROM clients WHERE pseudo = $1 AND telephone = $2');
      console.log('🔍 Paramètres: $1 =', JSON.stringify(clientInfo.pseudo), '$2 =', JSON.stringify(clientInfo.phone));

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select(`
          id,
          nom,
          prenom,
          pseudo,
          entreprise,
          telephone
        `)
        .eq('pseudo', clientInfo.pseudo.trim())
        .eq('telephone', clientInfo.phone.trim());

      console.log('👤 Résultat de la recherche client:', { client, error: clientError });

      // Diagnostic approfondi si pas de client trouvé
      if (clientError || !client || client.length === 0) {
        console.log('🔍 DIAGNOSTIC APPROFONDI - Client non trouvé');
        console.log('🔍 Code d\'erreur Supabase:', clientError?.code);
        console.log('🔍 Message d\'erreur Supabase:', clientError?.message);
        console.log('🔍 Détails complets de l\'erreur:', clientError);

        console.log('🔍 DIAGNOSTIC - Recherche de TOUS les clients pour comparaison...');
        const { data: allClients, error: allClientsError } = await supabase
          .from('clients')
          .select('id, nom, prenom, pseudo, telephone, created_at')
          .order('id');

        console.log('📋 DIAGNOSTIC - Erreur lors de la récupération de tous les clients:', allClientsError);
        if (!allClientsError && allClients) {
          console.log('📋 DIAGNOSTIC - Tous les clients dans la base:', allClients);
          console.log('📋 DIAGNOSTIC - Nombre de clients trouvés:', allClients.length);

          // Afficher chaque client individuellement pour debug
          allClients.forEach((c, index) => {
            console.log(`👤 DIAGNOSTIC - Client ${index + 1}:`, {
              id: c.id,
              nom: c.nom,
              prenom: c.prenom,
              pseudo: `"${c.pseudo}"`,
              telephone: `"${c.telephone}"`,
              pseudoLength: c.pseudo?.length,
              phoneLength: c.telephone?.length,
              pseudoMatch: c.pseudo === clientInfo.pseudo.trim(),
              phoneMatch: c.telephone === clientInfo.phone.trim()
            });
          });

          console.log('📋 DIAGNOSTIC - Recherche de correspondances partielles...');

          // Chercher des correspondances partielles
          const pseudoMatches = allClients.filter(c =>
            c.pseudo?.toLowerCase().includes(clientInfo.pseudo.toLowerCase())
          );

          const phoneMatches = allClients.filter(c =>
            c.telephone?.includes(clientInfo.phone.replace(/\s/g, ''))
          );

          const exactPseudoMatches = allClients.filter(c =>
            c.pseudo === clientInfo.pseudo.trim()
          );

          const exactPhoneMatches = allClients.filter(c =>
            c.telephone === clientInfo.phone.trim()
          );

          console.log('🎯 DIAGNOSTIC - Correspondances pseudo (partielles):', pseudoMatches);
          console.log('🎯 DIAGNOSTIC - Correspondances téléphone (partielles):', phoneMatches);
          console.log('🎯 DIAGNOSTIC - Correspondances pseudo (exactes):', exactPseudoMatches);
          console.log('🎯 DIAGNOSTIC - Correspondances téléphone (exactes):', exactPhoneMatches);

          if (exactPseudoMatches.length > 0 && exactPhoneMatches.length === 0) {
            console.log('⚠️ DIAGNOSTIC - Pseudo trouvé mais téléphone différent !');
            console.log('📞 DIAGNOSTIC - Téléphones dans la base pour ce pseudo:', exactPseudoMatches.map(c => c.telephone));
          }

          if (exactPhoneMatches.length > 0 && exactPseudoMatches.length === 0) {
            console.log('⚠️ DIAGNOSTIC - Téléphone trouvé mais pseudo différent !');
            console.log('👤 DIAGNOSTIC - Pseudos dans la base pour ce téléphone:', exactPhoneMatches.map(c => c.pseudo));
          }

          if (pseudoMatches.length > 0 || phoneMatches.length > 0) {
            console.log('🎯 DIAGNOSTIC - Correspondances partielles trouvées');
          } else {
            console.log('❌ DIAGNOSTIC - Aucune correspondance partielle trouvée');
            console.log('❌ DIAGNOSTIC - Vérifiez que le pseudo et téléphone sont exactement comme dans la base');
          }
        } else {
          console.log('❌ DIAGNOSTIC - Impossible de récupérer la liste des clients:', allClientsError);
        }
      }

      if (clientError) {
        throw new Error(`Erreur lors de la recherche du client: ${clientError.message}`);
      }

      if (!client || client.length === 0) {
        console.log('❌ Aucun client retourné');
        return [];
      }

      const foundClient = client[0];
      console.log('✅ Client trouvé:', foundClient);

      // NOUVELLE LOGIQUE: Rechercher directement les colis par pseudo
      console.log('📦 Recherche des colis par pseudo:', foundClient.pseudo);
      const { data: packages, error: packageError } = await supabase
        .from('inventaire')
        .select('*')
        .eq('pseudo', foundClient.pseudo)
        .order('created_at', { ascending: false });

      console.log('📦 Résultat de la recherche de colis:', { packages, error: packageError });

      if (packageError) {
        throw new Error(`Erreur lors de la recherche de colis: ${packageError.message}`);
      }

      console.log('✅ Colis trouvés (incluant archivés):', packages?.length || 0);
      if (packages && packages.length > 0) {
        console.log('📋 Détails des colis:', packages.map(p => ({
          id: p.id,
          pseudo: p.pseudo,
          shipping_mark: p.shipping_mark,
          description: p.description,
          statut: p.statut
        })));
      }

      // Récupérer les informations des départs pour associer les numéros de conteneur et statuts
      const { data: departures, error: departError } = await supabase
        .from('depart')
        .select('id, num_bl, num_tc, colis_associes, statut');

      if (departError) {
        console.warn('⚠️ Erreur lors de la récupération des départs:', departError.message);
      }

      // Enrichir les colis avec les informations du client
      return (packages || []).map(pkg => {
        const associatedDepart = departures?.find(depart =>
          depart.num_bl === pkg.bl ||
          depart.colis_associes?.map(Number).includes(Number(pkg.id))
        );

        return {
          ...convertFromSupabase(pkg),
          client_id: foundClient.id,
          client_nom: foundClient.nom,
          client_prenom: foundClient.prenom,
          client_pseudo: foundClient.pseudo,
          client_entreprise: foundClient.entreprise,
          client_phone: foundClient.telephone,
          id_depart: associatedDepart?.id || pkg.id_depart || null,
          numTC: associatedDepart?.num_tc || undefined,
          depart_statut: associatedDepart?.statut || undefined
        };
      });
    } catch (error) {
      throw new Error(`Erreur lors de la recherche: ${error}`);
    }
  },

  // Rechercher des colis par shipping mark et informations client (fonction legacy - à supprimer plus tard)
  async searchByShippingMarkAndClient(shippingMark: string, clientInfo: { pseudo?: string; phone?: string }): Promise<InventoryItem[]> {
    try {
      // Rediriger vers la nouvelle fonction si on a pseudo et phone
      if (clientInfo.pseudo && clientInfo.phone) {
        return this.searchPackagesByClientInfo({
          pseudo: clientInfo.pseudo,
          phone: clientInfo.phone
        });
      }

      // Ancienne logique pour compatibilité
      let clientQuery = supabase
        .from('clients')
        .select(`
          id,
          nom,
          prenom,
          pseudo,
          telephone,
          client_shipping_marks!inner(shipping_mark)
        `);

      // Filtrer par shipping mark si fournie
      if (shippingMark) {
        clientQuery = clientQuery.eq('client_shipping_marks.shipping_mark', shippingMark);
      }

      // Filtrer par pseudo (nom + prénom) si fourni
      if (clientInfo.pseudo) {
        const [prenom, ...nomParts] = clientInfo.pseudo.split(' ');
        const nom = nomParts.join(' ');
        if (nom) {
          clientQuery = clientQuery.eq('prenom', prenom).eq('nom', nom);
        } else {
          // Si un seul mot, chercher dans nom OU prénom
          clientQuery = clientQuery.or(`nom.ilike.%${clientInfo.pseudo}%,prenom.ilike.%${clientInfo.pseudo}%`);
        }
      }

      // Filtrer par téléphone si fourni
      if (clientInfo.phone) {
        clientQuery = clientQuery.eq('telephone', clientInfo.phone);
      }

      const { data: clients, error: clientError } = await clientQuery;

      if (clientError) {
        throw new Error(`Erreur lors de la recherche de clients: ${clientError.message}`);
      }

      if (!clients || clients.length === 0) {
        return [];
      }

      // Récupérer les shipping marks des clients trouvés
      const clientShippingMarks = clients.flatMap(client => 
        client.client_shipping_marks.map((mark: any) => mark.shipping_mark)
      );

      // Rechercher les colis avec ces shipping marks
      const { data: packages, error: packageError } = await supabase
        .from('inventaire')
        .select('*')
        .in('shipping_mark', clientShippingMarks)
        .neq('statut', 'archive')
        .order('created_at', { ascending: false });

      if (packageError) {
        throw new Error(`Erreur lors de la recherche de colis: ${packageError.message}`);
      }

      // Récupérer les informations des départs pour associer les numéros de conteneur
      const { data: departures, error: departError } = await supabase
        .from('depart')
        .select('id, num_bl, num_tc, colis_associes, statut');

      if (departError) {
        console.warn('⚠️ Erreur lors de la récupération des départs:', departError.message);
      }

      // Enrichir avec les informations du premier client trouvé
      const firstClient = clients[0];
      return (packages || []).map(pkg => ({
        ...convertFromSupabase(pkg),
        client_id: firstClient.id,
        client_nom: firstClient.nom,
        client_prenom: firstClient.prenom,
        client_pseudo: firstClient.pseudo,
        client_entreprise: firstClient.entreprise,
        client_phone: firstClient.telephone,
        numTC: departures?.find(depart => 
          depart.num_bl === pkg.bl || 
          depart.colis_associes?.map(Number).includes(Number(pkg.id))
        )?.num_tc || undefined,
        depart_statut: departures?.find(depart => 
          depart.num_bl === pkg.bl || 
          depart.colis_associes?.map(Number).includes(Number(pkg.id))
        )?.statut || undefined
      }));
    } catch (error) {
      throw new Error(`Erreur lors de la recherche: ${error}`);
    }
  },

  async searchByTrackingNumber(trackingNumber: string): Promise<InventoryItem[]> {
    try {
      console.log('🔍 Recherche par numéro de suivi:', trackingNumber);

      const { data: packages, error: packageError } = await supabase
        .from('inventaire')
        .select('*')
        .eq('tracking_number', trackingNumber.trim());

      if (packageError) {
        throw new Error(`Erreur lors de la recherche par numéro de suivi: ${packageError.message}`);
      }

      if (!packages || packages.length === 0) {
        console.log('❌ Aucun colis trouvé avec ce numéro de suivi');
        return [];
      }

      console.log('✅ Colis trouvé avec le numéro de suivi:', packages);

      const { data: departures, error: departError } = await supabase
        .from('depart')
        .select('id, num_bl, num_tc, colis_associes, statut');

      if (departError) {
        console.warn('⚠️ Erreur lors de la récupération des départs:', departError.message);
      }

      const packageWithDepart = packages.map(pkg => {
        const associatedDepart = departures?.find(depart =>
          depart.num_bl === pkg.bl ||
          depart.colis_associes?.map(Number).includes(Number(pkg.id))
        );

        return {
          ...convertFromSupabase(pkg),
          id_depart: associatedDepart?.id || pkg.id_depart || null,
          numTC: associatedDepart?.num_tc || undefined,
          depart_statut: associatedDepart?.statut || undefined
        };
      });

      // NOUVELLE LOGIQUE: Récupérer le client via le pseudo du colis
      const pseudoFromPackage = packages[0]?.pseudo;
      if (pseudoFromPackage) {
        console.log('🔍 Recherche du client par pseudo du colis:', pseudoFromPackage);
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id, nom, prenom, pseudo, entreprise, telephone')
          .eq('pseudo', pseudoFromPackage)
          .maybeSingle();

        if (!clientError && client) {
          console.log('✅ Client trouvé pour le pseudo:', client);
          return packageWithDepart.map(pkg => ({
            ...pkg,
            client_id: client.id,
            client_nom: client.nom,
            client_prenom: client.prenom,
            client_pseudo: client.pseudo,
            client_entreprise: client.entreprise,
            client_phone: client.telephone
          }));
        } else {
          console.log('⚠️ Aucun client trouvé pour le pseudo:', pseudoFromPackage);
        }
      }

      return packageWithDepart;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche par numéro de suivi: ${error}`);
    }
  },

  async getAllTrackingNumbers(): Promise<string[]> {
    const PAGE_SIZE = 1000;
    const allTrackingNumbers: string[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('inventaire')
        .select('tracking_number')
        .not('tracking_number', 'is', null)
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Erreur lors de la récupération des tracking numbers: ${error.message}`);
      }

      const page = (data || [])
        .map((item: any) => item.tracking_number)
        .filter((tn): tn is string => tn !== null && tn.trim() !== '');

      allTrackingNumbers.push(...page);

      if ((data || []).length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    return allTrackingNumbers;
  },

  async validatePseudoExists(pseudo: string): Promise<{ exists: boolean; client?: { id: number; nom: string; prenom: string; pseudo: string; telephone: string; point_enlevement_prefere?: string | null } }> {
    if (!pseudo || pseudo.trim() === '') {
      return { exists: false };
    }

    const { data: client, error } = await supabase
      .from('clients')
      .select('id, nom, prenom, pseudo, telephone, point_enlevement_prefere')
      .eq('pseudo', pseudo.trim())
      .maybeSingle();

    if (error) {
      console.error('Erreur lors de la validation du pseudo:', error);
      return { exists: false };
    }

    if (!client) {
      return { exists: false };
    }

    return {
      exists: true,
      client: {
        id: client.id,
        nom: client.nom,
        prenom: client.prenom,
        pseudo: client.pseudo,
        telephone: client.telephone,
        point_enlevement_prefere: client.point_enlevement_prefere ?? null
      }
    };
  },

  async bulkCreate(items: Omit<InventoryItem, 'id'>[], onProgress?: (current: number, total: number) => void): Promise<{
    successCount: number;
    failureCount: number;
    successIds: number[];
    failures: { rowIndex: number; error: string; data: any }[];
  }> {
    const BATCH_SIZE = 50;
    const results = {
      successCount: 0,
      failureCount: 0,
      successIds: [] as number[],
      failures: [] as { rowIndex: number; error: string; data: any }[]
    };

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const batchData = batch.map(item => convertToSupabase(item));

      const { data, error } = await supabase
        .from('inventaire')
        .insert(batchData)
        .select();

      if (!error && data) {
        data.forEach((row: any) => {
          results.successCount++;
          results.successIds.push(row.id);
        });
      } else {
        // Batch failed — retry row by row to isolate failures and avoid wasting
        // sequence values for every row in the batch when only one row is bad.
        for (let j = 0; j < batch.length; j++) {
          const { data: singleData, error: singleError } = await supabase
            .from('inventaire')
            .insert(batchData[j])
            .select()
            .maybeSingle();

          if (singleError || !singleData) {
            results.failureCount++;
            results.failures.push({
              rowIndex: i + j,
              error: singleError?.message || 'Erreur inconnue',
              data: batch[j]
            });
          } else {
            results.successCount++;
            results.successIds.push(singleData.id);
          }
        }
      }

      if (onProgress) {
        onProgress(Math.min(i + BATCH_SIZE, items.length), items.length);
      }
    }

    return results;
  }
};