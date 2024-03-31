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

    private function customerOwnsJob($customerId, $jobId) {
        $jobData = $this->jobs->get($jobId);

        if (is_null($jobData)) {
            return null;
        }

        return ($jobData['customerId'] === $customerId);
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

    function getAllJobsOwnedBy($customerId) {
        $allJobs = $this->jobs->getOwnedBy($customerId);

        if (is_null($allJobs)) {
            return [null, Utils\Http::STATUS_CODE_ERROR_INTERNAL_SERVER_ERROR];
        }

        return [$allJobs, Utils\Http::STATUS_CODE_OK];
    }

    function getStatus($customerId, $jobId) {
        $customerOwnsJob = $this->customerOwnsJob($customerId, $jobId);

        if (is_null($customerOwnsJob)) {
            $this->logger->debug('Given jobId does not exist', [$jobId]);
            return [null, Utils\Http::STATUS_CODE_NOT_FOUND];
        }

        if (! $customerOwnsJob) {
            $this->logger->debug('Authorised customerId and customerId of the given job do not match', [$customerId, $jobId]);
            return [null, Utils\Http::STATUS_CODE_UNAUTHORIZED];
        }

        $jobStatus = $this->jobStatus->get($jobId);

        if (is_null($jobStatus)) {
            $this->logger->error("Could not get job status", [$jobId, $customerId]);
            return [null, Utils\Http::STATUS_CODE_ERROR];
        }

        return [$jobStatus, Utils\Http::STATUS_CODE_OK];
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

    function getFirmware($customerId, $jobId) {
        $customerOwnsJob = $this->customerOwnsJob($customerId, $jobId);

        if (is_null($customerOwnsJob)) {
            $this->logger->debug('Given jobId does not exist', [$jobId]);
            return [null, Utils\Http::STATUS_CODE_NOT_FOUND];
        }

        if (! $customerOwnsJob) {
            $this->logger->debug('Authorised customerId and customerId of the given job do not match', [$customerId, $jobId]);
            return [null, Utils\Http::STATUS_CODE_UNAUTHORIZED];
        }

        $firmwareStream = $this->firmwares->get($jobId);

        if (is_null($firmwareStream)) {
            return [null, Utils\Http::STATUS_CODE_ERROR_FIRMWARE_FILE_MISSING];
        }

        return [$firmwareStream, Utils\Http::STATUS_CODE_OK];
    }
}
?>
