import { 
  users, type User, type InsertUser,
  sites, type Site, type InsertSite,
  products, type Product, type InsertProduct,
  priceHistory, type PriceHistory, type InsertPriceHistory,
  stockAlerts, type StockAlert, type InsertStockAlert,
  moduleLogs, type ModuleLog, type InsertModuleLog,
  siteStats, type SiteStats, type InsertSiteStats
} from "@shared/schema";
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc, like, sql, and, gt, gte, lt, lte, or, not, SQL, inArray } from 'drizzle-orm';
import connectPg from "connect-pg-simple";
import session from "express-session";
import ws from 'ws';

// Configure Neon to use the Node.js WebSocket implementation
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

// Database setup
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

// Session store setup
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Site operations
  getSite(id: number): Promise<Site | undefined>;
  getSites(): Promise<Site[]>;
  getSitesByUserId(userId: number): Promise<Site[]>;
  createSite(site: InsertSite): Promise<Site>;
  updateSite(id: number, site: Partial<Site>): Promise<Site | undefined>;
  deleteSite(id: number): Promise<boolean>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductsBySiteId(
    siteId: number, 
    filters?: {
      status?: string,
      condition?: string,
      reference?: string,
      productType?: string,
      isAttribute?: boolean,
      page?: number,
      limit?: number
    }
  ): Promise<{ products: Product[], total: number }>;
  getProductIdsBySiteId(siteId: number): Promise<number[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Les attributs sont maintenant gérés directement dans la table produits
  // avec le champ is_attribute et parent_id
  
  // Price history operations
  getPriceHistoryByProductId(productId: number): Promise<PriceHistory[]>;
  createPriceHistory(priceHistory: InsertPriceHistory): Promise<PriceHistory>;
  deletePriceHistory(id: number): Promise<boolean>;
  deletePriceHistoryBySiteId(siteId: number): Promise<boolean>;
  
  // Stock alerts operations
  getStockAlertsByProductId(productId: number): Promise<StockAlert[]>;
  getActiveStockAlerts(): Promise<(StockAlert & { product: Product, site: Site })[]>;
  createStockAlert(stockAlert: InsertStockAlert): Promise<StockAlert>;
  updateStockAlert(id: number, stockAlert: Partial<StockAlert>): Promise<StockAlert | undefined>;
  deleteStockAlert(id: number): Promise<boolean>;
  deleteStockAlertsBySiteId(siteId: number): Promise<boolean>;
  
  // Recent price changes
  getRecentPriceChanges(): Promise<(PriceHistory & { product: Product, site: Site })[]>;
  
  // Module logs operations
  getModuleLogsBySiteId(siteId: number, limit?: number): Promise<ModuleLog[]>;
  createModuleLog(log: InsertModuleLog): Promise<ModuleLog>;
  clearModuleLogs(siteId: number): Promise<boolean>;
  
  // Site Stats operations
  getSiteStats(siteId: number): Promise<SiteStats | undefined>;
  createOrUpdateSiteStats(stats: InsertSiteStats): Promise<SiteStats>;
  updateSiteStats(id: number, stats: Partial<SiteStats>): Promise<SiteStats | undefined>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      tableName: 'sessions',
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Site methods
  async getSite(id: number): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, id));
    return site;
  }
  
  async getSites(): Promise<Site[]> {
    return await db.select().from(sites);
  }
  
  async getSitesByUserId(userId: number): Promise<Site[]> {
    return await db.select().from(sites).where(eq(sites.user_id, userId));
  }
  
  async createSite(insertSite: InsertSite): Promise<Site> {
    try {
      console.log('Tentative de création de site avec les données:', JSON.stringify(insertSite));
      
      // Recréer un nouvel objet avec uniquement les champs requis
      // pour éviter des valeurs undefined ou non conformes
      const cleanData = {
        user_id: insertSite.user_id,
        name: insertSite.name || '',
        url: insertSite.url || '',
        api_key: insertSite.api_key || '',
        version: insertSite.version || '',
        status: insertSite.status || 'connected',
        http_auth_enabled: insertSite.http_auth_enabled === true,
        http_auth_username: insertSite.http_auth_username || '',
        http_auth_password: insertSite.http_auth_password || '',
      };
      
      console.log('Données nettoyées pour insertion:', JSON.stringify(cleanData));
      
      try {
        const result = await db.insert(sites).values(cleanData).returning();
        if (!result || result.length === 0) {
          throw new Error('Aucun site n\'a été retourné après l\'insertion');
        }
        
        const site = result[0];
        console.log('Site créé avec succès:', JSON.stringify(site));
        return site;
      } catch (dbError) {
        console.error('Erreur SQL lors de la création du site:', dbError);
        // Créer une erreur plus informative
        const errorMessage = typeof dbError === 'object' && dbError !== null 
          ? JSON.stringify(dbError) 
          : String(dbError);
        
        throw new Error(`Erreur de base de données: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Erreur lors de la création du site:', error);
      throw error;
    }
  }
  
  async updateSite(id: number, siteUpdate: Partial<Site>): Promise<Site | undefined> {
    const [updatedSite] = await db
      .update(sites)
      .set(siteUpdate)
      .where(eq(sites.id, id))
      .returning();
    
    return updatedSite;
  }
  
  async deleteSite(id: number): Promise<boolean> {
    const result = await db.delete(sites).where(eq(sites.id, id)).returning();
    return result.length > 0;
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  
  async getProductsBySiteId(
    siteId: number, 
    filters?: {
      status?: string,
      condition?: string,
      reference?: string,
      productType?: string,
      isAttribute?: boolean,
      page?: number,
      limit?: number
    }
  ): Promise<{ products: Product[], total: number }> {
    try {
      // Construire les conditions pour la requête SQL
      const conditions: SQL[] = [];
      
      // Condition de base: filtrer par site_id
      conditions.push(eq(products.site_id, siteId));
      
      // Ajouter des conditions supplémentaires selon les filtres
      if (filters) {
        // Filtre par statut de stock (in_stock, low_stock, out_of_stock)
        if (filters.status) {
          switch (filters.status) {
            case 'in_stock':
              conditions.push(gt(products.current_quantity, products.min_quantity));
              break;
            case 'low_stock':
              conditions.push(and(
                gt(products.current_quantity, 0),
                lte(products.current_quantity, products.min_quantity)
              ));
              break;
            case 'out_of_stock':
              conditions.push(lte(products.current_quantity, 0));
              break;
            default:
              conditions.push(eq(products.status, filters.status));
          }
        }
        
        // Filtre par état du produit (new, used, refurbished)
        if (filters.condition) {
          conditions.push(eq(products.condition, filters.condition));
        }
        
        // Filtre par référence (recherche)
        if (filters.reference) {
          conditions.push(like(products.reference, `%${filters.reference}%`));
        }
        
        // Filtre par type de produit (simple, combination, pack, virtual)
        if (filters.productType) {
          conditions.push(eq(products.product_type, filters.productType));
        }
        
        // Filtre par type d'attribut
        if (filters.isAttribute !== undefined) {
          conditions.push(eq(products.is_attribute, filters.isAttribute));
        }
      }
      
      // Combiner toutes les conditions avec AND
      const whereCondition = and(...conditions);
      
      // Exécuter la requête de comptage pour la pagination
      const [countResult] = await db
        .select({ count: sql`COUNT(*)`.as("count") })
        .from(products)
        .where(whereCondition);
        
      const total = Number(countResult.count);
      
      // Construire la requête principale avec pagination et tri
      let query = db
        .select()
        .from(products)
        .where(whereCondition);
      
      // Appliquer la pagination si nécessaire
      if (filters?.page !== undefined && filters?.limit !== undefined) {
        const offset = (filters.page - 1) * filters.limit;
        query = query
          .limit(filters.limit)
          .offset(offset);
      }
      
      // Appliquer le tri
      query = query.orderBy(desc(products.id));
      
      // Exécuter la requête et retourner les résultats
      const productsList = await query;
      
      return {
        products: productsList,
        total
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des produits:", error);
      throw error;
    }
  }
  
  // Les attributs sont maintenant gérés directement dans la table produits
  // en utilisant les champs is_attribute et parent_id
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }
  
  async updateProduct(id: number, productUpdate: Partial<Product>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...productUpdate, last_update: new Date() })
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }
  
  async getProductIdsBySiteId(siteId: number): Promise<number[]> {
    const result = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.site_id, siteId));
    
    return result.map(item => item.id);
  }
  
  // Price history methods
  async getPriceHistoryByProductId(productId: number): Promise<PriceHistory[]> {
    return await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.product_id, productId))
      .orderBy(desc(priceHistory.date));
  }
  
  async createPriceHistory(insertPriceHistory: InsertPriceHistory): Promise<PriceHistory> {
    const [priceHistoryEntry] = await db
      .insert(priceHistory)
      .values(insertPriceHistory)
      .returning();
    
    return priceHistoryEntry;
  }
  
  async deletePriceHistory(id: number): Promise<boolean> {
    const result = await db.delete(priceHistory).where(eq(priceHistory.id, id)).returning();
    return result.length > 0;
  }
  
  async deletePriceHistoryBySiteId(siteId: number): Promise<boolean> {
    try {
      // Méthode 1: Supprimer d'abord les historiques des produits actuels du site
      const productIds = await this.getProductIdsBySiteId(siteId);
      
      let totalDeleted = 0;
      
      if (productIds.length > 0) {
        for (const productId of productIds) {
          const result = await db
            .delete(priceHistory)
            .where(eq(priceHistory.product_id, productId))
            .returning();
          
          totalDeleted += result.length;
        }
        console.log(`Supprimé ${totalDeleted} entrées d'historique de prix pour les produits existants du site ${siteId}`);
      }
      
      // Méthode 2: Exécuter une requête SQL directe pour supprimer les entrées orphelines
      // liées aux produits qui ont été supprimés auparavant
      
      // Cette requête SQL utilise une jointure externe pour trouver les entrées d'historique des prix
      // qui n'ont pas de produit correspondant dans la table des produits
      await db.execute(sql`
        DELETE FROM price_history
        WHERE product_id IN (
          SELECT ph.product_id 
          FROM price_history ph
          LEFT JOIN products p ON ph.product_id = p.id
          WHERE p.id IS NULL
        )
      `);
      
      // Compter combien d'entrées ont été supprimées
      const orphanCount = await db.execute(sql`
        SELECT COUNT(*) FROM price_history
        WHERE product_id NOT IN (SELECT id FROM products)
      `);
      
      console.log(`Supprimé ${orphanCount.rows[0]?.count || 0} entrées d'historique de prix orphelines`);
      totalDeleted += parseInt(orphanCount.rows[0]?.count || '0');
      
      console.log(`Total: ${totalDeleted} entrées d'historique de prix supprimées pour le site ${siteId}`);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'historique des prix pour le site ${siteId}:`, error);
      return false;
    }
  }
  
  // Stock alerts methods
  async getStockAlertsByProductId(productId: number): Promise<StockAlert[]> {
    return await db
      .select()
      .from(stockAlerts)
      .where(eq(stockAlerts.product_id, productId))
      .orderBy(desc(stockAlerts.created_at));
  }
  
  async getActiveStockAlerts(): Promise<(StockAlert & { product: Product, site: Site })[]> {
    // This is a complex query that would need joins
    // For now, we'll do this in multiple steps
    const activeAlerts = await db
      .select()
      .from(stockAlerts)
      .where(eq(stockAlerts.status, 'active'));
    
    const result = [];
    
    for (const alert of activeAlerts) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, alert.product_id));
      
      if (product) {
        const [site] = await db
          .select()
          .from(sites)
          .where(eq(sites.id, product.site_id));
        
        if (site) {
          result.push({ ...alert, product, site });
        }
      }
    }
    
    return result.slice(0, 10); // Limit to 10 alerts
  }
  
  async createStockAlert(insertStockAlert: InsertStockAlert): Promise<StockAlert> {
    const [stockAlert] = await db
      .insert(stockAlerts)
      .values(insertStockAlert)
      .returning();
    
    return stockAlert;
  }
  
  async updateStockAlert(id: number, alertUpdate: Partial<StockAlert>): Promise<StockAlert | undefined> {
    const [updatedAlert] = await db
      .update(stockAlerts)
      .set(alertUpdate)
      .where(eq(stockAlerts.id, id))
      .returning();
    
    return updatedAlert;
  }
  
  async deleteStockAlert(id: number): Promise<boolean> {
    const result = await db.delete(stockAlerts).where(eq(stockAlerts.id, id)).returning();
    return result.length > 0;
  }
  
  async deleteStockAlertsBySiteId(siteId: number): Promise<boolean> {
    try {
      console.log(`Suppression des alertes de stock pour le site ${siteId}...`);
      
      // Méthode 1: Supprimer les alertes de stock liées aux produits du site
      const productIds = await this.getProductIdsBySiteId(siteId);
      
      let totalDeleted = 0;
      
      if (productIds.length > 0) {
        // Utiliser SQL brut pour une suppression plus efficace avec une seule requête
        const result = await db.execute(sql`
          DELETE FROM stock_alerts
          WHERE product_id IN (${sql.join(productIds)})
          RETURNING id
        `);
        
        totalDeleted = result.rowCount || 0;
      }
      
      // Méthode 2: Supprimer les alertes orphelines qui pourraient exister
      const orphanResult = await db.execute(sql`
        DELETE FROM stock_alerts
        WHERE product_id IN (
          SELECT sa.product_id 
          FROM stock_alerts sa
          LEFT JOIN products p ON sa.product_id = p.id
          WHERE p.id IS NULL
        )
        RETURNING id
      `);
      
      const orphanCount = orphanResult.rowCount || 0;
      
      console.log(`Supprimé ${totalDeleted} alertes de stock pour les produits du site ${siteId} et ${orphanCount} alertes orphelines`);
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression des alertes de stock pour le site ${siteId}:`, error);
      return false;
    }
  }
  
  // Recent price changes
  async getRecentPriceChanges(): Promise<(PriceHistory & { product: Product, site: Site })[]> {
    // This is a complex query that would need nested queries and joins
    // For now, we'll implement it through multiple simpler queries
    
    // Get all products
    const allProducts = await db.select().from(products);
    
    const result = [];
    
    for (const product of allProducts) {
      // Get the two most recent price histories for each product
      const histories = await db
        .select()
        .from(priceHistory)
        .where(eq(priceHistory.product_id, product.id))
        .orderBy(desc(priceHistory.date))
        .limit(2);
      
      if (histories.length >= 2) {
        const [latest, previous] = histories;
        
        // Check if there was a price change
        if (latest.price !== previous.price) {
          const [site] = await db
            .select()
            .from(sites)
            .where(eq(sites.id, product.site_id));
          
          if (site) {
            result.push({
              ...latest,
              oldPrice: previous.price,
              product,
              site
            });
          }
        }
      }
    }
    
    // Sort by date and limit
    return result
      .sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
      .slice(0, 10);
  }
  
  // Module logs operations
  async getModuleLogsBySiteId(siteId: number, limit: number = 100): Promise<ModuleLog[]> {
    return await db
      .select()
      .from(moduleLogs)
      .where(eq(moduleLogs.site_id, siteId))
      .orderBy(desc(moduleLogs.created_at))
      .limit(limit);
  }
  
  async createModuleLog(insertLog: InsertModuleLog): Promise<ModuleLog> {
    try {
      const [log] = await db
        .insert(moduleLogs)
        .values(insertLog)
        .returning();
      
      return log;
    } catch (error) {
      console.error('Erreur lors de la création du log module:', error);
      throw error;
    }
  }
  
  async clearModuleLogs(siteId: number): Promise<boolean> {
    const result = await db
      .delete(moduleLogs)
      .where(eq(moduleLogs.site_id, siteId))
      .returning();
    
    return result.length > 0;
  }
  
  // Site Stats methods
  async getSiteStats(siteId: number): Promise<SiteStats | undefined> {
    const [stats] = await db
      .select()
      .from(siteStats)
      .where(eq(siteStats.site_id, siteId));
    
    return stats;
  }
  
  async createOrUpdateSiteStats(stats: InsertSiteStats): Promise<SiteStats> {
    try {
      // Vérifier si les stats existent déjà pour ce site
      const existingStats = await this.getSiteStats(stats.site_id);
      
      if (existingStats) {
        // Mettre à jour les stats existantes
        const [updatedStats] = await db
          .update(siteStats)
          .set({
            ...stats,
            last_update: new Date()
          })
          .where(eq(siteStats.site_id, stats.site_id))
          .returning();
        
        return updatedStats;
      } else {
        // Créer de nouvelles stats
        const [newStats] = await db
          .insert(siteStats)
          .values({
            ...stats,
            last_update: new Date()
          })
          .returning();
        
        return newStats;
      }
    } catch (error) {
      console.error('Erreur lors de la création/mise à jour des statistiques du site:', error);
      throw error;
    }
  }
  
  async updateSiteStats(id: number, statsUpdate: Partial<SiteStats>): Promise<SiteStats | undefined> {
    const [updatedStats] = await db
      .update(siteStats)
      .set({
        ...statsUpdate,
        last_update: new Date()
      })
      .where(eq(siteStats.id, id))
      .returning();
    
    return updatedStats;
  }
}

// Export an instance of DatabaseStorage
export const storage = new DatabaseStorage();