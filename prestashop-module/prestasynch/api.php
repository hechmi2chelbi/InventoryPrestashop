<?php
/**
 * API pour le module PHSy (PrestaSynch)
 *
 * Ce fichier gère les requêtes API faites depuis la plateforme PHSy vers la boutique PrestaShop
 * 
 * @author    PHSy Team
 * @copyright 2024 PHSy
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0
 */

// Initialisation de PrestaShop
include(dirname(__FILE__).'/../../config/config.inc.php');
include(dirname(__FILE__).'/../../init.php');
include(dirname(__FILE__).'/prestasynch.php');

// Vérification de la méthode HTTP
// Adaptation pour permettre les requêtes GET pour certaines actions
$isGetAllowed = false;
if (isset($_GET['action']) && in_array($_GET['action'], ['ping', 'stats', 'products', 'attributes', 'price_history', 'product_price_history', 'get_logs', 'manual_sync'])) {
    $isGetAllowed = true;
}

// Vérification de la méthode HTTP (sauf pour les actions qui supportent GET)
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && !$isGetAllowed) {
    header('HTTP/1.1 405 Method Not Allowed');
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Méthode non autorisée. Utilisez POST.']);
    exit;
}

// Récupération des données POST traditionnelles
$requestData = $_POST;

// Si pas de données en POST, essayer de lire le JSON du corps de la requête
if (empty($requestData) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputData = file_get_contents('php://input');
    if (!empty($inputData)) {
        $jsonData = json_decode($inputData, true);
        if ($jsonData !== null) {
            $requestData = $jsonData;
        }
    }
}

// Initialiser le module PHSy
$phsy = new Prestasynch();

// Exclure la vérification API pour certaines actions internes
$skipApiCheck = isset($_GET['action']) && in_array($_GET['action'], ['get_logs', 'clear_logs', 'manual_sync']);

if (!$skipApiCheck) {
    // Vérification de l'authentification par clé API
    $apiKey = null;

    // Extraire la clé API de l'en-tête ou des paramètres de la requête
    if (isset($_SERVER['HTTP_X_API_KEY'])) {
        $apiKey = $_SERVER['HTTP_X_API_KEY'];
    } elseif (isset($_GET['api_key'])) {
        $apiKey = $_GET['api_key'];
    } elseif (isset($requestData['api_key'])) {
        $apiKey = $requestData['api_key'];
    }

    // Vérifier si la clé API est valide
    $configuredApiKey = Configuration::get('PRESTASYNCH_API_KEY');
    if (!$apiKey || $apiKey !== $configuredApiKey) {
        // Journaliser la tentative d'accès avec une clé invalide
        $phsy->logActivity('api', 'error', 'Tentative d\'accès avec une clé API invalide', [
            'ip' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            'provided_key' => substr($apiKey ?? '', 0, 8) . '...' // Ne pas journaliser la clé complète
        ]);
        
        header('HTTP/1.1 401 Unauthorized');
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Clé API invalide ou manquante.']);
        exit;
    }

    // Journaliser l'accès réussi à l'API
    $phsy->logActivity('api', 'success', 'Accès API autorisé', [
        'action' => isset($_GET['action']) ? $_GET['action'] : 'default',
        'ip' => $_SERVER['REMOTE_ADDR']
    ]);
}

// Traitement de la requête en fonction de l'action demandée
$action = isset($_GET['action']) ? $_GET['action'] : 'default';

