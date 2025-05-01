import {
  type User,
  type InsertUser,
  type Site,
  type InsertSite,
  type Product,
  type InsertProduct,
  type PriceHistory,
  type InsertPriceHistory,
  type StockAlert,
  type InsertStockAlert,
  type ModuleLog,
  type InsertModuleLog,
  type SiteStats,
  type InsertSiteStats,
} from "../shared/schema";
import mysql from "mysql2/promise";
import session from "express-session";
// Utiliser le store de session en mémoire par défaut pour simplifier
import { MemoryStore } from "express-session";

// Database setup
const dbConfig = {
  host: "127.0.0.1",
  user: "prestasynch",
  password: "1DhbQ[XdK2_6Jzr0",
  database: "prestasynch",
  port: "3306",
};

console.log("Connecting to MySQL with config:", { 
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
});

const pool = mysql.createPool(dbConfig);

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
      status?: string;
      condition?: string;
      reference?: string;
      productType?: string;
      isAttribute?: boolean;
      page?: number;
      limit?: number;
    },
  ): Promise<{ products: Product[]; total: number }>;
  getProductIdsBySiteId(siteId: number): Promise<number[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: number,
    product: Partial<Product>,
  ): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Price history operations
  getPriceHistoryByProductId(productId: number): Promise<PriceHistory[]>;
  createPriceHistory(priceHistory: InsertPriceHistory): Promise<PriceHistory>;
  deletePriceHistory(id: number): Promise<boolean>;
  deletePriceHistoryBySiteId(siteId: number): Promise<boolean>;

  // Stock alerts operations
  getStockAlertsByProductId(productId: number): Promise<StockAlert[]>;
  getActiveStockAlerts(): Promise<
    (StockAlert & { product: Product; site: Site })[]
  >;
  createStockAlert(stockAlert: InsertStockAlert): Promise<StockAlert>;
  updateStockAlert(
    id: number,
    stockAlert: Partial<StockAlert>,
  ): Promise<StockAlert | undefined>;
  deleteStockAlert(id: number): Promise<boolean>;
  deleteStockAlertsBySiteId(siteId: number): Promise<boolean>;

  // Recent price changes
  getRecentPriceChanges(): Promise<
    (PriceHistory & { product: Product; site: Site })[]
  >;

  // Module logs operations
  getModuleLogsBySiteId(siteId: number, limit?: number): Promise<ModuleLog[]>;
  createModuleLog(log: InsertModuleLog): Promise<ModuleLog>;
  clearModuleLogs(siteId: number): Promise<boolean>;

  // Site Stats operations
  getSiteStats(siteId: number): Promise<SiteStats | undefined>;
  createOrUpdateSiteStats(stats: InsertSiteStats): Promise<SiteStats>;
  updateSiteStats(
    id: number,
    stats: Partial<SiteStats>,
  ): Promise<SiteStats | undefined>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // Utiliser un store de session en mémoire pour simplifier
    // Note: En production, utilisez un store persistent comme express-mysql-session
    this.sessionStore = new MemoryStore();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
    const users = rows as User[];
    return users.length > 0 ? users[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [username],
    );
    const users = rows as User[];
    return users.length > 0 ? users[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const columns = Object.keys(insertUser).join(", ");
    const placeholders = Object.keys(insertUser)
      .map(() => "?")
      .join(", ");
    const values = Object.values(insertUser);

    const [result] = await pool.execute(
      `INSERT INTO users (${columns}) VALUES (${placeholders})`,
      values,
    );

    const id = (result as any).insertId;
    const [user] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
    return (user as User[])[0];
  }

  // Site methods
  async getSite(id: number): Promise<Site | undefined> {
    const [rows] = await pool.execute("SELECT * FROM sites WHERE id = ?", [id]);
    const sites = rows as Site[];
    return sites.length > 0 ? sites[0] : undefined;
  }

  async getSites(): Promise<Site[]> {
    const [rows] = await pool.execute("SELECT * FROM sites");
    return rows as Site[];
  }

  async getSitesByUserId(userId: number): Promise<Site[]> {
    const [rows] = await pool.execute("SELECT * FROM sites WHERE user_id = ?", [
      userId,
    ]);
    return rows as Site[];
  }

  async createSite(insertSite: InsertSite): Promise<Site> {
    const columns = Object.keys(insertSite).join(", ");
    const placeholders = Object.keys(insertSite)
      .map(() => "?")
      .join(", ");
    const values = Object.values(insertSite);

    const [result] = await pool.execute(
      `INSERT INTO sites (${columns}) VALUES (${placeholders})`,
      values,
    );

    const id = (result as any).insertId;
    const [site] = await pool.execute("SELECT * FROM sites WHERE id = ?", [id]);
    return (site as Site[])[0];
  }

  async updateSite(
    id: number,
    siteUpdate: Partial<Site>,
  ): Promise<Site | undefined> {
    if (Object.keys(siteUpdate).length === 0) {
      return this.getSite(id);
    }

    const setStatements = Object.entries(siteUpdate)
      .map(([key, _]) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(siteUpdate), id];

    await pool.execute(
      `UPDATE sites SET ${setStatements} WHERE id = ?`,
      values,
    );
    return this.getSite(id);
  }

  async deleteSite(id: number): Promise<boolean> {
    const [result] = await pool.execute("DELETE FROM sites WHERE id = ?", [id]);
    return (result as any).affectedRows > 0;
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [rows] = await pool.execute("SELECT * FROM products WHERE id = ?", [
      id,
    ]);
    const products = rows as Product[];
    return products.length > 0 ? products[0] : undefined;
  }

  async getProductsBySiteId(
    siteId: number,
    filters?: {
      status?: string;
      condition?: string;
      reference?: string;
      productType?: string;
      isAttribute?: boolean;
      page?: number;
      limit?: number;
    },
  ): Promise<{ products: Product[]; total: number }> {
    let sqlQuery = "SELECT * FROM products WHERE site_id = ?";
    const params: any[] = [siteId];

    if (filters) {
      const whereConditions: string[] = [];

      if (filters.status) {
        whereConditions.push("status = ?");
        params.push(filters.status);
      }

      if (filters.condition) {
        whereConditions.push("`condition` = ?");
        params.push(filters.condition);
      }

      if (filters.reference) {
        whereConditions.push("reference LIKE ?");
        params.push(`%${filters.reference}%`);
      }

      if (filters.productType) {
        whereConditions.push("product_type = ?");
        params.push(filters.productType);
      }

      if (filters.isAttribute !== undefined) {
        whereConditions.push("is_attribute = ?");
        params.push(filters.isAttribute ? 1 : 0);
      }

      if (whereConditions.length > 0) {
        sqlQuery += " AND " + whereConditions.join(" AND ");
      }
    }

    // Get total count
    const countQuery = sqlQuery.replace("SELECT *", "SELECT COUNT(*) as count");
    const [countRows] = await pool.execute(countQuery, params);
    const total = (countRows as any[])[0].count;

    // Add pagination if needed
    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit;
      // Dans MySQL, LIMIT/OFFSET peuvent poser problème en tant que paramètres préparés
      // On utilise donc les valeurs directement dans la requête
      const limitValue = parseInt(filters.limit.toString(), 10);
      const offsetValue = parseInt(offset.toString(), 10);
      sqlQuery += ` LIMIT ${limitValue} OFFSET ${offsetValue}`;
      // Pas besoin d'ajouter les paramètres car ils sont maintenant inclus directement
    }

    const [rows] = await pool.execute(sqlQuery, params);
    return { products: rows as Product[], total };
  }

  async getProductIdsBySiteId(siteId: number): Promise<number[]> {
    const [rows] = await pool.execute(
      "SELECT id FROM products WHERE site_id = ?",
      [siteId],
    );
    return (rows as any[]).map((row) => row.id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const columns = Object.keys(insertProduct).join(", ");
    const placeholders = Object.keys(insertProduct)
      .map(() => "?")
      .join(", ");
    const values = Object.values(insertProduct);

    const [result] = await pool.execute(
      `INSERT INTO products (${columns}) VALUES (${placeholders})`,
      values,
    );

    const id = (result as any).insertId;
    const [product] = await pool.execute(
      "SELECT * FROM products WHERE id = ?",
      [id],
    );
    return (product as Product[])[0];
  }

  async updateProduct(
    id: number,
    productUpdate: Partial<Product>,
  ): Promise<Product | undefined> {
    if (Object.keys(productUpdate).length === 0) {
      return this.getProduct(id);
    }

    // Add last_update if not present
    if (!productUpdate.last_update) {
      productUpdate.last_update = new Date();
    }

    const setStatements = Object.entries(productUpdate)
      .map(([key, _]) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(productUpdate), id];

    await pool.execute(
      `UPDATE products SET ${setStatements} WHERE id = ?`,
      values,
    );
    return this.getProduct(id);
  }

  async deleteProduct(id: number): Promise<boolean> {
    const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [
      id,
    ]);
    return (result as any).affectedRows > 0;
  }

  // Price history methods
  async getPriceHistoryByProductId(productId: number): Promise<PriceHistory[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM price_history WHERE product_id = ? ORDER BY date DESC",
      [productId],
    );
    
    // Assurer que chaque élément a un champ 'type' valide
    return (rows as any[]).map(row => ({
      ...row,
      type: row.type || 'sync'
    })) as PriceHistory[];
  }

  async createPriceHistory(
    insertPriceHistory: InsertPriceHistory,
  ): Promise<PriceHistory> {
    // Assurer que le champ 'type' est présent
    const dataToInsert = {
      ...insertPriceHistory,
      type: insertPriceHistory.type || 'sync'
    };
    
    const columns = Object.keys(dataToInsert).join(", ");
    const placeholders = Object.keys(dataToInsert)
      .map(() => "?")
      .join(", ");
    const values = Object.values(dataToInsert);

    const [result] = await pool.execute(
      `INSERT INTO price_history (${columns}) VALUES (${placeholders})`,
      values,
    );

    const id = (result as any).insertId;
    const [priceHistory] = await pool.execute(
      "SELECT * FROM price_history WHERE id = ?",
      [id],
    );
    return (priceHistory as PriceHistory[])[0];
  }

  async deletePriceHistory(id: number): Promise<boolean> {
    const [result] = await pool.execute(
      "DELETE FROM price_history WHERE id = ?",
      [id],
    );
    return (result as any).affectedRows > 0;
  }

  async deletePriceHistoryBySiteId(siteId: number): Promise<boolean> {
    const productIds = await this.getProductIdsBySiteId(siteId);

    if (productIds.length > 0) {
      // Cette approche est plus sûre car elle évite les problèmes de paramètres avec IN
      for (const productId of productIds) {
        await pool.execute("DELETE FROM price_history WHERE product_id = ?", [
          productId,
        ]);
      }

      // Alternative qui pourrait aussi fonctionner avec IN:
      // const placeholders = productIds.map(() => "?").join(",");
      // await pool.execute(
      //   `DELETE FROM price_history WHERE product_id IN (${placeholders})`,
      //   [...productIds], // Assurez-vous de passer un tableau d'arguments individuels
      // );
    }

    // Clean up orphaned records
    await pool.execute(
      "DELETE FROM price_history WHERE product_id NOT IN (SELECT id FROM products)",
    );

    return true;
  }

  // Stock alerts methods
  async getStockAlertsByProductId(productId: number): Promise<StockAlert[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM stock_alerts WHERE product_id = ? ORDER BY created_at DESC",
      [productId],
    );
    return rows as StockAlert[];
  }

  async getActiveStockAlerts(): Promise<
    (StockAlert & { product: Product; site: Site })[]
  > {
    const [alerts] = await pool.execute(
      "SELECT a.*, p.*, s.* FROM stock_alerts a " +
        "JOIN products p ON a.product_id = p.id " +
        "JOIN sites s ON p.site_id = s.id " +
        'WHERE a.status = "active" ' +
        "ORDER BY a.created_at DESC " +
        "LIMIT 10",
    );

    return (alerts as any[]).map((row) => {
      // Restructure the flat result into the nested object structure
      const alert: any = {
        id: row.id,
        product_id: row.product_id,
        condition: row.condition,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        product: {
          id: row.product_id,
          site_id: row.site_id,
          reference: row.reference,
          name: row.name,
          description: row.description,
          status: row.status,
          condition: row.condition,
          quantity: row.quantity,
          price: row.price,
          product_type: row.product_type,
          is_attribute: row.is_attribute,
          last_update: row.last_update,
        },
        site: {
          id: row.site_id,
          user_id: row.user_id,
          name: row.name,
          url: row.url,
          api_key: row.api_key,
          version: row.version,
          status: row.status,
          http_auth_enabled: row.http_auth_enabled,
          http_auth_username: row.http_auth_username,
          http_auth_password: row.http_auth_password,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      };
      return alert;
    });
  }

  async createStockAlert(
    insertStockAlert: InsertStockAlert,
  ): Promise<StockAlert> {
    const columns = Object.keys(insertStockAlert).join(", ");
    const placeholders = Object.keys(insertStockAlert)
      .map(() => "?")
      .join(", ");
    const values = Object.values(insertStockAlert);

    const [result] = await pool.execute(
      `INSERT INTO stock_alerts (${columns}) VALUES (${placeholders})`,
      values,
    );

    const id = (result as any).insertId;
    const [stockAlert] = await pool.execute(
      "SELECT * FROM stock_alerts WHERE id = ?",
      [id],
    );
    return (stockAlert as StockAlert[])[0];
  }

  async updateStockAlert(
    id: number,
    alertUpdate: Partial<StockAlert>,
  ): Promise<StockAlert | undefined> {
    if (Object.keys(alertUpdate).length === 0) {
      return this.getStockAlert(id);
    }

    const setStatements = Object.entries(alertUpdate)
      .map(([key, _]) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(alertUpdate), id];

    await pool.execute(
      `UPDATE stock_alerts SET ${setStatements} WHERE id = ?`,
      values,
    );

    const [rows] = await pool.execute(
      "SELECT * FROM stock_alerts WHERE id = ?",
      [id],
    );
    const alerts = rows as StockAlert[];
    return alerts.length > 0 ? alerts[0] : undefined;
  }

  private async getStockAlert(id: number): Promise<StockAlert | undefined> {
    const [rows] = await pool.execute(
      "SELECT * FROM stock_alerts WHERE id = ?",
      [id],
    );
    const alerts = rows as StockAlert[];
    return alerts.length > 0 ? alerts[0] : undefined;
  }

  async deleteStockAlert(id: number): Promise<boolean> {
    const [result] = await pool.execute(
      "DELETE FROM stock_alerts WHERE id = ?",
      [id],
    );
    return (result as any).affectedRows > 0;
  }

  async deleteStockAlertsBySiteId(siteId: number): Promise<boolean> {
    const productIds = await this.getProductIdsBySiteId(siteId);

    if (productIds.length > 0) {
      // Cette approche est plus sûre car elle évite les problèmes de paramètres avec IN
      for (const productId of productIds) {
        await pool.execute("DELETE FROM stock_alerts WHERE product_id = ?", [
          productId,
        ]);
      }
    }

    // Clean up orphaned records
    await pool.execute(
      "DELETE FROM stock_alerts WHERE product_id NOT IN (SELECT id FROM products)",
    );

    return true;
  }

  // Recent price changes
  async getRecentPriceChanges(): Promise<
    (PriceHistory & { product: Product; site: Site })[]
  > {
    const query = `
      SELECT ph1.*, ph2.price AS old_price, p.*, s.*
      FROM price_history ph1
      JOIN (
        SELECT product_id, MAX(date) AS max_date
        FROM price_history
        GROUP BY product_id
      ) latest ON ph1.product_id = latest.product_id AND ph1.date = latest.max_date
      JOIN (
        SELECT ph_prev.product_id, MAX(ph_prev.date) AS prev_max_date
        FROM price_history ph_prev
        JOIN (
          SELECT product_id, MAX(date) AS max_date
          FROM price_history
          GROUP BY product_id
        ) latest_dates ON ph_prev.product_id = latest_dates.product_id AND ph_prev.date < latest_dates.max_date
        GROUP BY ph_prev.product_id
      ) prev_dates ON ph1.product_id = prev_dates.product_id
      JOIN price_history ph2 ON ph2.product_id = prev_dates.product_id AND ph2.date = prev_dates.prev_max_date
      JOIN products p ON ph1.product_id = p.id
      JOIN sites s ON p.site_id = s.id
      WHERE ph1.price != ph2.price
      ORDER BY ph1.date DESC
      LIMIT 10
    `;

    const [rows] = await pool.execute(query);

    return (rows as any[]).map((row) => {
      // Restructure the flat result into the nested object structure
      const priceChange: any = {
        id: row.id,
        product_id: row.product_id,
        price: row.price,
        oldPrice: row.old_price,
        date: row.date,
        type: row.type || 'sync', // Inclure le champ type explicitement
        product: {
          id: row.product_id,
          site_id: row.site_id,
          reference: row.reference,
          name: row.name,
          description: row.description,
          status: row.status,
          condition: row.condition,
          quantity: row.quantity,
          price: row.price,
          product_type: row.product_type,
          is_attribute: row.is_attribute,
          last_update: row.last_update,
        },
        site: {
          id: row.site_id,
          user_id: row.user_id,
          name: row.name,
          url: row.url,
          api_key: row.api_key,
          version: row.version,
          status: row.status,
          http_auth_enabled: row.http_auth_enabled,
          http_auth_username: row.http_auth_username,
          http_auth_password: row.http_auth_password,
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      };
      return priceChange;
    });
  }

  // Module logs operations
  async getModuleLogsBySiteId(
    siteId: number,
    limit: number = 100,
  ): Promise<ModuleLog[]> {
    // Dans MySQL, LIMIT peut poser problème en tant que paramètre préparé
    // On utilise donc la valeur directement dans la requête
    const [rows] = await pool.execute(
      `SELECT * FROM module_logs WHERE site_id = ? ORDER BY created_at DESC LIMIT ${parseInt(limit.toString(), 10)}`,
      [siteId],
    );
    return rows as ModuleLog[];
  }

  async createModuleLog(insertLog: InsertModuleLog): Promise<ModuleLog> {
    const columns = Object.keys(insertLog).join(", ");
    const placeholders = Object.keys(insertLog)
      .map(() => "?")
      .join(", ");
    const values = Object.values(insertLog);

    const [result] = await pool.execute(
      `INSERT INTO module_logs (${columns}) VALUES (${placeholders})`,
      values,
    );

    const id = (result as any).insertId;
    const [log] = await pool.execute("SELECT * FROM module_logs WHERE id = ?", [
      id,
    ]);
    return (log as ModuleLog[])[0];
  }

  async clearModuleLogs(siteId: number): Promise<boolean> {
    const [result] = await pool.execute(
      "DELETE FROM module_logs WHERE site_id = ?",
      [siteId],
    );
    return (result as any).affectedRows > 0;
  }

  // Site Stats methods
  async getSiteStats(siteId: number): Promise<SiteStats | undefined> {
    const [rows] = await pool.execute(
      "SELECT * FROM site_stats WHERE site_id = ?",
      [siteId],
    );
    const stats = rows as SiteStats[];
    return stats.length > 0 ? stats[0] : undefined;
  }

  async createOrUpdateSiteStats(stats: InsertSiteStats): Promise<SiteStats> {
    const existingStats = await this.getSiteStats(stats.site_id);

    if (existingStats) {
      return this.updateSiteStats(
        existingStats.id,
        stats,
      ) as Promise<SiteStats>;
    } else {
      const columns = Object.keys(stats).join(", ");
      const placeholders = Object.keys(stats)
        .map(() => "?")
        .join(", ");
      const values = Object.values(stats);

      const [result] = await pool.execute(
        `INSERT INTO site_stats (${columns}, last_update) VALUES (${placeholders}, NOW())`,
        values,
      );

      const id = (result as any).insertId;
      const [newStats] = await pool.execute(
        "SELECT * FROM site_stats WHERE id = ?",
        [id],
      );
      return (newStats as SiteStats[])[0];
    }
  }

  async updateSiteStats(
    id: number,
    statsUpdate: Partial<SiteStats>,
  ): Promise<SiteStats | undefined> {
    if (Object.keys(statsUpdate).length === 0) {
      return this.getSiteStatsById(id);
    }

    // Always update the last_update field
    statsUpdate.last_update = new Date();

    const setStatements = Object.entries(statsUpdate)
      .map(([key, _]) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(statsUpdate), id];

    await pool.execute(
      `UPDATE site_stats SET ${setStatements} WHERE id = ?`,
      values,
    );
    return this.getSiteStatsById(id);
  }

  private async getSiteStatsById(id: number): Promise<SiteStats | undefined> {
    const [rows] = await pool.execute("SELECT * FROM site_stats WHERE id = ?", [
      id,
    ]);
    const stats = rows as SiteStats[];
    return stats.length > 0 ? stats[0] : undefined;
  }
}

export const storage = new DatabaseStorage();
