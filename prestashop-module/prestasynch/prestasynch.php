<?php
/**
 * Module PHSy (PrestaSynch)
 *
 * Ce module permet la synchronisation des données entre PrestaShop et la plateforme PHSy
 * 
 * @author    PHSy Team
 * @copyright 2024 PHSy
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

class Prestasynch extends Module
{
    const VERSION = '1.0.0';
    
    // Chemin vers le fichier de logs
    private $logFile;
    
    public function __construct()
    {
        $this->name = 'prestasynch';
        $this->tab = 'administration';
        $this->version = self::VERSION;
        $this->author = 'PHSy Team';
        $this->need_instance = 0;
        $this->ps_versions_compliancy = [
            'min' => '1.6',
            'max' => _PS_VERSION_
        ];
        $this->bootstrap = true;

        parent::__construct();

        $this->displayName = $this->l('PHSy - Gestion avancée des produits et attributs');
        $this->description = $this->l('Synchronisez vos produits, stocks et prix avec la plateforme PHSy pour une gestion optimisée de votre boutique.');
        
        // Initialiser le chemin vers le fichier de logs
        $this->logFile = dirname(__FILE__) . '/logs/phsy.log';
        
        // Créer le dossier de logs s'il n'existe pas
        $logsDir = dirname(__FILE__) . '/logs';
        if (!is_dir($logsDir)) {
            mkdir($logsDir, 0755, true);
        }
    }

    /**
     * Installation du module
     */
    public function install()
    {
        // Vérifier si le module peut être installé
        if (!extension_loaded('curl')) {
            $this->_errors[] = $this->l('L\'extension PHP cURL est requise pour ce module.');
            return false;
        }
        
        // Générer une clé API aléatoire
        $apiKey = $this->generateApiKey();
        
        return parent::install()
            && $this->registerHook('displayBackOfficeHeader')
            && $this->registerHook('actionProductUpdate')
            && $this->registerHook('actionUpdateQuantity')
            && Configuration::updateValue('PRESTASYNCH_API_KEY', $apiKey)
            && Configuration::updateValue('PRESTASYNCH_SYNC_ENABLED', 1)
            && Configuration::updateValue('PRESTASYNCH_SYNC_URL', '')
            && Configuration::updateValue('PRESTASYNCH_SYNC_API_KEY', '');
    }

    /**
     * Désinstallation du module
     */
    public function uninstall()
    {
        return parent::uninstall()
            && Configuration::deleteByName('PRESTASYNCH_API_KEY')
            && Configuration::deleteByName('PRESTASYNCH_SYNC_ENABLED')
            && Configuration::deleteByName('PRESTASYNCH_SYNC_URL')
            && Configuration::deleteByName('PRESTASYNCH_SYNC_API_KEY');
    }

    /**
     * Génère une clé API aléatoire
     */
    private function generateApiKey()
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Configuration du module avec système d'onglets
     */
    public function getContent()
    {
        $output = '';
        $token = Tools::getAdminTokenLite('AdminModules');
        $currentIndex = $this->context->link->getAdminLink('AdminModules', false) . '&configure=' . $this->name;
        
        // Traitement du formulaire principal
        if (Tools::isSubmit('submitprestasynch')) {
            $apiKey = trim(Tools::getValue('PRESTASYNCH_API_KEY'));
            
            // Enregistrer la clé API fournie par l'application PHSy
            Configuration::updateValue('PRESTASYNCH_API_KEY', $apiKey);
            
            $output .= $this->displayConfirmation($this->l('La clé API a été enregistrée avec succès.'));
        }
        
        // Préparer les données pour le template
        $moduleUrl = $this->context->link->getBaseLink() . 'modules/' . $this->name . '/';
        $phsyUrl = Configuration::get('PRESTASYNCH_SYNC_URL');
        $apiKey = Configuration::get('PRESTASYNCH_API_KEY');
        $logs = $this->getLogs(50);
        $lastSync = Configuration::get('PRESTASYNCH_LAST_SYNC');
        $syncStatus = Configuration::get('PRESTASYNCH_SYNC_STATUS', 'disconnected');
        
        // Variables d'environnement
        $psVersion = _PS_VERSION_;
        $phpVersion = phpversion();
        $isDevMode = _PS_MODE_DEV_;
        
        // Assigner les variables au template Smarty
        $this->context->smarty->assign([
            'module_url' => $moduleUrl,
            'phsy_url' => $phsyUrl,
            'api_key' => $apiKey,
            'module_logs' => $logs,
            'last_sync' => $lastSync,
            'sync_status' => $syncStatus,
            'token' => $token,
            'current_index' => $currentIndex,
            'module_name' => $this->name,
            'module_version' => $this->version,
            'install_date' => Configuration::get('PRESTASYNCH_INSTALL_DATE'),
            'update_date' => Configuration::get('PRESTASYNCH_UPDATE_DATE'),
            'ps_version' => $psVersion,
            'php_version' => $phpVersion,
            'is_dev_mode' => $isDevMode
        ]);
        
        // Rendre le template avec les onglets
        return $output . $this->context->smarty->fetch($this->local_path . 'views/templates/admin/configure.tpl');
    }

    /**
     * Affichage du formulaire de configuration
     */
    protected function renderForm()
    {
        $helper = new HelperForm();
        
        $helper->show_toolbar = false;
        $helper->table = $this->table;
        $helper->module = $this;
        $helper->default_form_language = $this->context->language->id;
        $helper->allow_employee_form_lang = Configuration::get('PS_BO_ALLOW_EMPLOYEE_FORM_LANG', 0);
        
        $helper->identifier = $this->identifier;
        $helper->submit_action = 'submit' . $this->name;
        $helper->currentIndex = $this->context->link->getAdminLink('AdminModules', false)
            . '&configure=' . $this->name . '&tab_module=' . $this->tab . '&module_name=' . $this->name;
        $helper->token = Tools::getAdminTokenLite('AdminModules');
        
        // Préparer les champs du formulaire
        $fields_form = [
            'form' => [
                'legend' => [
                    'title' => $this->l('Paramètres'),
                    'icon' => 'icon-cogs'
                ],
                'input' => [
                    [
                        'type' => 'switch',
                        'label' => $this->l('Activer la synchronisation'),
                        'name' => 'PRESTASYNCH_SYNC_ENABLED',
                        'is_bool' => true,
                        'values' => [
                            [
                                'id' => 'active_on',
                                'value' => 1,
                                'label' => $this->l('Oui')
                            ],
                            [
                                'id' => 'active_off',
                                'value' => 0,
                                'label' => $this->l('Non')
                            ]
                        ],
                        'desc' => $this->l('Activer ou désactiver la synchronisation avec la plateforme PHSy.')
                    ],
                    [
                        'type' => 'text',
                        'label' => $this->l('URL de la plateforme PHSy'),
                        'name' => 'PRESTASYNCH_SYNC_URL',
                        'desc' => $this->l('Entrez l\'URL de la plateforme PHSy (ex: https://votre-instance.phsy.com).'),
                        'size' => 64
                    ],
                    [
                        'type' => 'password',
                        'label' => $this->l('Clé API de synchronisation'),
                        'name' => 'PRESTASYNCH_SYNC_API_KEY',
                        'desc' => $this->l('Entrez la clé API fournie par la plateforme PHSy pour authentifier vos requêtes.'),
                        'size' => 64,
                        'autocomplete' => false
                    ],
                    [
                        'type' => 'text',
                        'label' => $this->l('Clé API de ce module'),
                        'name' => 'PRESTASYNCH_API_KEY',
                        'desc' => $this->l('Cette clé est utilisée pour sécuriser les appels API depuis la plateforme PHSy vers votre boutique.'),
                        'size' => 64,
                        'readonly' => true
                    ]
                ],
                'submit' => [
                    'title' => $this->l('Enregistrer'),
                    'class' => 'btn btn-primary'
                ]
            ]
        ];
        
        // Charger les valeurs actuelles
        $helper->fields_value['PRESTASYNCH_SYNC_ENABLED'] = Configuration::get('PRESTASYNCH_SYNC_ENABLED');
        $helper->fields_value['PRESTASYNCH_SYNC_URL'] = Configuration::get('PRESTASYNCH_SYNC_URL');
        
        // Masquer la clé API de synchronisation pour des raisons de sécurité
        $syncApiKey = Configuration::get('PRESTASYNCH_SYNC_API_KEY');
        $helper->fields_value['PRESTASYNCH_SYNC_API_KEY'] = !empty($syncApiKey) ? str_repeat('*', strlen($syncApiKey)) : '';
        
        $helper->fields_value['PRESTASYNCH_API_KEY'] = Configuration::get('PRESTASYNCH_API_KEY');
        
        return $helper->generateForm([$fields_form]);
    }

    /**
     * Rendu du panneau de test (remplacé par le système d'onglets)
     */
    protected function renderTestPanel()
    {
        // Cette fonction est désormais remplacée par le système d'onglets
        // mais est conservée pour la compatibilité
        return '';
    }

    /**
     * Ajoute du contenu au header de l'admin
     */
    public function hookDisplayBackOfficeHeader()
    {
        $this->context->controller->addCSS($this->_path . 'views/css/back.css');
        $this->context->controller->addJS($this->_path . 'views/js/back.js');
    }

    /**
     * Gestion de la mise à jour d'un produit
     */
    public function hookActionProductUpdate($params)
    {
        if (!Configuration::get('PRESTASYNCH_SYNC_ENABLED')) {
            return;
        }
        
        $product = $params['product'];
        
        // Journaliser l'événement
        $this->logActivity('hook', 'info', 'Produit mis à jour', [
            'hook' => 'actionProductUpdate',
            'product_id' => $product->id,
            'product_name' => $product->name
        ]);
        
        // Notifier la plateforme PHSy de la mise à jour (à implémenter dans une version future)
    }

    /**
     * Gestion de la mise à jour des quantités
     */
    public function hookActionUpdateQuantity($params)
    {
        if (!Configuration::get('PRESTASYNCH_SYNC_ENABLED')) {
            return;
        }
        
        $id_product = $params['id_product'];
        $id_product_attribute = $params['id_product_attribute'];
        $quantity = $params['quantity'];
        
        // Récupérer les informations du produit
        $product = new Product($id_product);
        $productName = $product->name;
        
        // Journaliser l'événement
        $this->logActivity('hook', 'info', 'Quantité de produit mise à jour', [
            'hook' => 'actionUpdateQuantity',
            'product_id' => $id_product,
            'product_attribute_id' => $id_product_attribute,
            'product_name' => $productName,
            'quantity' => $quantity
        ]);
        
        // Notifier la plateforme PHSy de la mise à jour (à implémenter dans une version future)
    }

    /**
     * Ajoute une entrée dans le journal d'activité
     * 
     * @param string $category Catégorie du log (api, hook, sync, etc.)
     * @param string $level Niveau du log (info, warning, error, success)
     * @param string $message Message à journaliser
     * @param array $context Données contextuelles supplémentaires
     */
    public function logActivity($category, $level, $message, $context = [])
    {
        // Vérifier si le dossier de logs existe, sinon le créer
        $logsDir = dirname($this->logFile);
        if (!is_dir($logsDir)) {
            mkdir($logsDir, 0755, true);
        }
        
        // Préparer l'entrée de log
        $timestamp = date('Y-m-d H:i:s');
        $contextData = !empty($context) ? ' ' . json_encode($context) : '';
        $logEntry = "[$timestamp] [$category] [$level] $message$contextData" . PHP_EOL;
        
        // Écrire dans le fichier de log
        file_put_contents($this->logFile, $logEntry, FILE_APPEND);
        
        // Limiter la taille du fichier de log (1MB maximum)
        $this->truncateLogFileIfNeeded();
        
        return true;
    }

    /**
     * Tronque le fichier de log s'il dépasse la taille maximale
     */
    private function truncateLogFileIfNeeded()
    {
        $maxSize = 1024 * 1024; // 1MB
        
        if (file_exists($this->logFile) && filesize($this->logFile) > $maxSize) {
            // Lire les dernières lignes du fichier (environ 50% du fichier)
            $fileContent = file_get_contents($this->logFile);
            $halfSize = $maxSize / 2;
            $truncatedContent = substr($fileContent, -$halfSize);
            
            // Trouver la première ligne complète
            $firstNewline = strpos($truncatedContent, PHP_EOL);
            if ($firstNewline !== false) {
                $truncatedContent = substr($truncatedContent, $firstNewline + 1);
            }
            
            // Réécrire le fichier avec le contenu tronqué
            file_put_contents($this->logFile, $truncatedContent);
        }
    }

    /**
     * Récupère les entrées de journal d'activité récentes
     * 
     * @param int $limit Nombre maximum d'entrées à récupérer
     * @return string Contenu du fichier de logs
     */
    public function getLogs($limit = 100)
    {
        if (!file_exists($this->logFile)) {
            return '';
        }
        
        // Lire le fichier de logs
        $logContent = file_get_contents($this->logFile);
        
        // Extraire les dernières lignes si nécessaire
        if ($limit > 0) {
            $lines = explode(PHP_EOL, $logContent);
            $lines = array_filter($lines); // Supprimer les lignes vides
            $lines = array_slice($lines, -$limit); // Prendre les $limit dernières lignes
            $logContent = implode(PHP_EOL, $lines);
        }
        
        return $logContent;
    }

    /**
     * Efface le fichier de logs
     */
    public function clearLogs()
    {
        if (file_exists($this->logFile)) {
            file_put_contents($this->logFile, '');
            return true;
        }
        return false;
    }
}