-- Ajouter une colonne 'type' à la table price_history avec une valeur par défaut
ALTER TABLE price_history ADD COLUMN type TEXT NOT NULL DEFAULT 'sync';