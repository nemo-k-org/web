<?php

namespace NemoK;

use Doctrine\DBAL\DriverManager;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

class Jobs {
    private $dbal;
    private $jobStatus;
    private $jobs;
    private $firmwares;

    function __construct() {
        $this->dbal = $db = DriverManager::getConnection(DB_API);
        $this->logger = $logger = new Logger("Jobs");
        $this->logger->pushHandler(new StreamHandler(LOG_FILE, LOG_LEVEL));

        $this->jobStatus = new Data\JobStatus();
        $this->jobs = new Utils\Data\Jobs();
        $this->firmwares = new Utils\Data\Firmwares();
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

        $this->logger->debug('Codebuild job submitted', [$response]);

        return true;
    }

    private function getFirmwareUploadURL($jobId) {
        return ROOT_URL.'/api/jobs/'.$jobId.'/firmware';
    }

    function updateFirmware($jobId, $firmwareTempFilename) {
        $this->logger->debug('updateFirmware', [$jobId, $firmwareTempFilename]);

        $status = $this->firmwares->add($jobId, $firmwareTempFilename);

        if ($status === Utils\Http::STATUS_CODE_OK) {
            $this->jobStatus->add($jobId, 'received');
        }

        return [$jobId, $status];
    }
}
?>
