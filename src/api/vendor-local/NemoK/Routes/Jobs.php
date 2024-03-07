<?php

namespace NemoK;

use Doctrine\DBAL\DriverManager;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

class Jobs {
    private $dbal;
    private $jobStatus;
    private $jobs;

    function __construct() {
        $this->dbal = $db = DriverManager::getConnection(DB_API);
        $this->logger = $logger = new Logger("Jobs");
        $this->logger->pushHandler(new StreamHandler(LOG_FILE, LOG_LEVEL));

        $this->jobStatus = new Data\JobStatus();
        $this->jobs = new Utils\Data\Jobs();
    }

    function add($customerId, $jobParameters, $userAgent, $remoteAddress) {
        $uuidGenerator = new Utils\Uuid();
        $jobId = $uuidGenerator->getUuidV4();

        if (is_null($jobParameters) or !is_array($jobParameters) or $jobParameters == []) {
            $this->logger->error("Trying to add job with empty job parameters", [$_SERVER, $jobParameters, gettype($jobParameters)]);
            return [null, Utils\Http::STATUS_CODE_ERROR_MISSING_PARAMETERS];
        }

        if (!$this->jobs->add($jobId, $jobParameters, $customerId, $userAgent, $remoteAddress)) {
            return [null, Utils\Http::STATUS_CODE_ERROR];
        }

        $this->jobStatus->add($jobId, 'created');
        
        if (!$this->submitJobToCI($jobId)) {
            $this->logger->error("Could not submit job to CI", [$jobId]);
            return [null, Utils\Http::STATUS_CODE_ERROR];
        }

        $this->jobStatus->add($jobId, 'submitted');

        return [$jobId, Utils\Http::STATUS_CODE_OK];
    }

    private function submitJobToCI($jobId) {
        $jobData = $this->jobs->get($jobId);

        if (is_null($jobData)) {
            return false;
        }

        $jobParameters = $jobData['parameters'];
        $jobParameters['NEMOK_UPLOAD_URL'] = $this->getFirmwareUploadURL($jobId);

        $this->logger->debug('submitting job to CI', [$jobId, $jobParameters]);

        $codeBuild = new Utils\AWS\CodeBuild(AWS_CODEBUILD);

        try {
            $response = $codeBuild->submitBuild($jobId, $jobParameters);
        } catch (\Exception $e) {
            $this->logger->error('Failed to submit CodeBuild job', [$e]);
            return false;
        }

        $this->logger->debug('Codebuild job submitted');

        return true;
    }

    private function getFirmwareUploadURL($jobId) {
        return ROOT_URL.'/api/jobs/'.$jobId.'/firmware';
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

        $this->jobStatus->add($jobId, 'submitted');

        return [$jobId, Utils\Http::STATUS_CODE_OK];
    }
}
?>
