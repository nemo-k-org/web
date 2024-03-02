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

    function updateFirmware($jobId, $firmwareTempFilename) {
        $this->logger->debug('updateFirmware', [$jobId, $firmwareTempFilename]);

        if (!is_dir(FIRMWARE_PATH)) {
            if (!mkdir(FIRMWARE_PATH, 0700)) {
                $this->logger->error("Firmware path does not exist and I was unable to create it", [FIRMWARE_PATH]);
                unlink($firmwareTempFilename);
                return [$jobId, Utils\Http::STATUS_CODE_ERROR_INTERNAL_SERVER_ERROR];
            }
        }
        $firmwareFile = new Utils\FirmwareFile($firmwareTempFilename);
        if (!$firmwareFile->isValidFirmwareZip()) {
            $this->logger->warning("Job ID was updated with failing firmware file", [$jobId, $firmwareFile->errorMessage]);
            unlink($firmwareTempFilename);
            return [$jobId, Utils\Http::STATUS_CODE_ERROR_FAILED_FILE_UPLOAD];
        }

        $firmwareFinalFilename = FIRMWARE_PATH.'/'.$jobId;
        if (is_file($firmwareFinalFilename)) {
            if (!unlink($firmwareFinalFilename)) {
                $this->logger->error("Could not unlink already existing firmware file", [$jobId, $firmwareFinalFilename]);
                unlink($firmwareTempFilename);
                return [$jobId, Utils\Http::STATUS_CODE_ERROR_INTERNAL_SERVER_ERROR];
            }
        }

        if (!$firmwareFile->unzipFirmwareTo($firmwareFinalFilename)) {
            $this->logger->error("Could not extract firmware", [$jobId, $firmwareFile->errorMessage]);
            unlink($firmwareTempFilename);
            return [$jobId, Utils\Http::STATUS_CODE_ERROR_INTERNAL_SERVER_ERROR];
        }

        return [$jobId, Utils\Http::STATUS_CODE_OK];
    }
}
?>
