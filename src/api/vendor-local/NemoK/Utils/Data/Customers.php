<?php

namespace NemoK\Utils\Data;

use Doctrine\DBAL\DriverManager;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

class Customers {
    private $dbal;
    private $logger;

    function __construct() {
        $this->dbal = $db = DriverManager::getConnection(DB_API);
        $this->logger = $logger = new Logger("Data-Customers");
        $this->logger->pushHandler(new StreamHandler(LOG_FILE, LOG_LEVEL));
    }

    function getCustomerId($customerCode) {
        $sql = 'SELECT `customerId` FROM `customers` WHERE `customerCode`=?;';
        try {
            $stmt = $this->dbal->prepare($sql);
            $stmt->bindValue(1, $customerCode);

            $result = $stmt->executeQuery();
        } catch (\Exception $e) {
            $this->logger->error('Database error', [$sql, $e]);
        }

        if ($result->rowCount() < 1) {
            $this->logger->debug('isCustomer did not find customers', [$customerCode]);
            return null;
        }

        if ($result->rowCount() > 1) {
            $this->logger->warning('isCustomer found more than one customer, using only the first', [$customerCode]);
        }

        $customer = $result->fetchAssociative();

        return $customer['customerId'];
    }

    function updateLastAction($customerId) {
        $sql = 'UPDATE `customers` SET `lastAction`=NOW() WHERE `customerId`=?;';

        try {
            $stmt = $this->dbal->prepare($sql);
            $stmt->bindValue(1, $customerId);

            $count = $stmt->executeStatement();
        } catch (\Exception $e) {
            $this->logger->error('Database error', [$sql, $e]);
        }

        return $count;
    }
}

?>