switch ($action) {
    case 'get_products':
    case 'products':
        // Récupérer la liste des produits
        $result = getProducts();
        break;
        
    case 'attributes':
        // Récupérer tous les attributs de produits (optimisé)
        $result = getProductAttributes();
        break;
        
    case 'get_product':
        // Récupérer un produit spécifique
        $productId = isset($_GET['id']) ? (int)$_GET['id'] : 
                     (isset($requestData['id_product']) ? (int)$requestData['id_product'] : 0);
                    
        if (!$productId) {
            header('HTTP/1.1 400 Bad Request');
            header('Content-Type: application/json');
            echo json_encode(['error' => 'ID du produit manquant.']);
            exit;
        }
        
        $result = getProduct($productId);
        break;
        
    case 'update_stock':
        // Mettre à jour le stock d'un produit
        if (!isset($requestData['id_product']) || !isset($requestData['quantity'])) {
            header('HTTP/1.1 400 Bad Request');
            header('Content-Type: application/json');
            echo json_encode(['error' => 'ID du produit ou quantité manquants.']);
            exit;
        }
        
        $result = updateProductStock($requestData['id_product'], $requestData['quantity']);
        break;
        
    case 'ping':
        // Simple vérification de connectivité
        $result = [
            'status' => 'ok', 
            'message' => 'PHSy module is connected.',
            'version' => Prestasynch::VERSION,
            'shop_name' => Configuration::get('PS_SHOP_NAME'),
            'ps_version' => _PS_VERSION_
        ];
        break;
        
    case 'stats':
        // Récupération des statistiques générales de la boutique
        $result = getShopStats();
        break;
    
    case 'price_history':
    case 'product_price_history':
        // Récupération de l'historique des prix d'un produit
        $productId = isset($_GET['id']) ? (int)$_GET['id'] : 
                     (isset($_GET['id_product']) ? (int)$_GET['id_product'] : 
                     (isset($requestData['id']) ? (int)$requestData['id'] : 
                     (isset($requestData['id_product']) ? (int)$requestData['id_product'] : 0)));
                     
        if (!$productId) {
            header('HTTP/1.1 400 Bad Request');
            header('Content-Type: application/json');
            echo json_encode(['error' => 'ID du produit manquant.']);
            exit;
        }
        
        $result = getProductPriceHistory($productId);
        break;
    
    case 'get_logs':
        // Récupération des logs du module - fonction interne pour l'interface admin
        $result = [
            'logs' => htmlspecialchars($phsy->getLogs(50))
        ];
        break;
        
    case 'clear_logs':
        // Effacer les logs du module - fonction interne pour l'interface admin
        $phsy->clearLogs();
        $result = [
            'success' => true,
            'message' => 'Logs effacés avec succès'
        ];
        break;
        
    case 'manual_sync':
        // Synchronisation manuelle avec l'application PHSy - fonction interne pour l'interface admin
        $syncUrl = isset($requestData['sync_url']) ? $requestData['sync_url'] : '';
        $syncApiKey = isset($requestData['api_key']) ? $requestData['api_key'] : '';
        
        if (empty($syncUrl) || empty($syncApiKey)) {
            $result = [
                'success' => false,
                'message' => 'URL de synchronisation ou clé API manquante'
            ];
            break;
        }
        
        // Enregistrer l'URL et la clé API dans la configuration
        Configuration::updateValue('PRESTASYNCH_SYNC_URL', $syncUrl);
        
        // Ne pas enregistrer la clé API si elle contient uniquement des astérisques (masquée)
        if (!preg_match('/^\*+$/', $syncApiKey)) {
            Configuration::updateValue('PRESTASYNCH_SYNC_API_KEY', $syncApiKey);
        }
        
        // Tester la synchronisation
        $testResult = testSyncWithPHSy($syncUrl, $syncApiKey);
        
        $result = [
            'success' => $testResult['success'],
            'message' => $testResult['message'],
            'data' => $testResult['data'] ?? null
        ];
        break;
        
    default:
        header('HTTP/1.1 400 Bad Request');
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Action non reconnue.']);
        exit;
}

// Envoi de la réponse
header('Content-Type: application/json');
echo json_encode($result);
exit;

/**
 * Tester la synchronisation avec l'application PHSy
 * 
 * @param string $syncUrl URL de l'application PHSy
 * @param string $syncApiKey Clé API de l'application PHSy
 * @return array Résultat du test
 */
