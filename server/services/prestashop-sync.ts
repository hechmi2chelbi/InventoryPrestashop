import { storage } from "../storage";
import { log } from "../vite";
import { InsertProduct, InsertPriceHistory, InsertStockAlert, InsertSiteStats } from "@shared/schema";
import fetch from "node-fetch";
import https from "https";

interface PrestaShopProductData {
  id: number;
  name: string;
  reference: string;
  price: string;
  quantity: number;
  id_product_attribute?: number;
  parent_id?: number;
  declinaisons?: string;
}

interface PrestaShopStatsData {
  total_customers: number;
  total_orders: number;
  total_revenue: string;
  total_products: number;
  total_categories: number;
}

interface PrestaShopPriceHistory {
  product: {
    id: number;
    name: string;
    reference: string;
    current_price: number;
    date_add: string;
    date_upd: string;
  };
  history: {
    current: {
      price: number;
      date: string;
    };
    specific_prices: Array<{
      price: number;
      original_price: number;
      reduction: number;
      reduction_type: string;
      from_quantity: number;
      from: string | null;
      to: string | null;
      date_added: string;
    }>;
    order_prices: Array<{
      price: number;
      date: string;
    }>;
    price_changes: Array<{
      old_price: number;
      new_price: number;
      change: number;
      percent_change: number;
      date: string;
      type: string;
    }>;
  };
}

// Interface pour les attributs de produits
interface PrestaShopProductAttributeData {
  id_product: number;
  reference: string;
  id_product_attribute: number;
  declinaisons?: string; // Format: "(Couleur: Rouge, Taille: M)"
  name?: string;
  price?: string;
  quantity?: number;
}

