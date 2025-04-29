<?php
/**
 * Script d'installation du module PHSy (anciennement PrestaSynch)
 */

// Vérifier que le script n'est pas appelé directement
if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Fonction principale d'installation
 * Cette fonction est appelée par le constructeur du module lors de l'installation
 *
 * @return bool Succès de l'installation
 */
function installPrestaSynch()
{
    // Vérifier les prérequis
    if (!extension_loaded('curl')) {
        return false;
    }
    
    // Créer les tables en base de données si nécessaire
    $sql = [];
    
    // Table pour les logs du module
    $sql[] = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'prestasynch_log` (
        `id_log` int(10) unsigned NOT NULL AUTO_INCREMENT,
        `level` varchar(16) NOT NULL,
        `message` text NOT NULL,
        `data` text,
        `date_add` datetime NOT NULL,
        PRIMARY KEY (`id_log`)
    ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8;';
    
    // Table pour stocker les configurations de synchronisation
    $sql[] = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'prestasynch_sync` (
        `id_sync` int(10) unsigned NOT NULL AUTO_INCREMENT,
        `entity_type` varchar(64) NOT NULL,
        `id_entity` int(10) unsigned NOT NULL,
        `last_sync` datetime NOT NULL,
        `sync_status` varchar(32) NOT NULL DEFAULT "pending",
        `sync_data` text,
        PRIMARY KEY (`id_sync`),
        UNIQUE KEY `entity_unique` (`entity_type`, `id_entity`)
    ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8;';
    
    // Exécuter les requêtes SQL
    foreach ($sql as $query) {
        if (!Db::getInstance()->execute($query)) {
            return false;
        }
    }
    
    // Créer les dossiers nécessaires
    $dirs = [
        _PS_MODULE_DIR_ . 'prestasynch/logs',
        _PS_MODULE_DIR_ . 'prestasynch/exports'
    ];
    
    foreach ($dirs as $dir) {
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            return false;
        }
    }
    
    // Enregistrer la date d'installation
    Configuration::updateValue('PRESTASYNCH_INSTALL_DATE', date('Y-m-d H:i:s'));
    Configuration::updateValue('PRESTASYNCH_UPDATE_DATE', date('Y-m-d H:i:s'));
    
    return true;
}