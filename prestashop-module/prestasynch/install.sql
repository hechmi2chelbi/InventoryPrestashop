-- Base de données pour le module PrestaSynch
-- Ce script est exécuté lors de l'installation du module

-- Table pour enregistrer l'historique des synchronisations
CREATE TABLE IF NOT EXISTS `PREFIX_prestasynch_sync_history` (
  `id_sync` int(11) NOT NULL AUTO_INCREMENT,
  `sync_date` datetime NOT NULL,
  `sync_type` varchar(50) NOT NULL,
  `products_count` int(11) NOT NULL DEFAULT 0,
  `status` varchar(50) NOT NULL,
  `message` text,
  PRIMARY KEY (`id_sync`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Table pour enregistrer les journaux d'erreurs
CREATE TABLE IF NOT EXISTS `PREFIX_prestasynch_error_log` (
  `id_log` int(11) NOT NULL AUTO_INCREMENT,
  `log_date` datetime NOT NULL,
  `error_code` varchar(50) NOT NULL,
  `error_message` text NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_log`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Insérer une valeur par défaut pour la clé API
INSERT INTO `PREFIX_configuration` (`name`, `value`, `date_add`, `date_upd`) 
VALUES ('PRESTASYNCH_API_KEY', '', NOW(), NOW())
ON DUPLICATE KEY UPDATE `value`=`value`;

-- Insérer une valeur par défaut pour la fréquence de synchronisation
INSERT INTO `PREFIX_configuration` (`name`, `value`, `date_add`, `date_upd`) 
VALUES ('PRESTASYNCH_SYNC_FREQUENCY', 'realtime', NOW(), NOW())
ON DUPLICATE KEY UPDATE `value`=`value`;

-- Insérer une valeur par défaut pour la dernière synchronisation
INSERT INTO `PREFIX_configuration` (`name`, `value`, `date_add`, `date_upd`) 
VALUES ('PRESTASYNCH_LAST_SYNC', '', NOW(), NOW())
ON DUPLICATE KEY UPDATE `value`=`value`;