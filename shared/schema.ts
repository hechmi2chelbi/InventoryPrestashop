import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

// PrestaShop sites
export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  api_key: text("api_key").notNull(),
  version: text("version"),
  status: text("status").default("disconnected"), // connected, disconnected
  http_auth_enabled: boolean("http_auth_enabled").default(false),
  http_auth_username: text("http_auth_username"),
  http_auth_password: text("http_auth_password"),
  last_sync: timestamp("last_sync"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertSiteSchema = createInsertSchema(sites).pick({
  user_id: true,
  name: true,
  url: true,
  api_key: true,
  version: true,
  status: true,
  http_auth_enabled: true,
  http_auth_username: true,
  http_auth_password: true,
}).transform((data) => {
  console.log("Transformation du schema lors de la validation:", JSON.stringify(data));
  // S'assurer que http_auth_enabled est un boolean et pas undefined
  return {
    ...data,
    http_auth_enabled: data.http_auth_enabled === true,
    // S'assurer que les champs auth ne sont jamais undefined
    http_auth_username: data.http_auth_username || "",
    http_auth_password: data.http_auth_password || ""
  };
});

// Products from PrestaShop stores
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  site_id: integer("site_id").notNull(),
  presta_id: integer("presta_id").notNull(), // ID in the PrestaShop store
  name: text("name").notNull(),
  reference: text("reference"),
  current_quantity: integer("current_quantity").default(0),
  min_quantity: integer("min_quantity").default(0),
  product_type: text("product_type").default("simple"), // simple, combination
  is_attribute: boolean("is_attribute").default(false), // true for product attributes/combinations
  parent_id: integer("parent_id"), // reference to parent product for attributes
  attribute_id: integer("attribute_id"), // ID of the product attribute in PrestaShop (id_product_attribute)
  status: text("status").default("active"), // active, inactive, discontinued, etc.
  price: text("price"), // Current price
  condition: text("condition").default("new"), // new, used, refurbished
  last_update: timestamp("last_update").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

// Les attributs sont maintenant gérés directement dans la table products
// avec la propriété is_attribute et parent_id pour créer les relations

export const insertProductSchema = createInsertSchema(products).pick({
  site_id: true,
  presta_id: true,
  name: true,
  reference: true,
  current_quantity: true,
  min_quantity: true,
  product_type: true,
  is_attribute: true,
  parent_id: true,
  attribute_id: true,
  status: true,
  price: true,
  condition: true,
});

// Price history for products
export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull(),
  price: text("price").notNull(), // Stored as text to preserve exact decimal values
  date: timestamp("date").defaultNow(),
  type: text("type").default("sync").notNull(), // sync, change, manual, order, etc.
});

export const insertPriceHistorySchema = createInsertSchema(priceHistory).pick({
  product_id: true,
  price: true,
  date: true,
  type: true,
});

// Stock alerts
export const stockAlerts = pgTable("stock_alerts", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull(),
  alert_type: text("alert_type").notNull(), // low_stock, out_of_stock
  status: text("status").default("active"), // active, resolved
  created_at: timestamp("created_at").defaultNow(),
});

export const insertStockAlertSchema = createInsertSchema(stockAlerts).pick({
  product_id: true,
  alert_type: true,
  status: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;

export type StockAlert = typeof stockAlerts.$inferSelect;
export type InsertStockAlert = z.infer<typeof insertStockAlertSchema>;

// Module logs from PrestaShop
export const moduleLogs = pgTable("module_logs", {
  id: serial("id").primaryKey(),
  site_id: integer("site_id").notNull(),
  type: text("type").notNull(), // api, sync, error, etc.
  status: text("status").notNull(), // success, error, warning, info
  message: text("message").notNull(),
  details: json("details"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertModuleLogSchema = createInsertSchema(moduleLogs).pick({
  site_id: true,
  type: true,
  status: true, 
  message: true,
  details: true,
  created_at: true,
});

export type ModuleLog = typeof moduleLogs.$inferSelect;
export type InsertModuleLog = z.infer<typeof insertModuleLogSchema>;

// Statistiques générales du site
export const siteStats = pgTable("site_stats", {
  id: serial("id").primaryKey(),
  site_id: integer("site_id").notNull().unique(),
  total_customers: integer("total_customers").default(0),
  total_orders: integer("total_orders").default(0),
  total_revenue: text("total_revenue").default("0"), // Stocké comme texte pour préserver les valeurs décimales exactes
  total_products: integer("total_products").default(0),
  total_categories: integer("total_categories").default(0),
  last_update: timestamp("last_update").defaultNow(),
});

export const insertSiteStatsSchema = createInsertSchema(siteStats).pick({
  site_id: true,
  total_customers: true,
  total_orders: true,
  total_revenue: true,
  total_products: true,
  total_categories: true,
});

export type SiteStats = typeof siteStats.$inferSelect;
export type InsertSiteStats = z.infer<typeof insertSiteStatsSchema>;
