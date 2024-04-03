<?php

namespace NemoK\Utils\Data;

use Doctrine\DBAL\DriverManager;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

class Jobs {
    private $dbal;
    private $logger;

    function __construct() {
        $this->dbal = $db = DriverManager::getConnection(DB_API);
        $this->logger = $logger = new Logger("Data-Jobs");
        $this->logger->pushHandler(new StreamHandler(LOG_FILE, LOG_LEVEL));

        $this->firmwares = new Firmwares();
    }

    function add($jobId, $parameters, $customerId, $userAgent, $remoteAddress) {
        $parametersJson = json_encode($parameters);

        $userAgents = new UserAgents();
        $userAgentId = $userAgents->getUserAgentId($userAgent);

        $sql = 'INSERT INTO `jobs` SET `jobId`=?, `parameters`=?, `customerId`=?, `userAgentId`=?, `ip`=?';

        try {
            $stmt = $this->dbal->prepare($sql);
            $stmt->bindValue(1, $jobId);
            $stmt->bindValue(2, $parametersJson);
            $stmt->bindValue(3, $customerId);
            $stmt->bindValue(4, $userAgentId);
            $stmt->bindValue(5, $remoteAddress);
    
            $stmt->executeQuery();
        } catch (\Exception $e) {
            $this->logger->error('Database error', [$sql, $e]);
            return false;
        }

        return true;
    }

    function get($jobId) {
        $sql = 'SELECT * FROM `jobs` WHERE `jobId`=?;';
        try {
            $stmt = $this->dbal->prepare($sql);
            $stmt->bindValue(1, $jobId);

            $result = $stmt->executeQuery();
        } catch (\Exception $e) {
            $this->logger->error('Database error', [$sql, $e]);
        }

        if ($result->rowCount() < 1) {
            $this->logger->debug('get() did not find any job details', [$jobId]);
            return null;
        }

        if ($result->rowCount() > 1) {
            $this->logger->warning('get() found more than one job details, using only the first', [$jobId]);
        }

        $job = $result->fetchAssociative();
        $job['parameters'] = json_decode($job['parameters'], true);

        return $job;
    }

    function getOwnedBy($customerId) {
        $sql = 'SELECT
            `jobId`,`parameters`,
            (SELECT jobStatus
                FROM `status`
                WHERE `jobs`.`jobId`=`status`.`jobId`
                ORDER BY `status`.`updated` DESC LIMIT 1
            ) AS `status`,
            (SELECT
                FLOOR(UNIX_TIMESTAMP(NOW())-UNIX_TIMESTAMP(`updated`))
                FROM `status`
                WHERE `jobs`.`jobId`=`status`.`jobId`
                ORDER BY `status`.`updated` DESC LIMIT 1
            ) AS `updatedSecsAgo`
            FROM `jobs` where customerId=?;
        ';
        try {
            $stmt = $this->dbal->prepare($sql);
            $stmt->bindValue(1, $customerId);

            $result = $stmt->executeQuery();
        } catch (\Exception $e) {
            $this->logger->error('Database error', [$sql, $e]);
            return null;
        }

        $data = [];

        while ($row = $result->fetchAssociative()) {
            $row['isFirmware'] = $this->firmwares->exists($row['jobId']);
            array_push($data, $row);
        }

        return $data;
    }
}
