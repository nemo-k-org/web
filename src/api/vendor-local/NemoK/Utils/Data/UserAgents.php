<?php

namespace NemoK\Utils\Data;

use Doctrine\DBAL\DriverManager;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

class UserAgents {
    private $dbal;
    private $logger;

    function __construct() {
        $this->dbal = $db = DriverManager::getConnection(DB_API);
        $this->logger = $logger = new Logger("Data-UserAgents");
        $this->logger->pushHandler(new StreamHandler(LOG_FILE, LOG_LEVEL));
    }

    function getUserAgentId($userAgentString) {
        if (in_array($userAgentString, [null, ""])) {
            return 0;
        }

        $sqlSelect = 'SELECT `userAgentId` FROM `userAgents` WHERE `hash`=SHA2(?,256)';
        try {
            $stmtSelect = $this->dbal->prepare($sqlSelect);
            $stmtSelect->bindValue(1, $userAgentString);

            $resultSelect = $stmtSelect->executeQuery();
        } catch (\Exception $e) {
            $this->logger->error("Database error", [$sqlSelect, $e]);
            return 0;
        }

        if ($resultSelect->rowCount() == 1) {
            return $resultSelect->fetchOne();
        }
      
        if ($resultSelect->rowCount() > 1) {
            $this->logger->warning("User agent query resulted more than one result, returning first result as the user agent id", [$data]);
            return $resultSelect->fetchOne();
        }
      
        $sqlInsert = 'INSERT INTO `userAgents` SET `hash`=SHA2(?,256), `userAgent`=?';
        try {
            $stmtInsert = $this->dbal->prepare($sqlInsert);
            $stmtInsert->bindValue(1, $userAgentString);
            $stmtInsert->bindValue(2, $userAgentString);

            $stmtInsert->executeStatement();
        } catch (\Exception $e) {
            $this->logger->error("Database error", [$sqlInsert, $e]);
            return 0;
        }

        $userAgentId = $this->dbal->lastInsertId();
        if (is_null($userAgentId)) {
            return 0;
        }
      
        return $userAgentId;
    }
}
?>
