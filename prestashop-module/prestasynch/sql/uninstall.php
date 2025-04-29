<?php
/**
 * SQL uninstallation script for PHSy module
 *
 * @author    PHSy Team
 * @copyright 2024 PHSy
 * @license   http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 */

$sql = array();

// Drop the synchronization history table
$sql[] = 'DROP TABLE IF EXISTS `' . _DB_PREFIX_ . 'prestasynch_history`';

// Execute all SQL queries
foreach ($sql as $query) {
    if (Db::getInstance()->execute($query) == false) {
        return false;
    }
}