function testSyncWithPHSy($syncUrl, $syncApiKey) {
    global $phsy;
    
    // Formater l'URL correctement
    if (!preg_match('/^https?:\/\//', $syncUrl)) {
        $syncUrl = 'https://' . $syncUrl;
    }
    
    // Supprimer le slash final si présent
    $syncUrl = rtrim($syncUrl, '/');
    
    // Journaliser l'action
    $phsy->logActivity('sync', 'info', 'Test de synchronisation avec PHSy', [
        'sync_url' => $syncUrl
    ]);
    
    try {
        // Préparer les données à envoyer
        $testData = [
            'shop_name' => Configuration::get('PS_SHOP_NAME'),
            'shop_url' => _PS_BASE_URL_,
            'ps_version' => _PS_VERSION_,
            'module_version' => Prestasynch::VERSION,
            'test_time' => date('Y-m-d H:i:s')
        ];
        
        // Envoyer la requête à l'application PHSy
        $ch = curl_init($syncUrl . '/api/test-connection');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'X-Api-Key: ' . $syncApiKey
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Ignorer les erreurs SSL pour les environnements de test
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            // Journaliser l'erreur
            $phsy->logActivity('sync', 'error', 'Erreur CURL lors du test de synchronisation', [
                'sync_url' => $syncUrl,
                'error' => $error
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur de connexion: ' . $error
            ];
        }
        
        if ($httpCode !== 200) {
            // Journaliser l'erreur
            $phsy->logActivity('sync', 'error', 'Erreur HTTP lors du test de synchronisation', [
                'sync_url' => $syncUrl,
                'http_code' => $httpCode,
                'response' => substr($response, 0, 500) // Limiter la taille de la réponse dans les logs
            ]);
            
            return [
                'success' => false,
                'message' => 'Erreur HTTP ' . $httpCode
            ];
        }
        
        $responseData = json_decode($response, true);
        
        if (!$responseData || !isset($responseData['success'])) {
            // Journaliser l'erreur
            $phsy->logActivity('sync', 'error', 'Réponse invalide lors du test de synchronisation', [
                'sync_url' => $syncUrl,
                'response' => substr($response, 0, 500)
            ]);
            
            return [
                'success' => false,
                'message' => 'Réponse invalide de l\'application PHSy'
            ];
        }
        
        if ($responseData['success']) {
            // Journaliser le succès
            $phsy->logActivity('sync', 'success', 'Test de synchronisation réussi', [
                'sync_url' => $syncUrl,
                'response' => isset($responseData['message']) ? $responseData['message'] : 'OK'
            ]);
            
            return [
                'success' => true,
                'message' => isset($responseData['message']) ? $responseData['message'] : 'Connexion établie avec succès',
                'data' => $responseData
            ];
        } else {
            // Journaliser l'échec
            $phsy->logActivity('sync', 'warning', 'Échec du test de synchronisation', [
                'sync_url' => $syncUrl,
                'response' => isset($responseData['message']) ? $responseData['message'] : 'Erreur inconnue'
            ]);
            
            return [
                'success' => false,
                'message' => isset($responseData['message']) ? $responseData['message'] : 'Échec de la connexion',
                'data' => $responseData
            ];
        }
    } catch (Exception $e) {
        // Journaliser l'exception
        $phsy->logActivity('sync', 'error', 'Exception lors du test de synchronisation', [
            'sync_url' => $syncUrl,
            'error' => $e->getMessage()
        ]);
        
        return [
            'success' => false,
            'message' => 'Exception: ' . $e->getMessage()
        ];
    }
}

/**
 * Récupération de tous les produits (actifs et non actifs) avec leurs attributs
 *
 * @return array
 */
