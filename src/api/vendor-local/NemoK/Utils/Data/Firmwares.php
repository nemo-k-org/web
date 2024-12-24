<?php

namespace NemoK\Utils\Data;

use Doctrine\DBAL\DriverManager;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

use \NemoK\Utils\Http;

class Firmwares {
    const REQUIRED_FILES = ['firmware.bin', 'firmware.bin.sha256'];

    private $dbal;
    private $logger;

    function __construct() {
        $this->dbal = $db = DriverManager::getConnection(DB_API);
        $this->logger = $logger = new Logger("Data-Firmwares");
        $this->logger->pushHandler(new StreamHandler(LOG_FILE, LOG_LEVEL));

        try {
            $zip = new \ZipArchive();
        } catch (\Exception $e) {
            $this->logger->error("PHP ZipArchive is missing", [$e]);
            throw new \Exception("PHP ZipArchive is missing: ".$e->getMessage());
        }
    }

    private function getFirmwareFilename($jobId) {
        return FIRMWARE_PATH.'/'.$jobId;
    }

    function add($jobId, $uploadedFile) {
        if (!$this->ensureFirmwarePathExists()) {
            $this->logger->error("Could not ensure firmware path");
            return Http::STATUS_CODE_ERROR_INTERNAL_SERVER_ERROR;
        }

        if (!is_uploaded_file($uploadedFile)) {
            $this->logger->error("Not an uploaded file", [$jobId, $uploadedFile]);
            return Http::STATUS_CODE_ERROR_FAILED_FILE_UPLOAD;
        }

        if (!$this->isPasswordProtectedFirmwareZip($uploadedFile)) {
            $this->logger->warning('Job ID was updated with unencrypted firmware file', [$jobId, $uploadedFile]);
            return Http::STATUS_CODE_ERROR_FAILED_FILE_UPLOAD;
        }

        if (!$this->isProperFirmwareZip($uploadedFile)) {
            $this->logger->warning("Job ID was updated with failing firmware file", [$jobId, $uploadedFile]);
            return Http::STATUS_CODE_ERROR_FAILED_FILE_UPLOAD;
        }

        $firmwareFinalFilename = $this->getFirmwareFilename($jobId);

        if (!$this->unzipFirmware($uploadedFile, $firmwareFinalFilename)) {
            $this->logger->error("Could not extract firmware", [$jobId, $uploadedFile, $firmwareFinalFilename]);
            unlink($firmwareFinalFilename);
            return Http::STATUS_CODE_ERROR_FAILED_FILE_UPLOAD;
        }

        return Http::STATUS_CODE_OK;
    }

    function get($jobId) {
        $firmwareFilename = $this->getFirmwareFilename($jobId);
        if (!is_file($firmwareFilename)) {
            return null;
        }

        return fopen('file://'.$firmwareFilename, 'r');
    }

    function exists($jobId) {
        $firmwareFilename = $this->getFirmwareFilename($jobId);
        return is_file($firmwareFilename);
    }

    private function isProperFirmwareZip($uploadedFile) {
        $zip = new \ZipArchive();
        $result = $zip->open($uploadedFile, \ZipArchive::RDONLY);

        if ($result !== TRUE) {
            $this->logger->error('Could not open zip for reading', [$uploadedFile, $result]);
            return false;
        }

        foreach (self::REQUIRED_FILES as $file) {
            if ($zip->locateName($file) === FALSE) {
                $this->logger->warning('Zip does not contain required file', [$uploadedFile, $file]);
                $zip->close();

                return false;
            }
        }

        $zip->close();

        return true;
    }

    private function isPasswordProtectedFirmwareZip($uploadedFile) {
        try {
            $tempDir = $this->createTempDir();
        } catch (\Exception $e) {
            $this->logger->error('Failed to create temporary directory', [$uploadedFile, $firmwareTargetPath, $e]);
            return false;
        }

        $zip = new \ZipArchive();
        $result = $zip->open($uploadedFile, \ZipArchive::RDONLY);

        if ($result !== TRUE) {
            $this->logger->error('Could not open zip for reading', [$uploadedFile, $result]);
            return false;
        }

        if ($zip->extractTo($tempDir, self::REQUIRED_FILES) === TRUE) {
            $this->logger->warning('Zip could be decrypted without password: no valid firmware file', [$uploadedFile, $tempDir]);
            $this->removeDir($tempDir);
            return false;
        }

        $this->removeDir($tempDir);

        return true;
    }

    function ensureFirmwarePathExists() {
        if (!is_dir(FIRMWARE_PATH)) {
            if (!mkdir(FIRMWARE_PATH, 0700)) {
                $this->logger->error("Firmware path does not exist and I was unable to create it", [FIRMWARE_PATH]);
                unlink($firmwareTempFilename);
                return false;
            }
        }

        return true;
    }

