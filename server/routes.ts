import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { prestashopSyncService } from "./services/prestashop-sync";
import path from "path";
import fs from "fs";
import https from "https";
import archiver from "archiver";
import { 
  InsertModuleLog, 
  InsertPriceHistory, 
  InsertProduct, 
  InsertSite, 
  InsertStockAlert, 
  insertPriceHistorySchema, 
  insertStockAlertSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Dashboard
  app.get("/api/dashboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      // Get sites
      const sites = await storage.getSitesByUserId(req.user!.id);
      const siteIds = sites.map(site => site.id);
      
      // Get total products by site
      const productCounts: Record<number, number> = {};
      for (const siteId of siteIds) {
        const { total } = await storage.getProductsBySiteId(siteId);
        productCounts[siteId] = total;
      }
      
      // Get active stock alerts
      const activeAlerts = await storage.getActiveStockAlerts();
      
      // Get recent price changes
      const recentPriceChanges = await storage.getRecentPriceChanges();
      
      // Get site stats
      const siteStats: Record<number, any> = {};
      for (const siteId of siteIds) {
        const stats = await storage.getSiteStats(siteId);
        if (stats) {
          siteStats[siteId] = stats;
        }
      }
      
      res.json({
        sites,
        productCounts,
        activeAlerts,
        recentPriceChanges,
        siteStats
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });
  
  // Endpoint pour les données du tableau de bord d'un site spécifique
  app.get("/api/dashboard/:siteId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const siteId = parseInt(req.params.siteId);
    
    try {
      // Vérifier si le site appartient à l'utilisateur
      const site = await storage.getSite(siteId);
      if (!site || site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view this site's dashboard" });
      }
      
      // Get products for this site
      const { products, total: productCount } = await storage.getProductsBySiteId(siteId);
      
      // Get active stock alerts for this site
      const allAlerts = await storage.getActiveStockAlerts();
      const stockAlerts = allAlerts.filter(alert => alert.site.id === siteId);
      
      // Get recent price changes for this site
      const allChanges = await storage.getRecentPriceChanges();
      const priceChanges = allChanges.filter(change => change.site.id === siteId);
      
      // Get site stats
      const siteStats = await storage.getSiteStats(siteId);
      
      res.json({
        site,
        productCount,
        stockAlerts,
        priceChanges,
        siteStats
      });
    } catch (error) {
      console.error("Error fetching dashboard data for site:", error);
      res.status(500).json({ message: "Failed to load site dashboard data" });
    }
  });

  // Sites
  app.get("/api/sites", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const sites = await storage.getSitesByUserId(req.user!.id);
      res.json(sites);
    } catch (error) {
      res.status(500).json({ message: "Failed to get sites" });
    }
  });

  app.post("/api/sites", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const siteData: InsertSite = {
        ...req.body,
        user_id: req.user!.id,
      };
      const site = await storage.createSite(siteData);
      res.status(201).json(site);
    } catch (error) {
      res.status(500).json({ message: "Failed to create site" });
    }
  });

  app.get("/api/sites/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const siteId = parseInt(req.params.id);
    
    try {
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      if (site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view this site" });
      }
      
      res.json(site);
    } catch (error) {
      res.status(500).json({ message: "Failed to get site" });
    }
  });

  app.put("/api/sites/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const siteId = parseInt(req.params.id);
    
    try {
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      if (site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this site" });
      }
      
      const updatedSite = await storage.updateSite(siteId, req.body);
      res.json(updatedSite);
    } catch (error) {
      res.status(500).json({ message: "Failed to update site" });
    }
  });

  app.delete("/api/sites/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const siteId = parseInt(req.params.id);
    
    try {
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      if (site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this site" });
      }
      
      const success = await storage.deleteSite(siteId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete site" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete site" });
    }
  });

  // Test connection
  app.post("/api/sites/:id/test-connection", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const siteId = parseInt(req.params.id);
    
    try {
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      if (site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to test this site" });
      }
      
      const result = await prestashopSyncService.testConnection(siteId);
      
      if (result.success) {
        await storage.updateSite(siteId, { status: "connected" });
      } else {
        await storage.updateSite(siteId, { status: "disconnected" });
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to test connection",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Sync products - Accept both GET and POST for compatibility with frontend
  const syncProducts = async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const siteId = parseInt(req.params.id);
    
    try {
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      if (site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to sync this site" });
      }
      
      // Try to get products from PrestaShop
      const products = await prestashopSyncService.fetchProductsFromPrestaShop(siteId);
      
      if (!products || products.length === 0) {
        return res.status(404).json({ message: "No products found on PrestaShop site" });
      }
      
      // Sync products
      await prestashopSyncService.syncAllProducts(siteId, products);
      
      // Update last sync date
      const now = new Date();
      await storage.updateSite(siteId, { 
        last_sync: now,
        status: "connected"
      });
      
      res.json({ 
        success: true, 
        message: `Successfully synced ${products.length} products`
      });
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).json({ 
        message: "Failed to sync products",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
  
  // Endpoint pour récupérer les données brutes de l'API Prestashop sans transformation
  app.get("/api/sites/:id/raw-products", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const siteId = parseInt(req.params.id);
    
    try {
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      if (site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to access this site" });
      }
      
      // Appel direct à l'API du module, exactement comme dans prestashop-sync.ts
      // mais sans transformation des données
      try {
        const url = `${site.url.endsWith('/') ? site.url : site.url + '/'}modules/prestasynch/api.php?action=products`;
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
        
        // Ajouter l'en-tête d'authentification Basic si activé
        if (site.http_auth_enabled && site.http_auth_username && site.http_auth_password) {
          const auth = Buffer.from(`${site.http_auth_username}:${site.http_auth_password}`).toString('base64');
          headers['Authorization'] = `Basic ${auth}`;
        }
        
        // Ajouter la clé API dans les en-têtes
        headers['X-Api-Key'] = site.api_key;
        
        // Créer un agent HTTPS qui ignore les erreurs de certificat pour les sites de développement
        const httpsAgent = new https.Agent({
          rejectUnauthorized: false
        });
        
        console.log(`Récupération des données brutes de l'API PrestaShop pour le site ${siteId}...`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers,
          agent: url.startsWith('https:') ? httpsAgent : undefined,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API PrestaShop request failed with status ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`Données récupérées avec succès: ${data.products?.length || 0} produits`);
        
        res.json(data);
      } catch (apiError) {
        console.error("Erreur lors de l'appel à l'API PrestaShop:", apiError);
        res.status(500).json({ 
          message: "Failed to fetch data from PrestaShop API",
          error: apiError instanceof Error ? apiError.message : String(apiError)
        });
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du site:", error);
      res.status(500).json({ message: "Failed to get site information" });
    }
  });

  // Enregistrer les routes pour les méthodes GET et POST
  app.get("/api/sites/:id/sync", syncProducts);
  app.post("/api/sites/:id/sync", syncProducts);
  
  // Reset site data
  app.post("/api/sites/:id/reset", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const siteId = parseInt(req.params.id);
    
    try {
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      if (site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to reset this site" });
      }
      
      // Get all products for this site
      const productIds = await storage.getProductIdsBySiteId(siteId);
      console.log(`Suppression de ${productIds.length} produits pour le site ${siteId}...`);
      
      // Supprimer d'abord les alertes de stock associées au site
      await storage.deleteStockAlertsBySiteId(siteId);
      
      // Delete all products
      for (const productId of productIds) {
        await storage.deleteProduct(productId);
      }
      
      // Supprimer tout l'historique des prix, y compris les entrées orphelines
      console.log(`Suppression de l'historique des prix pour le site ${siteId}...`);
      await storage.deletePriceHistoryBySiteId(siteId);
      
      // Clear module logs
      console.log(`Suppression des logs pour le site ${siteId}...`);
      await storage.clearModuleLogs(siteId);
      
      // Réinitialiser les statistiques du site
      console.log(`Réinitialisation des statistiques pour le site ${siteId}...`);
      const siteStats = await storage.getSiteStats(siteId);
      if (siteStats) {
        // Mettre à jour les statistiques avec des valeurs à zéro
        await storage.updateSiteStats(siteStats.id, {
          total_customers: 0,
          total_orders: 0,
          total_revenue: "0",
          total_products: 0,
          total_categories: 0,
          last_update: new Date()
        });
      }
      
      // Mettre à jour la date de dernière synchronisation
      console.log(`Réinitialisation de la date de synchronisation pour le site ${siteId}...`);
      await storage.updateSite(siteId, {
        last_sync: null
      });
      
      console.log(`Réinitialisation complète du site ${siteId} terminée.`);
      res.json({ 
        success: true, 
        message: `Successfully reset data for site: ${site.name}`
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to reset site data",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Products
  app.get("/api/sites/:siteId/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const siteId = parseInt(req.params.siteId);
    
    try {
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      if (site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view products for this site" });
      }
      
      // Get filters from query params
      const filters: any = {
        status: req.query.status as string,
        condition: req.query.condition as string,
        reference: req.query.reference as string,
        productType: req.query.productType as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };
      
      // Traiter spécifiquement le cas de isAttribute seulement s'il est explicitement défini
      if (req.query.isAttribute !== undefined) {
        filters.isAttribute = req.query.isAttribute === 'true';
      }
      
      const { products, total } = await storage.getProductsBySiteId(siteId, filters);
      
      res.json({ 
        products,
        total,
        page: filters.page || 1,
        limit: filters.limit || products.length
      });
    } catch (error) {
      res.status(500).json({ message: `Failed to get products ${error}` });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const productId = parseInt(req.params.id);
    
    try {
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const site = await storage.getSite(product.site_id);
      
      if (!site || site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view this product" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const productId = parseInt(req.params.id);
    
    try {
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const site = await storage.getSite(product.site_id);
      
      if (!site || site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }
      
      const updatedProduct = await storage.updateProduct(productId, req.body);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const productId = parseInt(req.params.id);
    
    try {
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const site = await storage.getSite(product.site_id);
      
      if (!site || site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this product" });
      }
      
      const success = await storage.deleteProduct(productId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete product" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Price history
  app.get("/api/products/:productId/price-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const productId = parseInt(req.params.productId);
    
    try {
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const site = await storage.getSite(product.site_id);
      
      if (!site || site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view price history for this product" });
      }
      
      const priceHistory = await storage.getPriceHistoryByProductId(productId);
      res.json(priceHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to get price history" });
    }
  });
  
  // Récupérer l'historique des prix depuis PrestaShop - format API avec siteId
  app.get("/api/sites/:siteId/products/:productId/price-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const siteId = parseInt(req.params.siteId);
    const productId = parseInt(req.params.productId);
    
    try {
      const site = await storage.getSite(siteId);
      if (!site || site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view price history for this site" });
      }
      
      const product = await storage.getProduct(productId);
      if (!product || product.site_id !== siteId) {
        return res.status(404).json({ message: "Product not found for this site" });
      }
      
      // Récupérer l'historique directement depuis PrestaShop
      const priceHistoryData = await prestashopSyncService.fetchProductPriceHistory(siteId, product.presta_id);
      
      // Enrichir les données avec des informations locales
      const enrichedData = {
        ...priceHistoryData,
        local_data: {
          id_local: product.id,
          site_id: site.id,
          site_name: site.name
        }
      };
      
      res.json(enrichedData);
    } catch (error) {
      console.error("Error fetching PrestaShop price history:", error);
      res.status(500).json({ 
        message: "Failed to fetch price history from PrestaShop",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Route directe pour récupérer l'historique complet des prix depuis PrestaShop
  app.get("/api/products/:productId/prestashop-price-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const productId = parseInt(req.params.productId);
    
    try {
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const site = await storage.getSite(product.site_id);
      
      if (!site || site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view price history for this product" });
      }
      
      // Vérifier si le produit a un ID PrestaShop valide
      if (!product.presta_id) {
        return res.status(400).json({ message: "Product does not have a valid PrestaShop ID" });
      }
      
      // Récupérer l'historique directement depuis PrestaShop
      const priceHistoryData = await prestashopSyncService.fetchProductPriceHistory(site.id, product.presta_id);
      
      // Enrichir les données avec des informations locales
      const enrichedData = {
        ...priceHistoryData,
        local_data: {
          id_local: product.id,
          site_id: site.id,
          site_name: site.name
        }
      };
      
      res.json(enrichedData);
    } catch (error) {
      console.error("Error fetching PrestaShop price history:", error);
      res.status(500).json({ 
        message: "Failed to fetch price history from PrestaShop",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.post("/api/products/:productId/price-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const productId = parseInt(req.params.productId);
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    const site = await storage.getSite(product.site_id);
    if (!site || site.user_id !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to add price history to this product" });
    }
    
    try {
      const priceHistoryData = insertPriceHistorySchema.parse({ ...req.body, product_id: productId });
      const priceHistory = await storage.createPriceHistory(priceHistoryData);
      res.status(201).json(priceHistory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid price history data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create price history" });
    }
  });
  
  // Route pour rafraîchir l'historique des prix d'un produit à partir de PrestaShop
  app.post("/api/products/:productId/refresh-price-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const productId = parseInt(req.params.productId);
    const product = await storage.getProduct(productId);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    const site = await storage.getSite(product.site_id);
    if (!site || site.user_id !== req.user!.id) {
      return res.status(403).json({ message: "Not authorized to refresh price history for this product" });
    }
    
    try {
      // Vérifier si le produit a un ID PrestaShop valide
      if (!product.presta_id) {
        return res.status(400).json({ message: "Product does not have a valid PrestaShop ID" });
      }
      
      // Récupérer l'historique directement depuis PrestaShop
      const priceHistoryData = await prestashopSyncService.fetchProductPriceHistory(site.id, product.presta_id);
      
      if (!priceHistoryData || !priceHistoryData.history || !priceHistoryData.history.price_changes) {
        return res.status(404).json({ message: "No price history found for this product in PrestaShop" });
      }
      
      // Pour chaque changement de prix, ajouter une entrée dans l'historique local
      let addedEntries = 0;
      for (const change of priceHistoryData.history.price_changes) {
        // Éviter les doublons - vérifier si un enregistrement similaire existe déjà
        const existingHistory = await storage.getPriceHistoryByProductId(productId);
        const changeDate = new Date(change.date);
        
        // Vérifier s'il existe déjà un enregistrement pour cette date précise (à la seconde près)
        const duplicate = existingHistory.some(entry => {
          if (!entry.date) return false;
          const entryDate = new Date(entry.date);
          return entryDate.getTime() === changeDate.getTime() && 
                 entry.price === change.new_price.toString();
        });
        
        if (!duplicate) {
          const priceHistory: InsertPriceHistory = {
            product_id: productId,
            price: change.new_price.toString(),
            date: changeDate,
            type: change.type
          };
          
          await storage.createPriceHistory(priceHistory);
          addedEntries++;
        }
      }
      
      res.json({ 
        success: true, 
        message: `Refreshed price history with ${addedEntries} new entries`
      });
    } catch (error) {
      console.error("Error refreshing price history:", error);
      res.status(500).json({ 
        message: "Failed to refresh price history",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Stock alerts
  app.get("/api/products/:productId/stock-alerts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const productId = parseInt(req.params.productId);
    
    try {
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const site = await storage.getSite(product.site_id);
      
      if (!site || site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view stock alerts for this product" });
      }
      
      const stockAlerts = await storage.getStockAlertsByProductId(productId);
      res.json(stockAlerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stock alerts" });
    }
  });

  app.post("/api/products/:productId/stock-alerts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const productId = parseInt(req.params.productId);
    
    try {
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const site = await storage.getSite(product.site_id);
      
      if (!site || site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to add stock alert to this product" });
      }
      
      try {
        const stockAlertData = insertStockAlertSchema.parse({ ...req.body, product_id: productId });
        const stockAlert = await storage.createStockAlert(stockAlertData);
        res.status(201).json(stockAlert);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid stock alert data", errors: error.errors });
        }
        throw error;
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to create stock alert" });
    }
  });

  app.put("/api/stock-alerts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const alertId = parseInt(req.params.id);
    
    try {
      const alerts = await storage.getActiveStockAlerts();
      const alert = alerts.find(a => a.id === alertId);
      
      if (!alert) {
        return res.status(404).json({ message: "Stock alert not found" });
      }
      
      if (alert.site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to update this stock alert" });
      }
      
      const updatedAlert = await storage.updateStockAlert(alertId, req.body);
      res.json(updatedAlert);
    } catch (error) {
      res.status(500).json({ message: "Failed to update stock alert" });
    }
  });

  app.delete("/api/stock-alerts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const alertId = parseInt(req.params.id);
    
    try {
      const alerts = await storage.getActiveStockAlerts();
      const alert = alerts.find(a => a.id === alertId);
      
      if (!alert) {
        return res.status(404).json({ message: "Stock alert not found" });
      }
      
      if (alert.site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to delete this stock alert" });
      }
      
      const success = await storage.deleteStockAlert(alertId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete stock alert" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete stock alert" });
    }
  });

  // Active alerts
  app.get("/api/stock-alerts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const allAlerts = await storage.getActiveStockAlerts();
      const userAlerts = allAlerts.filter(alert => alert.site.user_id === req.user!.id);
      
      res.json(userAlerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get active stock alerts" });
    }
  });

  // Recent price changes
  app.get("/api/price-changes", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const allChanges = await storage.getRecentPriceChanges();
      const userChanges = allChanges.filter(change => change.site.user_id === req.user!.id);
      
      res.json(userChanges);
    } catch (error) {
      res.status(500).json({ message: "Failed to get recent price changes" });
    }
  });

  // Module logs
  app.get("/api/sites/:siteId/logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const siteId = parseInt(req.params.siteId);
    
    try {
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      if (site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to view logs for this site" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getModuleLogsBySiteId(siteId, limit);
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get module logs" });
    }
  });

  app.delete("/api/sites/:siteId/logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    const siteId = parseInt(req.params.siteId);
    
    try {
      const site = await storage.getSite(siteId);
      
      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }
      
      if (site.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized to clear logs for this site" });
      }
      
      const success = await storage.clearModuleLogs(siteId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to clear logs" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to clear logs" });
    }
  });

  // Webhook pour les notifications automatiques ou en temps réel depuis PrestaShop
  app.post("/api/prestashop/webhook", async (req, res) => {
    try {
      // Vérifier l'authenticité de la requête avec la clé API
      const apiKey = req.headers['x-api-key'] || req.query.api_key;
      
      if (!apiKey) {
        return res.status(401).json({ error: "Clé API manquante" });
      }
      
      // Trouver le site correspondant à cette clé API
      const sites = await storage.getSites();
      const site = sites.find(site => site.api_key === apiKey);
      
      if (!site) {
        return res.status(401).json({ error: "Clé API invalide" });
      }
      
      // Traiter les données reçues
      const products = req.body.products;
      
      if (!products || !Array.isArray(products)) {
        return res.status(400).json({ error: "Format de données invalide" });
      }
      
      // Synchroniser les produits reçus
      await prestashopSyncService.syncAllProducts(site.id, products);
      
      // Mettre à jour la date de dernière synchronisation
      const now = new Date();
      await storage.updateSite(site.id, { 
        last_sync: now,
        status: 'connected'
      });
      
      // Enregistrer un log pour cette action
      const logData: InsertModuleLog = {
        site_id: site.id,
        type: 'sync',
        status: 'success',
        message: `Synchronisation de ${products.length} produits via webhook`,
        details: null,
        created_at: now
      };
      await storage.createModuleLog(logData);
      
      res.status(200).json({ success: true, message: "Synchronisation réussie" });
    } catch (error) {
      console.error('Erreur dans le webhook PrestaShop:', error);
      res.status(500).json({ error: "Erreur interne lors de la synchronisation" });
    }
  });
  
  // Endpoint pour la synchronisation manuelle depuis PrestaShop
  app.post("/api/prestashop/sync", async (req, res) => {
    try {
      // Vérifier l'authenticité de la requête avec la clé API
      const apiKey = req.headers['x-api-key'] || req.query.api_key;
      
      if (!apiKey) {
        return res.status(401).json({ error: "Clé API manquante" });
      }
      
      // Trouver le site correspondant à cette clé API
      const sites = await storage.getSites();
      const site = sites.find(site => site.api_key === apiKey);
      
      if (!site) {
        return res.status(401).json({ error: "Clé API invalide" });
      }
      
      // Traiter les données reçues
      const products = req.body.products;
      
      if (!products || !Array.isArray(products)) {
        return res.status(400).json({ error: "Format de données invalide" });
      }
      
      // Synchroniser les produits reçus
      await prestashopSyncService.syncAllProducts(site.id, products);
      
      // Mettre à jour la date de dernière synchronisation
      const now = new Date();
      await storage.updateSite(site.id, { 
        last_sync: now,
        status: 'connected'
      });
      
      // Enregistrer un log pour cette action
      const logData: InsertModuleLog = {
        site_id: site.id,
        type: 'sync',
        status: 'success',
        message: `Synchronisation manuelle de ${products.length} produits`,
        details: null,
        created_at: now
      };
      await storage.createModuleLog(logData);
      
      res.status(200).json({ success: true, message: "Synchronisation manuelle réussie" });
    } catch (error) {
      console.error('Erreur dans la synchronisation manuelle PrestaShop:', error);
      res.status(500).json({ error: "Erreur interne lors de la synchronisation" });
    }
  });
  
  // Module download route - génère et envoie le module PrestaShop avec ses dernières modifications
  app.get("/api/module/download", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      // Créer le répertoire d'export si nécessaire
      if (!fs.existsSync('./prestashop-module/export')) {
        fs.mkdirSync('./prestashop-module/export', { recursive: true });
      }
      
      // Chemin du module à exporter
      const moduleFilePath = './prestashop-module/export/prestasynch.zip';
      
      // Créer une archive ZIP pour le module PrestaShop avec ses dernières modifications
      const output = fs.createWriteStream(moduleFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      // Gérer les événements du stream
      const closePromise = new Promise<void>((resolve, reject) => {
        output.on('close', () => {
          console.log(`Module empaqueté avec succès: ${archive.pointer()} octets`);
          resolve();
        });
        
        archive.on('error', (err: Error) => {
          console.error('Erreur lors de la création du zip:', err);
          reject(err);
        });
      });
      
      // Pipe l'archive vers le flux de sortie
      archive.pipe(output);
      
      // Ajouter les fichiers du module à l'archive
      archive.directory('./prestashop-module/prestasynch', 'prestasynch');
      
      // Finaliser l'archive
      archive.finalize();
      
      // Attendre que l'archive soit créée
      await closePromise;
      
      // Définir l'en-tête Content-Disposition pour forcer le téléchargement
      res.attachment('prestasynch.zip');
      
      // Créer un flux de lecture et l'envoyer comme réponse
      const fileStream = fs.createReadStream(moduleFilePath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error("Error downloading module:", error);
      res.status(500).json({ 
        message: "Failed to download module",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