function getProducts() {
    global $phsy;
    $context = Context::getContext();
    $id_lang = $context->language->id;
    
    // Journaliser le début de l'action
    $phsy->logActivity('api', 'info', 'Récupération de la liste des produits', [
        'action' => 'get_products',
        'language_id' => $id_lang
    ]);
    
    try {
        // Récupérer tous les produits, y compris les inactifs
        $sql = 'SELECT p.id_product FROM `'._DB_PREFIX_.'product` p
                ORDER BY p.id_product ASC';
        $db = Db::getInstance();
        $productIds = $db->executeS($sql);
        
        $result = [];
        $processedAttributes = [];
        
        // Traiter chaque produit individuellement
        foreach ($productIds as $productIdData) {
            $id_product = $productIdData['id_product'];
            $product = new Product($id_product, true, $id_lang);
            
            // Ajouter le produit principal
            $productInfo = [
                'id' => $product->id,
                'name' => $product->name,
                'reference' => $product->reference,
                'price' => $product->getPrice(),
                'quantity' => StockAvailable::getQuantityAvailableByProduct($product->id),
                'active' => (bool)$product->active,
                'date_add' => $product->date_add,
                'date_upd' => $product->date_upd
            ];
            
            $result[] = $productInfo;
            
            // Récupérer les attributs (combinaisons) du produit
            $attributes = $product->getAttributeCombinations($id_lang);
            if (!empty($attributes)) {
                foreach ($attributes as $attribute) {
                    $id_product_attribute = $attribute['id_product_attribute'];
                    
                    // Éviter les doublons si plusieurs attributs pour la même combinaison
                    if (!isset($processedAttributes[$id_product_attribute])) {
                        $attributeName = $product->name;
                        
                        // Construire le nom de l'attribut en ajoutant les valeurs des attributs
                        $attributeValues = [];
                        foreach ($attributes as $attr) {
                            if ($attr['id_product_attribute'] == $id_product_attribute) {
                                $attributeValues[] = $attr['group_name'] . ': ' . $attr['attribute_name'];
                            }
                        }
                        
                        if (!empty($attributeValues)) {
                            $declinaisons = '(' . implode(', ', $attributeValues) . ')';
                            $attributeName .= ' ' . $declinaisons;
                        }
                        
                        // Récupérer le prix et le stock pour cette combinaison
                        $combinationPrice = $product->getPrice(true, $id_product_attribute);
                        $combinationStock = StockAvailable::getQuantityAvailableByProduct($product->id, $id_product_attribute);
                        
                        $result[] = [
                            'id' => $product->id,
                            'parent_id' => $product->id,
                            'id_product_attribute' => $id_product_attribute,
                            'name' => $attributeName,
                            'reference' => $attribute['reference'] ? $attribute['reference'] : $product->reference . '-' . $id_product_attribute,
                            'price' => $combinationPrice,
                            'quantity' => $combinationStock,
                            'declinaisons' => isset($declinaisons) ? $declinaisons : '',
                            'is_attribute' => true,
                            'active' => (bool)$product->active
                        ];
                        
                        // Marquer cet attribut comme traité
                        $processedAttributes[$id_product_attribute] = true;
                    }
                }
            }
        }
        
        // Journaliser le succès de l'action
        $phsy->logActivity('api', 'success', 'Liste des produits récupérée avec succès', [
            'action' => 'get_products',
            'product_count' => count($result)
        ]);
        
        return ['products' => $result];
    } catch (Exception $e) {
        // Journaliser l'erreur
        $phsy->logActivity('api', 'error', 'Erreur lors de la récupération des produits', [
            'action' => 'get_products',
            'error' => $e->getMessage()
        ]);
        
        return ['error' => 'Erreur lors de la récupération des produits: ' . $e->getMessage()];
    }
}

/**
 * Récupération optimisée de tous les attributs de produits
 * 
 * Cette fonction utilise une requête SQL optimisée pour récupérer efficacement
 * tous les attributs de produits en une seule opération.
 *
 * @return array
 */