    function unzipFirmware($uploadedFile, $firmwareTargetPath) {
        try {
            $tempDir = $this->createTempDir();
        } catch (\Exception $e) {
            $this->logger->error('Failed to create temporary directory', [$uploadedFile, $firmwareTargetPath, $e]);
            return false;
        }

        $this->logger->debug('Starting to unzip firmware', [$uploadedFile, $firmwareTargetPath, $tempDir]);

        $zip = new \ZipArchive();
        $result = $zip->open($uploadedFile, \ZipArchive::RDONLY);

        if ($result !== TRUE) {
            $this->logger->error('Could not open zip archive', [$uploadedFile, $firmwareTargetPath, $result]);
            return false;
        }

        $this->logger->debug('Now setting unzip password', [$uploadedFile, $firmwareTargetPath, $tempDir]);

        $zip->setPassword(NEMOK_ZIP_PASSWORD);

        $this->logger->debug('Now extracting zip archive', [$uploadedFile, $firmwareTargetPath, $tempDir]);

        if (!$zip->extractTo($tempDir, self::REQUIRED_FILES)) {
            $this->logger->error('Failed to unzip files', [$uploadedFile, $firmwareTargetPath, $tempDir]);
            $this->removeDir($tempDir);
            return false;
        }

        $zip->close();

        $this->logger->debug('Firmware zip unzipped successfully', [$uploadedFile, $firmwareTargetPath, $tempDir]);

        $firmwareFilePath = $tempDir.'/firmware.bin';

        if (!is_file($firmwareFilePath)) {
            $this->logger->error("After unzipping could not find firmware file", [$uploadedFile, $firmwareTargetPath, $tempDir, $firmwareFilePath]);
            $this->removeDir($tempDir);
            return false;
        }

        $hashObserved = hash_file('sha256', $firmwareFilePath);
        if ($hashObserved === FALSE) {
            $this->logger->error('Could not calculate hash from given firmware file', [$uploadedFile, $firmwareTargetPath, $tempDir, $firmwareFilePath]);
            $this->removeDir($tempDir);
            return false;
        }

        $hashFilePath = $tempDir.'/firmware.bin.sha256';

        if (!is_file($hashFilePath)) {
            $this->logger->error("After unzipping could not find sha256 file", [$uploadedFile, $firmwareTargetPath, $tempDir, $hashFilePath]);
            $this->removeDir($tempDir);
            return false;
        }

        $hashExpected = $this->getValueFromHashFile($hashFilePath);
        if (is_null($hashExpected)) {
            $this->logger->error('Could not extract expected hash from given hash file', [$uploadedFile, $firmwareTargetPath, $tempDir, $hashFilePath]);
            $this->removeDir($tempDir);
            return false;
        }

        if ($hashObserved !== $hashExpected) {
            $this->logger->error('Firmware hash check failed', [$uploadedFile, $firmwareTargetPath, $tempDir, $hashFilePath, $hashExpected, $hashObserved]);
            $this->removeDir($tempDir);
            return false;
        }

        if (is_file($firmwareTargetPath)) {
            $this->logger->debug('Target firmware file exists, deleting', [$firmwareFilePath, $firmwareTargetPath]);
            if (!unlink($firmwareTargetPath)) {
                $this->logger->error('Could not unlink existing target firmware file', [$uploadedFile, $firmwareFilePath, $firmwareTargetPath]);
                return false;
            }
        }

        if (!copy($firmwareFilePath, $firmwareTargetPath)) {
            $this->logger->error('Failed to copy unzipped firmware file to final location', [$firmwareFilePath, $firmwareTargetPath]);
            $this->removeDir($tempDir);
            return false;
        }

        $this->removeDir($tempDir);

        $this->logger->debug('Zip archive extracted', [$uploadedFile, $firmwareTargetPath]);

        return true;
    }

    private function getValueFromHashFile($hashFilePath) {
        foreach (file($hashFilePath) as $line) {
            if (preg_match('/^([\w\d]+)\s+firmware\.bin/', $line, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    private function createTempDir() {
        $tries = 0;
        $tempDirFinal = null;

        do {
            $tries++;
            $dirPath = sys_get_temp_dir().'/nemok-'.$this->generateRandomString(6);

            if ($tries > 10) {
                throw new \Exception("Could not create temporary directory");
            }

            if (mkdir($dirPath, 0700) and is_dir($dirPath)) {
                $tempDirFinal = $dirPath;
            }
        } while (is_null($tempDirFinal));

        return $tempDirFinal;
    }

    private function removeDir(string $dir): void {
        $it = new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS);
        $files = new \RecursiveIteratorIterator($it,
                     \RecursiveIteratorIterator::CHILD_FIRST);
        foreach($files as $file) {
            if ($file->isDir()){
                rmdir($file->getPathname());
            } else {
                unlink($file->getPathname());
            }
        }
        rmdir($dir);
    }

    private function generateRandomString($length = 10) {
        return substr(str_shuffle(str_repeat($x='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', ceil($length/strlen($x)) )),1,$length);
    }

}

?>
