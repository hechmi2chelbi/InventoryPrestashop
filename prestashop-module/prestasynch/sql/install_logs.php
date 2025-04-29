<?php
/**
 * Installation des tables pour le système de journalisation du module PHSy
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

$sql = array();

$sql[] = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'prestasynch_logs` (
    `id_log` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(50) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `message` TEXT NOT NULL,
    `details` TEXT NULL,
    `date_add` DATETIME NOT NULL,
    PRIMARY KEY (`id_log`),
    INDEX `idx_type` (`type`),
    INDEX `idx_status` (`status`),
    INDEX `idx_date_add` (`date_add`)
) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8;';

return $sql;