function getProductAttributes() {
    global $phsy;
    $context = Context::getContext();
    $id_lang = $context->language->id;
    
    // Journaliser le début de l'action
    $phsy->logActivity('api', 'info', 'Récupération optimisée des attributs de produits', [
        'action' => 'get_attributes',
        'language_id' => $id_lang
    ]);
    
    try {
        $db = Db::getInstance();
        
        // Requête SQL optimisée pour récupérer tous les attributs
        $sql = "
            SELECT 
                pa.id_product,
                pa.id_product_attribute,
                pa.reference,
                p.date_add,
                p.date_upd,
                pa.price as specific_price,
                pl.name as product_name,
                COALESCE(sa.quantity, 0) as quantity,
                p.active,
                GROUP_CONCAT(CONCAT(agl.name, ': ', al.name) SEPARATOR ', ') as declinaisons
            FROM " . _DB_PREFIX_ . "product_attribute pa
            JOIN " . _DB_PREFIX_ . "product p ON p.id_product = pa.id_product
            JOIN " . _DB_PREFIX_ . "product_lang pl ON pl.id_product = pa.id_product AND pl.id_lang = " . (int)$id_lang . "
            JOIN " . _DB_PREFIX_ . "product_attribute_combination pac ON pac.id_product_attribute = pa.id_product_attribute
            JOIN " . _DB_PREFIX_ . "attribute a ON a.id_attribute = pac.id_attribute
            JOIN " . _DB_PREFIX_ . "attribute_lang al ON al.id_attribute = a.id_attribute AND al.id_lang = " . (int)$id_lang . "
            JOIN " . _DB_PREFIX_ . "attribute_group ag ON ag.id_attribute_group = a.id_attribute_group
            JOIN " . _DB_PREFIX_ . "attribute_group_lang agl ON agl.id_attribute_group = ag.id_attribute_group AND agl.id_lang = " . (int)$id_lang . "
            LEFT JOIN " . _DB_PREFIX_ . "stock_available sa ON sa.id_product = pa.id_product AND sa.id_product_attribute = pa.id_product_attribute
            GROUP BY pa.id_product_attribute
            ORDER BY pa.id_product, pa.id_product_attribute";
        
        $attributes = $db->executeS($sql);
        
        $result = [];
        foreach ($attributes as $attr) {
            // Calculer le prix complet du produit avec ses attributs
            $product = new Product((int)$attr['id_product'], false, (int)$id_lang);
            $price = $product->getPrice(true, (int)$attr['id_product_attribute']);
            
            $result[] = [
                'id' => (int)$attr['id_product'],
                'parent_id' => (int)$attr['id_product'],
                'id_product_attribute' => (int)$attr['id_product_attribute'],
                'name' => $attr['product_name'] . ' (' . $attr['declinaisons'] . ')',
                'reference' => $attr['reference'] ? $attr['reference'] : $product->reference . '-' . $attr['id_product_attribute'],
                'price' => (string)$price,
                'quantity' => (int)$attr['quantity'],
                'declinaisons' => '(' . $attr['declinaisons'] . ')',
                'is_attribute' => true,
                'active' => (bool)$attr['active'],
                'date_add' => $attr['date_add'],
                'date_upd' => $attr['date_upd']
            ];
        }
        
        // Journaliser le succès de l'action
        $phsy->logActivity('api', 'success', 'Attributs de produits récupérés avec succès', [
            'action' => 'get_attributes',
            'attribute_count' => count($result)
        ]);
        
        return ['attributes' => $result];
    } catch (Exception $e) {
        // Journaliser l'erreur
        $phsy->logActivity('api', 'error', 'Erreur lors de la récupération des attributs', [
            'action' => 'get_attributes',
            'error' => $e->getMessage()
        ]);
        
        return ['error' => 'Erreur lors de la récupération des attributs: ' . $e->getMessage()];
    }
}

/**
 * Récupération d'un produit spécifique
 *
 * @param int $id_product
 * @return array
 */
