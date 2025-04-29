<?php
/**
 * SQL installation script for PHSy module
 *
 * @author    PHSy Team
 * @copyright 2024 PHSy
 * @license   http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */

$sql = array();

// Table to log synchronization history
$sql[] = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'prestasynch_history` (
    `id_prestasynch_history` int(11) NOT NULL AUTO_INCREMENT,
    `id_product` int(11) NOT NULL,
    `reference` varchar(64) NOT NULL,
    `price` decimal(20,6) NOT NULL,
    `quantity` int(11) NOT NULL,
    `sync_date` datetime NOT NULL,
    PRIMARY KEY  (`id_prestasynch_history`),
    KEY `id_product` (`id_product`)
) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8;';

// Execute all SQL queries
foreach ($sql as $query) {
    if (Db::getInstance()->execute($query) == false) {
        return false;
    }
}