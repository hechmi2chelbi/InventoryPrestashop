import { 
  users, type User, type InsertUser,
  sites, type Site, type InsertSite,
  products, type Product, type InsertProduct,
  priceHistory, type PriceHistory, type InsertPriceHistory,
  stockAlerts, type StockAlert, type InsertStockAlert,
  moduleLogs, type ModuleLog, type InsertModuleLog,
  siteStats, type SiteStats, type InsertSiteStats
} from "@shared/schema";
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, desc, like, sql, and, gt, gte, lt, lte, or, not, SQL, inArray } from 'drizzle-orm';
import session from "express-session";


// Database setup
if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
  throw new Error(
    "MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE must be set.",
  );
}

const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

const pool = mysql.createPool(dbConfig);
export const db = drizzle(pool);


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

  // Session store - Removed session store from this file.
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store = null as any; //Placeholder - needs a MySQL session store

  constructor() {
    //this.sessionStore = null as any; // Placeholder - Needs replacement.
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] as User | undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [rows] = await pool.execute('INSERT INTO users SET ?', [insertUser]);
    const [user] = await pool.execute('SELECT * FROM users WHERE id = LAST_INSERT_ID()');
    return user[0] as User;
  }

  // Site methods
  async getSite(id: number): Promise<Site | undefined> {
    const [rows] = await pool.execute('SELECT * FROM sites WHERE id = ?', [id]);
    return rows[0] as Site | undefined;
  }

  async getSites(): Promise<Site[]> {
    const [rows] = await pool.execute('SELECT * FROM sites');
    return rows as Site[];
  }

  async getSitesByUserId(userId: number): Promise<Site[]> {
    const [rows] = await pool.execute('SELECT * FROM sites WHERE user_id = ?', [userId]);
    return rows as Site[];
  }

  async createSite(insertSite: InsertSite): Promise<Site> {
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
    const [rows] = await pool.execute('INSERT INTO sites SET ?', [cleanData]);
    const [site] = await pool.execute('SELECT * FROM sites WHERE id = LAST_INSERT_ID()');
    return site[0] as Site;
  }

  async updateSite(id: number, siteUpdate: Partial<Site>): Promise<Site | undefined> {
    await pool.execute('UPDATE sites SET ? WHERE id = ?', [siteUpdate, id]);
    const [rows] = await pool.execute('SELECT * FROM sites WHERE id = ?', [id]);
    return rows[0] as Site | undefined;
  }

  async deleteSite(id: number): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM sites WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }


  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0] as Product | undefined;
  }

  async getProductsBySiteId(siteId: number, filters?: any): Promise<{ products: Product[], total: number }> {
    let sqlQuery = 'SELECT * FROM products WHERE site_id = ?';
    const params: any[] = [siteId];
    let whereClause = '';

    if (filters) {
        whereClause = ' AND ';
        const filterConditions: string[] = [];
        if (filters.status) filterConditions.push(`status = '${filters.status}'`);
        if (filters.condition) filterConditions.push(`condition = '${filters.condition}'`);
        if (filters.reference) filterConditions.push(`reference LIKE '%${filters.reference}%'`);
        if (filters.productType) filterConditions.push(`product_type = '${filters.productType}'`);
        if (filters.isAttribute !== undefined) filterConditions.push(`is_attribute = ${filters.isAttribute}`);
        whereClause += filterConditions.join(' AND ');
    }

    sqlQuery += whereClause;
    const [rows] = await pool.execute(sqlQuery, params);

    const total = rows.length;
    const products = rows as Product[];

    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit;
      const limit = filters.limit;
      sqlQuery += ` LIMIT ${limit} OFFSET ${offset}`;
      const [paginatedRows] = await pool.execute(sqlQuery, params);
      return { products: paginatedRows as Product[], total };
    }

    return { products, total };
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [rows] = await pool.execute('INSERT INTO products SET ?', [insertProduct]);
    const [product] = await pool.execute('SELECT * FROM products WHERE id = LAST_INSERT_ID()');
    return product[0] as Product;
  }

  async updateProduct(id: number, productUpdate: Partial<Product>): Promise<Product | undefined> {
    await pool.execute('UPDATE products SET ?, last_update = NOW() WHERE id = ?', [productUpdate, id]);
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0] as Product | undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }

  async getProductIdsBySiteId(siteId: number): Promise<number[]> {
    const [rows] = await pool.execute('SELECT id FROM products WHERE site_id = ?', [siteId]);
    return (rows as any[]).map((row) => row.id);
  }

  // Price history methods
  async getPriceHistoryByProductId(productId: number): Promise<PriceHistory[]> {
    const [rows] = await pool.execute('SELECT * FROM price_history WHERE product_id = ? ORDER BY date DESC', [productId]);
    return rows as PriceHistory[];
  }

  async createPriceHistory(insertPriceHistory: InsertPriceHistory): Promise<PriceHistory> {
    const [rows] = await pool.execute('INSERT INTO price_history SET ?', [insertPriceHistory]);
    const [priceHistoryEntry] = await pool.execute('SELECT * FROM price_history WHERE id = LAST_INSERT_ID()');
    return priceHistoryEntry[0] as PriceHistory;
  }

  async deletePriceHistory(id: number): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM price_history WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }

  async deletePriceHistoryBySiteId(siteId: number): Promise<boolean> {
    const productIds = await this.getProductIdsBySiteId(siteId);
    let totalDeleted = 0;
    if (productIds.length > 0) {
      const [result] = await pool.execute(`DELETE FROM price_history WHERE product_id IN (${productIds.join(',')})`);
      totalDeleted = (result as any).affectedRows;
    }
    await pool.execute(`DELETE FROM price_history WHERE product_id NOT IN (SELECT id FROM products)`);
    return true;
  }

  // Stock alerts methods
  async getStockAlertsByProductId(productId: number): Promise<StockAlert[]> {
    const [rows] = await pool.execute('SELECT * FROM stock_alerts WHERE product_id = ? ORDER BY created_at DESC', [productId]);
    return rows as StockAlert[];
  }

  async getActiveStockAlerts(): Promise<(StockAlert & { product: Product, site: Site })[]> {
    const [activeAlerts] = await pool.execute('SELECT * FROM stock_alerts WHERE status = "active"');
    const result = [];
    for (const alert of activeAlerts) {
      const [product] = await pool.execute('SELECT * FROM products WHERE id = ?', [alert.product_id]);
      if (product[0]) {
        const [site] = await pool.execute('SELECT * FROM sites WHERE id = ?', [product[0].site_id]);
        if (site[0]) {
          result.push({ ...alert, product: product[0], site: site[0] });
        }
      }
    }
    return result.slice(0, 10);
  }

  async createStockAlert(insertStockAlert: InsertStockAlert): Promise<StockAlert> {
    const [rows] = await pool.execute('INSERT INTO stock_alerts SET ?', [insertStockAlert]);
    const [stockAlert] = await pool.execute('SELECT * FROM stock_alerts WHERE id = LAST_INSERT_ID()');
    return stockAlert[0] as StockAlert;
  }

  async updateStockAlert(id: number, alertUpdate: Partial<StockAlert>): Promise<StockAlert | undefined> {
    await pool.execute('UPDATE stock_alerts SET ? WHERE id = ?', [alertUpdate, id]);
    const [rows] = await pool.execute('SELECT * FROM stock_alerts WHERE id = ?', [id]);
    return rows[0] as StockAlert | undefined;
  }

  async deleteStockAlert(id: number): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM stock_alerts WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }

  async deleteStockAlertsBySiteId(siteId: number): Promise<boolean> {
    const productIds = await this.getProductIdsBySiteId(siteId);
    if (productIds.length > 0) {
      await pool.execute(`DELETE FROM stock_alerts WHERE product_id IN (${productIds.join(',')})`);
    }
    await pool.execute(`DELETE FROM stock_alerts WHERE product_id NOT IN (SELECT id FROM products)`);
    return true;
  }

  // Recent price changes
  async getRecentPriceChanges(): Promise<(PriceHistory & { product: Product, site: Site })[]> {
    const allProducts = await db.select().from(products);
    const result = [];
    for (const product of allProducts) {
      const [histories] = await pool.execute(`SELECT * FROM price_history WHERE product_id = ? ORDER BY date DESC LIMIT 2`, [product.id]);
      if (histories.length >= 2) {
        const [latest, previous] = histories as PriceHistory[];
        if (latest.price !== previous.price) {
          const [site] = await pool.execute('SELECT * FROM sites WHERE id = ?', [product.site_id]);
          if (site[0]) {
            result.push({ ...latest, oldPrice: previous.price, product, site: site[0] });
          }
        }
      }
    }
    return result.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)).slice(0, 10);
  }

  // Module logs operations
  async getModuleLogsBySiteId(siteId: number, limit: number = 100): Promise<ModuleLog[]> {
    const [rows] = await pool.execute('SELECT * FROM module_logs WHERE site_id = ? ORDER BY created_at DESC LIMIT ?', [siteId, limit]);
    return rows as ModuleLog[];
  }

  async createModuleLog(insertLog: InsertModuleLog): Promise<ModuleLog> {
    const [rows] = await pool.execute('INSERT INTO module_logs SET ?', [insertLog]);
    const [log] = await pool.execute('SELECT * FROM module_logs WHERE id = LAST_INSERT_ID()');
    return log[0] as ModuleLog;
  }

  async clearModuleLogs(siteId: number): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM module_logs WHERE site_id = ?', [siteId]);
    return (result as any).affectedRows > 0;
  }

  // Site Stats methods
  async getSiteStats(siteId: number): Promise<SiteStats | undefined> {
    const [rows] = await pool.execute('SELECT * FROM site_stats WHERE site_id = ?', [siteId]);
    return rows[0] as SiteStats | undefined;
  }

  async createOrUpdateSiteStats(stats: InsertSiteStats): Promise<SiteStats> {
    const existingStats = await this.getSiteStats(stats.site_id);
    if (existingStats) {
      await pool.execute('UPDATE site_stats SET ?, last_update = NOW() WHERE site_id = ?', [stats, stats.site_id]);
      const [rows] = await pool.execute('SELECT * FROM site_stats WHERE site_id = ?', [stats.site_id]);
      return rows[0] as SiteStats;
    } else {
      const [rows] = await pool.execute('INSERT INTO site_stats SET ?, last_update = NOW()', [stats]);
      const [newStats] = await pool.execute('SELECT * FROM site_stats WHERE id = LAST_INSERT_ID()');
      return newStats[0] as SiteStats;
    }
  }

  async updateSiteStats(id: number, statsUpdate: Partial<SiteStats>): Promise<SiteStats | undefined> {
    await pool.execute('UPDATE site_stats SET ?, last_update = NOW() WHERE id = ?', [statsUpdate, id]);
    const [rows] = await pool.execute('SELECT * FROM site_stats WHERE id = ?', [id]);
    return rows[0] as SiteStats | undefined;
  }
}

export const storage = new DatabaseStorage();