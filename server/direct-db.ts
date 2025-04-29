// Utilitaire pour interagir directement avec la base de données
// Utilisé pour contourner les problèmes avec Drizzle ORM

import { pool } from "./db";

export async function createSiteDirectly(siteData: {
  user_id: number;
  name: string;
  url: string;
  api_key: string;
  version: string;
  status?: string;
  http_auth_enabled?: boolean;
  http_auth_username?: string;
  http_auth_password?: string;
}) {
  try {
    console.log("Insertion directe en base de données:", siteData);
    
    // Utiliser une requête SQL paramétrée pour insérer le site
    const query = `
      INSERT INTO sites (
        user_id, name, url, api_key, version, status, 
        http_auth_enabled, http_auth_username, http_auth_password
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    
    const result = await pool.query(query, [
      siteData.user_id,
      siteData.name,
      siteData.url,
      siteData.api_key,
      siteData.version,
      siteData.status || 'connected',
      siteData.http_auth_enabled || false,
      siteData.http_auth_username || '',
      siteData.http_auth_password || ''
    ]);
    
    if (result.rows && result.rows.length > 0) {
      console.log("Site créé avec succès (SQL direct):", result.rows[0]);
      return result.rows[0];
    } else {
      throw new Error("Aucune donnée retournée après insertion");
    }
  } catch (error) {
    console.error("Erreur d'insertion directe:", error);
    throw error;
  }
}