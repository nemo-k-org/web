<?php

namespace NemoK;

use Doctrine\DBAL\DriverManager;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

use Utils\StatusCodes;

class Jobs {
    private $dbal;

    function __construct() {
        $this->dbal = $db = DriverManager::getConnection(DB_API);
        $this->logger = $logger = new Logger("Jobs");
        $this->logger->pushHandler(new StreamHandler(LOG_FILE, LOG_LEVEL));
    }

    function add($jobParameters, $userAgent, $remoteAddress) {
        $uuidGenerator = new Utils\Uuid();
        $jobId = $uuidGenerator->getUuidV4();

        if (is_null($jobParameters) or !is_array($jobParameters) or $jobParameters == []) {
            $this->logger->error("Trying to add job with empty job parameters", [$_SERVER, $jobParameters, gettype($jobParameters)]);
            return [null, Utils\Http::STATUS_CODE_ERROR_MISSING_PARAMETERS];
        }

        $jobParametersStr = json_encode($jobParameters);

        $userAgents = new \NemoK\Utils\UserAgents();
        $userAgentId = $userAgents->getUserAgentId($userAgent);

        try {
            $sql = 'INSERT INTO `jobs` SET `jobId`=?, `parameters`=?, `userAgentId`=?, `ip`=?';
            $stmt = $this->dbal->prepare($sql);
            $stmt->bindValue(1, $jobId);
            $stmt->bindValue(2, json_encode($jobParameters));
            $stmt->bindValue(3, $userAgentId);
            $stmt->bindValue(4, $remoteAddress);
    
            $stmt->executeQuery();
        } catch (\Exception $e) {
            $this->logger->error("Database error", [$sql, $e]);
            return [null, Utils\Http::STATUS_CODE_ERROR];
        }

        return [$jobId, Utils\Http::STATUS_CODE_OK];
    }
}
?>