function getProduct($id_product) {
    global $phsy;
    $context = Context::getContext();
    $id_lang = $context->language->id;
    
    // Journaliser le début de l'action
    $phsy->logActivity('api', 'info', 'Récupération des données d\'un produit', [
        'action' => 'get_product',
        'product_id' => $id_product
    ]);
    
    try {
        $product = new Product($id_product, true, $id_lang);
        
        if (!Validate::isLoadedObject($product)) {
            // Journaliser l'erreur
            $phsy->logActivity('api', 'warning', 'Produit non trouvé', [
                'action' => 'get_product',
                'product_id' => $id_product
            ]);
            
            return ['error' => 'Produit non trouvé.'];
        }
        
        $result = [
            'id' => $product->id,
            'name' => $product->name,
            'reference' => $product->reference,
            'price' => $product->getPrice(),
            'quantity' => StockAvailable::getQuantityAvailableByProduct($product->id),
            'description' => $product->description,
            'description_short' => $product->description_short,
            'active' => (bool)$product->active,
            'date_add' => $product->date_add,
            'date_upd' => $product->date_upd
        ];
        
        // Journaliser le succès de l'action
        $phsy->logActivity('api', 'success', 'Données du produit récupérées avec succès', [
            'action' => 'get_product',
            'product_id' => $id_product,
            'product_name' => $product->name
        ]);
        
        return ['product' => $result];
    } catch (Exception $e) {
        // Journaliser l'erreur
        $phsy->logActivity('api', 'error', 'Erreur lors de la récupération du produit', [
            'action' => 'get_product',
            'product_id' => $id_product,
            'error' => $e->getMessage()
        ]);
        
        return ['error' => 'Erreur lors de la récupération du produit: ' . $e->getMessage()];
    }
}

/**
 * Mise à jour du stock d'un produit
 *
 * @param int $id_product
 * @param int $quantity
 * @return array
 */
function updateProductStock($id_product, $quantity) {
    global $phsy;
    
    // Journaliser le début de l'action
    $phsy->logActivity('api', 'info', 'Mise à jour du stock d\'un produit', [
        'action' => 'update_stock',
        'product_id' => $id_product,
        'requested_quantity' => $quantity
    ]);
    
    try {
        $product = new Product($id_product);
        
        if (!Validate::isLoadedObject($product)) {
            // Journaliser l'erreur
            $phsy->logActivity('api', 'warning', 'Produit non trouvé pour mise à jour du stock', [
                'action' => 'update_stock',
                'product_id' => $id_product
            ]);
            
            return ['error' => 'Produit non trouvé.'];
        }
        
        $id_product_attribute = 0; // Produit sans déclinaison
        $shop = Context::getContext()->shop;
        
        // Récupérer la quantité actuelle avant la mise à jour
        $currentQuantity = StockAvailable::getQuantityAvailableByProduct($id_product);
        
        // Mise à jour du stock
        StockAvailable::setQuantity($id_product, $id_product_attribute, $quantity, $shop->id);
        
        // Journalisation de l'action
        $phsy->logActivity('stock', 'success', 'Stock du produit mis à jour avec succès', [
            'action' => 'update_stock',
            'product_id' => $id_product,
            'product_name' => $product->name,
            'previous_quantity' => $currentQuantity,
            'new_quantity' => $quantity,
            'difference' => $quantity - $currentQuantity
        ]);
        
        // Journalisation standard de PrestaShop
        PrestaShopLogger::addLog('Stock updated by PHSy - Product ID: ' . $id_product . ', New Quantity: ' . $quantity, 1);
        
        return [
            'success' => true,
            'message' => 'Stock mis à jour avec succès.',
            'product_id' => $id_product,
            'previous_quantity' => $currentQuantity,
            'new_quantity' => $quantity
        ];
    } catch (Exception $e) {
        // Journaliser l'erreur
        $phsy->logActivity('api', 'error', 'Erreur lors de la mise à jour du stock', [
            'action' => 'update_stock',
            'product_id' => $id_product,
            'requested_quantity' => $quantity,
            'error' => $e->getMessage()
        ]);
        
        return ['error' => 'Erreur lors de la mise à jour du stock: ' . $e->getMessage()];
    }
}

/**
 * Récupération des statistiques générales de la boutique
 *
 * @return array
 */
