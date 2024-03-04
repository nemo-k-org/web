<?php

namespace NemoK\Data;

use Doctrine\DBAL\DriverManager;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

class Jobs {
    private $dbal;

    function __construct() {
        $this->dbal = $db = DriverManager::getConnection(DB_API);
        $this->logger = $logger = new Logger("Data-Jobs");
        $this->logger->pushHandler(new StreamHandler(LOG_FILE, LOG_LEVEL));
    }

    function getJob($jobId) {
        $sql = 'SELECT * FROM `jobs` WHERE `jobId`=?;';
        try {
            $stmt = $this->dbal->prepare($sql);
            $stmt->bindValue(1, $jobId);

            $result = $stmt->executeQuery();
        } catch (\Exception $e) {
            $this->logger->error('Database error', [$sql, $e]);
        }

        if ($result->rowCount() < 1) {
            $this->logger->debug('getJob did not find any job details', [$jobId]);
            return null;
        }

        if ($result->rowCount() > 1) {
            $this->logger->warning('getJob found more than one job details, using only the first', [$jobId]);
        }

        $job = $result->fetchAssociative();
        $job['parameters'] = json_decode($job['parameters'], true);

        return $job;
    }
}
