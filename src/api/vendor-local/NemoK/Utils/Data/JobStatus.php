<?php

namespace NemoK\Data;

use Doctrine\DBAL\DriverManager;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

class JobStatus {
    const STATUS_VALUES = ['created', 'submitted', 'received'];
    // 'created' - job has been created by the UI
    // 'submitted' - job has been submitted to CI
    // 'received' - firmware has been successfully received from CI

    private $dbal;
    private $logger;

    function __construct() {
        $this->dbal = $db = DriverManager::getConnection(DB_API);
        $this->logger = $logger = new Logger("Data-JobStatus");
        $this->logger->pushHandler(new StreamHandler(LOG_FILE, LOG_LEVEL));
    }

    function add($jobId, $status) {
        if (is_null($jobId) or $jobId == '') {
            return false;
        }

        if (!in_array($status, self::STATUS_VALUES)) {
            $this->logger->error('Tried to add unknown status', [$jobId, $status]);
            return false;
        }

        $sql = 'INSERT INTO `status` SET `jobId`=?, `jobStatus`=?;';

        try {
            $stmt = $this->dbal->prepare($sql);
            $stmt->bindValue(1, $jobId);
            $stmt->bindValue(2, $status);
            $count = $stmt->executeStatement();
        } catch (\Exception $e) {
            $this->logger->error('Database error', [$sql, $e]);
            return false;
        }

        if ($count != 1) {
            $this->logger->error('Wrote one record to database but something went wrong', [$sql, $jobId, $status, $count]);
            return false;
        }

        return true;
    }

    function get($jobId) {
        if (is_null($jobId) or $jobId == '') {
            return null;
        }

        $sql = 'SELECT `jobStatus` FROM `status` WHERE jobId=? ORDER BY updated DESC LIMIT 1;';
        try {
            $stmt = $this->dbal->prepare($sql);
            $stmt->bindValue(1, $jobId);

            $result = $stmt->executeQuery();
        } catch (\Exception $e) {
            $this->logger->error('Database error', [$sql, $e]);
            return null;
        }

        if ($result->rowCount() < 1) {
            $this->logger->debug('get() did not find any job details', [$jobId]);
            return null;
        }

        $status = $result->fetchAssociative();
        return $status['jobStatus'];
    }
}

?>