function getShopStats() {
    global $phsy;
    
    // Journaliser le début de l'action
    $phsy->logActivity('api', 'info', 'Récupération des statistiques générales', [
        'action' => 'stats'
    ]);
    
    try {
        $db = Db::getInstance();
        
        // Nombre total de clients
        $totalCustomers = Customer::getCustomers(true);
        $totalCustomersCount = count($totalCustomers);
        
        // Nombre total de commandes
        $orderCountQuery = 'SELECT COUNT(*) FROM `'._DB_PREFIX_.'orders` WHERE `valid` = 1';
        $totalOrders = (int)$db->getValue($orderCountQuery);
        
        // Chiffre d'affaires total (commandes validées)
        $revenueQuery = 'SELECT SUM(total_paid_tax_incl) FROM `'._DB_PREFIX_.'orders` WHERE `valid` = 1';
        $totalRevenue = $db->getValue($revenueQuery);
        if (!$totalRevenue) {
            $totalRevenue = "0";
        }
        
        // Nombre total de produits (actifs et inactifs)
        $productCountQuery = 'SELECT COUNT(*) FROM `'._DB_PREFIX_.'product`';
        $totalProducts = (int)$db->getValue($productCountQuery);
        
        // Nombre total de catégories
        $categoryCountQuery = 'SELECT COUNT(*) FROM `'._DB_PREFIX_.'category` WHERE `active` = 1';
        $totalCategories = (int)$db->getValue($categoryCountQuery);
        
        $stats = [
            'total_customers' => $totalCustomersCount,
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'total_products' => $totalProducts,
            'total_categories' => $totalCategories
        ];
        
        // Journaliser le succès de l'action
        $phsy->logActivity('api', 'success', 'Statistiques générales récupérées avec succès', [
            'action' => 'stats'
        ]);
        
        return ['stats' => $stats];
    } catch (Exception $e) {
        // Journaliser l'erreur
        $phsy->logActivity('api', 'error', 'Erreur lors de la récupération des statistiques', [
            'action' => 'stats',
            'error' => $e->getMessage()
        ]);
        
        return ['error' => 'Erreur lors de la récupération des statistiques: ' . $e->getMessage()];
    }
}

/**
 * Récupération de l'historique des prix d'un produit
 *
 * @param int $id_product
 * @return array
 */
