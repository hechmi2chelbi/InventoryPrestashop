-- Ajout des champs pour les produits
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'simple',
  ADD COLUMN IF NOT EXISTS is_attribute BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_id INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS price TEXT,
  ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'new';

-- Création de la table d'attributs de produits
CREATE TABLE IF NOT EXISTS product_attributes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  attribute_name TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);