export class PrestaShopSyncService {
  /**
   * Effectue une requête HTTP vers un site PrestaShop en gérant l'authentification HTTP si nécessaire
   * @param siteId Identifiant du site dans notre application
   * @param endpoint Point d'entrée de l'API (par exemple '/api/products')
   * @param method Méthode HTTP (GET, POST, etc.)
   * @param body Données à envoyer dans la requête (pour POST, PUT, etc.)
   * @returns Réponse de l'API
   */
  async makePrestaShopRequest(siteId: number, endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    // Récupérer les informations du site, y compris les identifiants HTTP s'ils existent
    const site = await storage.getSite(siteId);
    if (!site) {
      throw new Error(`Site with id ${siteId} not found`);
    }

    let url = site.url;
    if (!url.endsWith('/')) {
      url += '/';
    }
    url += endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;

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

    // Option pour ignorer les erreurs SSL (utiliser avec prudence)
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false // Permet les certificats auto-signés
    });

    log(`Making ${method} request to ${url}`, "prestashop-sync");

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        agent: url.startsWith('https:') ? httpsAgent : undefined,
      });

      if (!response.ok) {
        // Récupérer le texte de l'erreur si possible
        const errorText = await response.text();
        throw new Error(`PrestaShop API request failed with status ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      log(`API request error: ${error instanceof Error ? error.message : String(error)}`, "prestashop-sync");
      throw error;
    }
  }

  /**
   * Synchronise un produit attribut (déclinaison)
   * @param siteId L'identifiant du site dans notre application
   * @param data Les données de l'attribut provenant de PrestaShop
   */
  async syncProductAttribute(siteId: number, data: PrestaShopProductData): Promise<void> {
    try {
      log(`Syncing product attribute ${data.reference} (id_product_attribute: ${data.id_product_attribute}) from site ${siteId}`, "prestashop-sync");
      
      // Chercher le produit parent - utiliser uniquement les produits non-attributs
      const { products: parentProducts } = await storage.getProductsBySiteId(siteId, { isAttribute: false });
      const parentId = data.parent_id || data.id;
      const parentProduct = parentProducts.find(p => p.presta_id === parentId);
      
      if (!parentProduct) {
        log(`Parent product not found for attribute ${data.reference} (parent_id: ${parentId})`, "prestashop-sync");
        // Si le parent n'existe pas encore, ne pas traiter cet attribut maintenant
        // Il sera traité lors d'une prochaine synchronisation quand le parent existera
        return;
      }
      
      // Chercher si l'attribut existe déjà - utiliser uniquement les attributs
      const { products: attributeProducts } = await storage.getProductsBySiteId(siteId, { isAttribute: true });
      const existingAttribute = attributeProducts.find(p => 
        p.attribute_id === data.id_product_attribute &&
        p.parent_id === parentProduct.id
      );
      
      if (existingAttribute) {
        // Mettre à jour l'attribut existant
        await storage.updateProduct(existingAttribute.id, {
          name: parentProduct.name + (data.declinaisons ? ' ' + data.declinaisons : ''),
          reference: data.reference,
          current_quantity: data.quantity || 0,
          last_update: new Date()
        });
        
        // Ajouter une entrée d'historique de prix si le prix est différent
        if (data.price) {
          const priceHistory: InsertPriceHistory = {
            product_id: existingAttribute.id,
            price: data.price,
            type: "attribute"
          };
          await storage.createPriceHistory(priceHistory);
        }
        
        log(`Updated attribute ${data.reference} for product ${parentProduct.name}`, "prestashop-sync");
      } else {
        // Créer un nouvel attribut
        const attributeName = parentProduct.name + (data.declinaisons ? ' ' + data.declinaisons : '');
        
        const newAttribute: InsertProduct = {
          site_id: siteId,
          name: attributeName,
          reference: data.reference,
          presta_id: data.parent_id || data.id,
          current_quantity: data.quantity || 0,
          is_attribute: true,
          parent_id: parentProduct.id,
          attribute_id: data.id_product_attribute,
          product_type: 'attribute'
        };
        
        const createdAttribute = await storage.createProduct(newAttribute);
        
        // Ajouter une entrée d'historique de prix
        if (data.price) {
          const priceHistory: InsertPriceHistory = {
            product_id: createdAttribute.id,
            price: data.price,
            type: "attribute"
          };
          await storage.createPriceHistory(priceHistory);
        }
        
        log(`Created new product attribute ${attributeName} for product ${parentProduct.name}`, "prestashop-sync");
      }
    } catch (error) {
      log(`Error syncing product attribute ${data.reference}: ${error instanceof Error ? error.message : String(error)}`, "prestashop-sync");
      throw error;
    }
  }
  
  /**
   * Synchronise les données d'un produit depuis PrestaShop
   * @param siteId L'identifiant du site dans notre application
   * @param data Les données du produit provenant de PrestaShop
   */
  async syncProduct(siteId: number, data: PrestaShopProductData): Promise<void> {
    try {
      log(`Syncing product ${data.reference} from site ${siteId}`, "prestashop-sync");
      
      // Vérifier si c'est un produit avec attribut (id_product_attribute > 0)
      if (data.id_product_attribute && data.id_product_attribute > 0) {
        log(`Product ${data.reference} is an attribute (id_product_attribute: ${data.id_product_attribute})`, "prestashop-sync");
        await this.syncProductAttribute(siteId, data);
        return;
      }
      
      // Chercher si le produit existe déjà dans notre base
      // Récupérer uniquement les produits principaux (non attributs)
      const { products: existingProducts } = await storage.getProductsBySiteId(siteId, { isAttribute: false });
      const existingProduct = existingProducts.find(p => 
        p.reference === data.reference || p.presta_id === data.id
      );
      
      if (existingProduct) {
        // Le produit existe, créer une entrée d'historique de prix
        const priceHistory: InsertPriceHistory = {
          product_id: existingProduct.id,
          price: data.price,
        };
        await storage.createPriceHistory(priceHistory);
        
        // Vérifier si le stock a changé
        if (existingProduct.current_quantity !== data.quantity) {
          // Mettre à jour le stock
          await storage.updateProduct(existingProduct.id, { 
            current_quantity: data.quantity,
            last_update: new Date()
          });
          
          // Si le stock est bas (moins de 5), créer une alerte
          if (data.quantity <= 5 && data.quantity > 0) {
            const stockAlert: InsertStockAlert = {
              product_id: existingProduct.id,
              alert_type: 'low_stock',
              status: 'active',
            };
            await storage.createStockAlert(stockAlert);
            
            log(`Created low stock alert for product ${data.reference}`, "prestashop-sync");
          }
          
          // Si le stock est à zéro, créer une alerte de rupture
          if (data.quantity === 0) {
            const stockAlert: InsertStockAlert = {
              product_id: existingProduct.id,
              alert_type: 'out_of_stock',
              status: 'active',
            };
            await storage.createStockAlert(stockAlert);
            
            log(`Created out of stock alert for product ${data.reference}`, "prestashop-sync");
          }
        }
      } else {
        // Le produit n'existe pas encore, le créer
        const newProduct: InsertProduct = {
          site_id: siteId,
          name: data.name,
          reference: data.reference,
          presta_id: data.id,
          current_quantity: data.quantity,
          min_quantity: 5, // Seuil par défaut
        };
        
        const createdProduct = await storage.createProduct(newProduct);
        log(`Created new product ${data.name} from site ${siteId}`, "prestashop-sync");
        
        // Ajouter une entrée d'historique de prix
        const priceHistory: InsertPriceHistory = {
          product_id: createdProduct.id,
          price: data.price,
        };
        await storage.createPriceHistory(priceHistory);
        
        // Si le stock initial est bas, créer une alerte
        if (data.quantity <= 5 && data.quantity > 0) {
          const stockAlert: InsertStockAlert = {
            product_id: createdProduct.id,
            alert_type: 'low_stock',
            status: 'active',
          };
          await storage.createStockAlert(stockAlert);
        }
        
        // Si le stock initial est à zéro, créer une alerte de rupture
        if (data.quantity === 0) {
          const stockAlert: InsertStockAlert = {
            product_id: createdProduct.id,
            alert_type: 'out_of_stock',
            status: 'active',
          };
          await storage.createStockAlert(stockAlert);
        }
      }
    } catch (error) {
      log(`Error syncing product ${data.reference}: ${error instanceof Error ? error.message : String(error)}`, "prestashop-sync");
      throw error;
    }
  }
  
  /**
   * Récupère les produits directement depuis l'API PrestaShop
   * @param siteId Identifiant du site dans notre application
   * @returns Liste des produits récupérés depuis l'API
   */
  async fetchProductsFromPrestaShop(siteId: number): Promise<PrestaShopProductData[]> {
    try {
      log(`Fetching products from PrestaShop site ${siteId}`, "prestashop-sync");
      
      // Appel à l'API du module PrestaSynch pour récupérer les produits en utilisant GET
      // Le fichier API permet les requêtes GET pour l'action "products" (voir ligne 22 de api.php)
      const response = await this.makePrestaShopRequest(
        siteId, 
        'modules/prestasynch/api.php?action=products', 
        'GET'
      );
      
      if (!response || !Array.isArray(response.products)) {
        throw new Error("Invalid response format from PrestaShop API");
      }
      
      log(`Successfully fetched ${response.products.length} products from PrestaShop site ${siteId}`, "prestashop-sync");
      
      return response.products;
    } catch (error) {
      log(`Error fetching products from PrestaShop site ${siteId}: ${error instanceof Error ? error.message : String(error)}`, "prestashop-sync");
      throw error;
    }
  }

  /**
   * Vérifie la connexion avec un site PrestaShop
   * @param siteId Identifiant du site dans notre application
   * @returns Statut de la connexion
   */
  async testConnection(siteId: number): Promise<{ success: boolean; message: string }> {
    try {
      log(`Testing connection to PrestaShop site ${siteId}`, "prestashop-sync");
      
      // Appel à l'API du module PrestaSynch pour vérifier la connexion avec GET
      // Le fichier API permet les requêtes GET pour l'action "ping" (voir ligne 22 de api.php)
      const response = await this.makePrestaShopRequest(
        siteId, 
        'modules/prestasynch/api.php?action=ping', 
        'GET'
      );
      
      if (response && response.status === 'ok') {
        log(`Connection successful to PrestaShop site ${siteId}`, "prestashop-sync");
        
        // Mettre à jour le statut du site
        await storage.updateSite(siteId, { status: 'connected' });
        
        return { success: true, message: 'Connexion établie avec succès' };
      } else {
        log(`Connection failed to PrestaShop site ${siteId}: ${JSON.stringify(response)}`, "prestashop-sync");
        
        // Mettre à jour le statut du site
        await storage.updateSite(siteId, { status: 'disconnected' });
        
        return { success: false, message: 'Échec de connexion avec le site PrestaShop' };
      }
    } catch (error) {
      log(`Error testing connection to PrestaShop site ${siteId}: ${error instanceof Error ? error.message : String(error)}`, "prestashop-sync");
      
      // Mettre à jour le statut du site
      await storage.updateSite(siteId, { status: 'error' });
      
      return { success: false, message: `Erreur: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  /**
   * Récupère les statistiques générales depuis l'API PrestaShop
   * @param siteId Identifiant du site dans notre application
   * @returns Statistiques générales du site
   */
  async fetchStatsFromPrestaShop(siteId: number): Promise<PrestaShopStatsData> {
    try {
      log(`Fetching general statistics from PrestaShop site ${siteId}`, "prestashop-sync");
      
      // Appel à l'API du module PrestaSynch pour récupérer les statistiques
      // Utiliser GET au lieu de POST pour éviter les problèmes de format JSON
      const response = await this.makePrestaShopRequest(
        siteId, 
        'modules/prestasynch/api.php?action=stats', 
        'GET'
      );
      
      if (!response || !response.stats) {
        throw new Error("Invalid response format from PrestaShop Stats API");
      }
      
      log(`Successfully fetched statistics from PrestaShop site ${siteId}`, "prestashop-sync");
      
      // Sauvegarder les statistiques dans notre base de données
      const stats: InsertSiteStats = {
        site_id: siteId,
        total_customers: response.stats.total_customers || 0,
        total_orders: response.stats.total_orders || 0,
        total_revenue: response.stats.total_revenue || "0",
        total_products: response.stats.total_products || 0,
        total_categories: response.stats.total_categories || 0
      };
      
      await storage.createOrUpdateSiteStats(stats);
      
      return response.stats;
    } catch (error) {
      log(`Error fetching statistics from PrestaShop site ${siteId}: ${error instanceof Error ? error.message : String(error)}`, "prestashop-sync");
      throw error;
    }
  }

  /**
   * Synchronise tous les produits d'un site PrestaShop
   * @param siteId L'identifiant du site dans notre application
   * @param products Les données des produits provenant de PrestaShop
   */
  async syncAllProducts(siteId: number, products: PrestaShopProductData[]): Promise<void> {
    try {
      log(`Starting sync of ${products.length} products from site ${siteId}`, "prestashop-sync");
      
      // Synchroniser chaque produit
      for (const product of products) {
        await this.syncProduct(siteId, product);
      }
      
      // Les attributs sont maintenant directement traités par fetchProductsFromPrestaShop
      // qui inclut les produits avec attributs, donc il n'est plus nécessaire 
      // de faire un appel séparé pour syncProductAttributes
      
      // Mettre à jour la date de dernière synchronisation du site
      const site = await storage.getSite(siteId);
      if (site) {
        await storage.updateSite(siteId, { 
          last_sync: new Date(),
          status: 'connected'
        });
      }
      
      log(`Completed sync of ${products.length} products from site ${siteId}`, "prestashop-sync");
    } catch (error) {
      log(`Error during bulk sync for site ${siteId}: ${error instanceof Error ? error.message : String(error)}`, "prestashop-sync");
      
      // Mettre à jour le statut du site en cas d'erreur
      const site = await storage.getSite(siteId);
      if (site) {
        await storage.updateSite(siteId, { 
          status: 'error',
          last_sync: new Date()
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Récupère les produits avec leurs attributs/déclinaisons depuis l'API PrestaShop
   * Cette méthode récupère directement les données d'attributs du module PrestaShop
   * qui implémente lui-même la requête SQL
   * @param siteId Identifiant du site dans notre application
   * @returns Liste des produits et leurs attributs
   */
  async fetchProductsWithAttributes(siteId: number): Promise<PrestaShopProductAttributeData[]> {
    try {
      log(`Fetching products with attributes from PrestaShop site ${siteId}`, "prestashop-sync");
      
      // Appel à l'API du module PrestaSynch pour récupérer les produits avec attributs
      // Le module exécute lui-même la requête SQL pour obtenir les attributs
      const response = await this.makePrestaShopRequest(
        siteId, 
        'modules/prestasynch/api.php?action=products_with_attributes', 
        'GET'
      );
      
      if (!response || !Array.isArray(response.products)) {
        throw new Error("Invalid response format from PrestaShop Products with Attributes API");
      }
      
      log(`Successfully fetched ${response.products.length} products with attributes from PrestaShop site ${siteId}`, "prestashop-sync");
      
      return response.products;
    } catch (error) {
      log(`Error fetching products with attributes from PrestaShop site ${siteId}: ${error instanceof Error ? error.message : String(error)}`, "prestashop-sync");
      throw error;
    }
  }
  
  /**
   * Synchronise les attributs de produits depuis PrestaShop
   * Cette méthode n'est plus utilisée directement car les attributs sont traités
   * par fetchProductsFromPrestaShop et syncProduct
   * 
   * @param siteId L'identifiant du site dans notre application
   * @deprecated Cette méthode est conservée pour compatibilité mais n'est plus nécessaire
   */
  async syncProductAttributes(siteId: number): Promise<void> {
    log(`Method syncProductAttributes is deprecated. Attributes are now handled by fetchProductsFromPrestaShop`, "prestashop-sync");
    // Cette méthode est maintenue pour compatibilité mais son implémentation a été simplifiée
    // car les attributs sont désormais traités directement lors de la synchronisation des produits
  }

  async fetchProductPriceHistory(siteId: number, productId: number): Promise<PrestaShopPriceHistory> {
    try {
      log(`Fetching price history for product ${productId} from PrestaShop site ${siteId}`, "prestashop-sync");
      
      // Appel à l'API du module PrestaSynch pour récupérer l'historique des prix
      const response = await this.makePrestaShopRequest(
        siteId, 
        `modules/prestasynch/api.php?action=price_history&id_product=${productId}`, 
        'GET'
      );
      
      if (!response || !response.product || !response.history) {
        throw new Error("Invalid response format from PrestaShop Price History API");
      }
      
      log(`Successfully fetched price history for product ${productId} from PrestaShop site ${siteId}`, "prestashop-sync");
      
      return response as PrestaShopPriceHistory;
    } catch (error) {
      log(`Error fetching price history for product ${productId} from PrestaShop site ${siteId}: ${error instanceof Error ? error.message : String(error)}`, "prestashop-sync");
      throw error;
    }
  }
}

// Export une instance du service pour l'utiliser dans les routes
export const prestashopSyncService = new PrestaShopSyncService();