function getProductPriceHistory($id_product) {
    global $phsy;
    $context = Context::getContext();
    $id_lang = $context->language->id;
    
    // Journaliser le début de l'action
    $phsy->logActivity('api', 'info', 'Récupération de l\'historique des prix d\'un produit', [
        'action' => 'price_history',
        'product_id' => $id_product
    ]);
    
    try {
        $product = new Product($id_product, true, $id_lang);
        
        if (!Validate::isLoadedObject($product)) {
            // Journaliser l'erreur
            $phsy->logActivity('api', 'warning', 'Produit non trouvé pour l\'historique des prix', [
                'action' => 'price_history',
                'product_id' => $id_product
            ]);
            
            return ['error' => 'Produit non trouvé.'];
        }
        
        $db = Db::getInstance();
        
        // Informations du produit
        $productInfo = [
            'id' => $product->id,
            'name' => $product->name,
            'reference' => $product->reference,
            'current_price' => $product->getPrice(),
            'date_add' => $product->date_add,
            'date_upd' => $product->date_upd
        ];
        
        // Prix spécifiques
        $specificPricesQuery = '
            SELECT sp.*, s.name as shop_name, cu.iso_code as currency_code, 
                   c.name as customer_name, g.name as group_name
            FROM `'._DB_PREFIX_.'specific_price` sp
            LEFT JOIN `'._DB_PREFIX_.'shop` s ON s.id_shop = sp.id_shop
            LEFT JOIN `'._DB_PREFIX_.'currency` cu ON cu.id_currency = sp.id_currency
            LEFT JOIN `'._DB_PREFIX_.'customer` c ON c.id_customer = sp.id_customer
            LEFT JOIN `'._DB_PREFIX_.'group_lang` g ON g.id_group = sp.id_group AND g.id_lang = '.(int)$id_lang.'
            WHERE sp.id_product = '.(int)$id_product.'
            ORDER BY sp.date_add DESC';
        
        $specificPrices = $db->executeS($specificPricesQuery);
        
        $formattedSpecificPrices = [];
        foreach ($specificPrices as $sp) {
            $originalPrice = $product->getPrice(false);
            $price = $sp['price'] >= 0 ? $sp['price'] : $originalPrice;
            
            if ($sp['reduction_type'] == 'percentage') {
                $reduction = $sp['reduction'] * 100; // Convertir en pourcentage
                $price = $originalPrice * (1 - $sp['reduction']);
            } else {
                $reduction = $sp['reduction'];
                $price = $originalPrice - $sp['reduction'];
            }
            
            $formattedSpecificPrices[] = [
                'price' => $price,
                'original_price' => $originalPrice,
                'reduction' => $reduction,
                'reduction_type' => $sp['reduction_type'],
                'from_quantity' => $sp['from_quantity'],
                'from' => $sp['from'] != '0000-00-00 00:00:00' ? $sp['from'] : null,
                'to' => $sp['to'] != '0000-00-00 00:00:00' ? $sp['to'] : null,
                'date_added' => $sp['date_add']
            ];
        }
        
        // Prix dans les commandes
        $orderPricesQuery = '
            SELECT od.product_price, o.date_add
            FROM `'._DB_PREFIX_.'order_detail` od
            JOIN `'._DB_PREFIX_.'orders` o ON o.id_order = od.id_order
            WHERE od.product_id = '.(int)$id_product.' AND o.valid = 1
            ORDER BY o.date_add DESC
            LIMIT 50';
        
        $orderPrices = $db->executeS($orderPricesQuery);
        
        $formattedOrderPrices = [];
        foreach ($orderPrices as $op) {
            $formattedOrderPrices[] = [
                'price' => $op['product_price'],
                'date' => $op['date_add']
            ];
        }
        
        // Historique des changements de prix (simulation)
        $formattedPriceChanges = [];
        $previousPrice = null;
        foreach (array_merge($formattedOrderPrices, $formattedSpecificPrices) as $index => $priceRecord) {
            if ($previousPrice !== null && $previousPrice != $priceRecord['price']) {
                $change = $priceRecord['price'] - $previousPrice;
                $percentChange = $previousPrice > 0 ? ($change / $previousPrice) * 100 : 0;
                
                $formattedPriceChanges[] = [
                    'old_price' => $previousPrice,
                    'new_price' => $priceRecord['price'],
                    'change' => $change,
                    'percent_change' => $percentChange,
                    'date' => isset($priceRecord['date']) ? $priceRecord['date'] : (isset($priceRecord['date_added']) ? $priceRecord['date_added'] : date('Y-m-d H:i:s')),
                    'type' => isset($priceRecord['date']) ? 'order' : 'specific_price'
                ];
            }
            $previousPrice = $priceRecord['price'];
        }
        
        $history = [
            'current' => [
                'price' => $productInfo['current_price'],
                'date' => date('Y-m-d H:i:s')
            ],
            'specific_prices' => $formattedSpecificPrices,
            'order_prices' => $formattedOrderPrices,
            'price_changes' => $formattedPriceChanges
        ];
        
        // Journaliser le succès de l'action
        $phsy->logActivity('api', 'success', 'Historique des prix récupéré avec succès', [
            'action' => 'price_history',
            'product_id' => $id_product,
            'product_name' => $product->name
        ]);
        
        return [
            'product' => $productInfo,
            'history' => $history
        ];
    } catch (Exception $e) {
        // Journaliser l'erreur
        $phsy->logActivity('api', 'error', 'Erreur lors de la récupération de l\'historique des prix', [
            'action' => 'price_history',
            'product_id' => $id_product,
            'error' => $e->getMessage()
        ]);
        
        return ['error' => 'Erreur lors de la récupération de l\'historique des prix: ' . $e->getMessage()];
    }
}