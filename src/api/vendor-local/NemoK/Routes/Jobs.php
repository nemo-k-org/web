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
        $this->inputValidator = new Utils\InputValidator();
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
        $customerIdSafe = $this->inputValidator->validateNumeric($customerId, 'customerId');

        $allJobs = $this->jobs->getOwnedBy($customerIdSafe);

        if (is_null($allJobs)) {
            return [null, Utils\Http::STATUS_CODE_ERROR_INTERNAL_SERVER_ERROR];
        }

        return [$allJobs, Utils\Http::STATUS_CODE_OK];
    }

    function getStatus($customerId, $jobId) {
        $customerIdSafe = $this->inputValidator->validateNumeric($customerId, 'customerId');
        $jobIdSafe = $this->inputValidator->validateUuid($jobId, 'jobId');

        $customerOwnsJob = $this->customerOwnsJob($customerIdSafe, $jobIdSafe);

        if (is_null($customerOwnsJob)) {
            $this->logger->debug('Given jobId does not exist', [$jobIdSafe]);
            return [null, Utils\Http::STATUS_CODE_NOT_FOUND];
        }

        if (! $customerOwnsJob) {
            $this->logger->debug('Authorised customerId and customerId of the given job do not match', [$customerIdSafe, $jobIdSafe]);
            return [null, Utils\Http::STATUS_CODE_UNAUTHORIZED];
        }

        $jobStatus = $this->jobStatus->get($jobIdSafe);

        if (is_null($jobStatus)) {
            $this->logger->error("Could not get job status", [$jobIdSafe, $customerIdSafe]);
            return [null, Utils\Http::STATUS_CODE_ERROR];
        }

        return [$jobStatus, Utils\Http::STATUS_CODE_OK];
    }

    private function submitJobToCI($jobId) {
        $jobIdSafe = $this->inputValidator->validateUuid($jobId, 'jobId');

        $jobData = $this->jobs->get($jobIdSafe);

        if (is_null($jobData)) {
            return false;
        }

        $jobParameters = $jobData['parameters'];
        $jobParameters['NEMOK_UPLOAD_URL'] = $this->getFirmwareUploadURL($jobIdSafe);
        $jobParameters['NEMOK_ZIP_PASSWORD'] = NEMOK_ZIP_PASSWORD;

        $this->logger->debug('submitting job to CI', [$jobIdSafe, $jobParameters]);

        $codeBuild = new Utils\AWS\CodeBuild(AWS_CODEBUILD);

        try {
            $response = $codeBuild->submitBuild($jobIdSafe, $jobParameters);
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
        $jobIdSafe = $this->inputValidator->validateUuid($jobId, 'jobId');

        $this->logger->debug('updateFirmware', [$jobIdSafe, $firmwareTempFilename]);

        $status = $this->firmwares->add($jobIdSafe, $firmwareTempFilename);

        if ($status === Utils\Http::STATUS_CODE_OK) {
            $this->jobStatus->add($jobIdSafe, 'received');
        }

        return [$jobIdSafe, $status];
    }

    function getFirmware($customerId, $jobId) {
        $customerIdSafe = $this->inputValidator->validateNumeric($customerId);
        $jobIdSafe = $this->inputValidator->validateUuid($jobId);

        $customerOwnsJob = $this->customerOwnsJob($customerIdSafe, $jobIdSafe);

        if (is_null($customerOwnsJob)) {
            $this->logger->debug('Given jobId does not exist', [$jobIdSafe]);
            return [null, Utils\Http::STATUS_CODE_NOT_FOUND];
        }

        if (! $customerOwnsJob) {
            $this->logger->debug('Authorised customerId and customerId of the given job do not match', [$customerIdSafe, $jobIdSafe]);
            return [null, Utils\Http::STATUS_CODE_UNAUTHORIZED];
        }

        $firmwareStream = $this->firmwares->get($jobIdSafe);

        if (is_null($firmwareStream)) {
            return [null, Utils\Http::STATUS_CODE_ERROR_FIRMWARE_FILE_MISSING];
        }

        return [$firmwareStream, Utils\Http::STATUS_CODE_OK];
    }
}
?>
