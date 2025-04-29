import { pgTable, serial, integer, text, timestamp, unique, index, varchar, json, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const priceHistory = pgTable("price_history", {
	id: serial().primaryKey().notNull(),
	productId: integer("product_id").notNull(),
	price: text().notNull(),
	date: timestamp({ mode: 'string' }).defaultNow(),
});

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	siteId: integer("site_id").notNull(),
	prestaId: integer("presta_id").notNull(),
	name: text().notNull(),
	reference: text(),
	currentQuantity: integer("current_quantity").default(0),
	minQuantity: integer("min_quantity").default(0),
	lastUpdate: timestamp("last_update", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const stockAlerts = pgTable("stock_alerts", {
	id: serial().primaryKey().notNull(),
	productId: integer("product_id").notNull(),
	alertType: text("alert_type").notNull(),
	status: text().default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	email: text().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_username_unique").on(table.username),
]);

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: json().notNull(),
	expire: timestamp({ precision: 6, mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const sites = pgTable("sites", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	name: text().notNull(),
	url: text().notNull(),
	apiKey: text("api_key").notNull(),
	version: text(),
	status: text().default('disconnected'),
	lastSync: timestamp("last_sync", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	httpAuthEnabled: boolean("http_auth_enabled").default(false),
	httpAuthUsername: text("http_auth_username"),
	httpAuthPassword: text("http_auth_password"),
});
