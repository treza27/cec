/*
  # Ajout d'index pour améliorer les performances

  1. Objectif
    - Optimiser les requêtes fréquentes sur les tables principales
    - Accélérer les recherches et les filtres
    - Améliorer les performances pour les machines modestes

  2. Index ajoutés

    ### Table inventaire
    - Index sur `shipping_mark` : recherches par shipping mark
    - Index sur `bl` : recherches par numéro BL
    - Index sur `statut` : filtres par statut
    - Index sur `date_entree` : tri chronologique
    - Index composite sur `statut, date_entree` : combinaison fréquente

    ### Table depart
    - Index sur `num_bl` : recherches par numéro BL
    - Index sur `num_tc` : recherches par numéro TC
    - Index sur `statut` : filtres par statut
    - Index sur `date_depart_chine` : tri chronologique

    ### Table clients
    - Index sur `nom` : recherches par nom
    - Index sur `prenom` : recherches par prénom
    - Index sur `entreprise` : recherches par entreprise
    - Index composite sur `nom, prenom` : recherche par nom complet

    ### Table client_shipping_marks
    - Index sur `shipping_mark` : recherches rapides par shipping mark
    - Index sur `client_id` : jointures rapides avec clients
    - Index sur `is_active` : filtrer les shipping marks actives

    ### Table package_images
    - Index sur `inventaire_id` : chargement rapide des images d'un colis
    - Index sur `depart_id` : chargement rapide des images d'un départ
    - Index composite sur `inventaire_id, image_type` : filtrer par type d'image

  3. Notes importantes
    - Les index utilisent IF NOT EXISTS pour éviter les erreurs en cas de réexécution
    - Les index composites sont optimisés pour les requêtes les plus fréquentes
    - Les index partiels (WHERE) économisent de l'espace disque
*/

-- Index pour la table inventaire
CREATE INDEX IF NOT EXISTS idx_inventaire_shipping_mark
  ON inventaire(shipping_mark)
  WHERE shipping_mark IS NOT NULL AND shipping_mark != '';

CREATE INDEX IF NOT EXISTS idx_inventaire_bl
  ON inventaire(bl)
  WHERE bl IS NOT NULL AND bl != '';

CREATE INDEX IF NOT EXISTS idx_inventaire_statut
  ON inventaire(statut);

CREATE INDEX IF NOT EXISTS idx_inventaire_date_entree
  ON inventaire(date_entree DESC);

CREATE INDEX IF NOT EXISTS idx_inventaire_statut_date
  ON inventaire(statut, date_entree DESC);

CREATE INDEX IF NOT EXISTS idx_inventaire_id_depart
  ON inventaire(id_depart)
  WHERE id_depart IS NOT NULL;

-- Index pour la table depart
CREATE INDEX IF NOT EXISTS idx_depart_num_bl
  ON depart(num_bl);

CREATE INDEX IF NOT EXISTS idx_depart_num_tc
  ON depart(num_tc)
  WHERE num_tc IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_depart_statut
  ON depart(statut);

CREATE INDEX IF NOT EXISTS idx_depart_date_depart
  ON depart(date_depart_chine DESC)
  WHERE date_depart_chine IS NOT NULL;

-- Index pour la table clients
CREATE INDEX IF NOT EXISTS idx_clients_nom
  ON clients(nom);

CREATE INDEX IF NOT EXISTS idx_clients_prenom
  ON clients(prenom);

CREATE INDEX IF NOT EXISTS idx_clients_entreprise
  ON clients(entreprise)
  WHERE entreprise IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_nom_prenom
  ON clients(nom, prenom);

-- Index pour la table client_shipping_marks
CREATE INDEX IF NOT EXISTS idx_client_shipping_marks_mark
  ON client_shipping_marks(shipping_mark);

CREATE INDEX IF NOT EXISTS idx_client_shipping_marks_client_id
  ON client_shipping_marks(client_id);

CREATE INDEX IF NOT EXISTS idx_client_shipping_marks_active
  ON client_shipping_marks(is_active)
  WHERE is_active = true;

-- Index pour la table package_images
CREATE INDEX IF NOT EXISTS idx_package_images_inventaire_id
  ON package_images(inventaire_id)
  WHERE inventaire_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_package_images_depart_id
  ON package_images(depart_id)
  WHERE depart_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_package_images_inventaire_type
  ON package_images(inventaire_id, image_type)
  WHERE inventaire_id IS NOT NULL;

-- Analyser les tables pour mettre à jour les statistiques
ANALYZE inventaire;
ANALYZE depart;
ANALYZE clients;
ANALYZE client_shipping_marks;
ANALYZE package_images;