<?php

namespace NemoK\Utils;

class FirmwareFile {
    const REQUIRED_FILES = ['firmware.bin', 'firmware.bin.sha256'];

    private $uploadedFile;
    public $errorMessage;

    function __construct($uploadedFile) {
        $this->uploadedFile = $uploadedFile;

        try {
            $zip = new \ZipArchive();
        } catch (\Exception $e) {
            throw new \Exception("PHP ZipArchive is missing: ".$e->getMessage());
        }
    }

    function isValidFirmwareZip() {
        $this->errorMessage = '';
        return $this->isUploadedFile() and $this->hasRequiredFiles();
    }

    private function isUploadedFile() {
        if (!is_uploaded_file($this->uploadedFile)) {
            $this->errorMessage = 'Is not uploaded file';
            return false;
        }

        return true;
    }

    private function hasRequiredFiles() {
        $zip = new \ZipArchive();
        $result = $zip->open($this->uploadedFile, \ZipArchive::RDONLY);

        if ($result !== TRUE) {
            $this->errorMessage = 'Could not open: '.$result;
            return false;
        }

        foreach (self::REQUIRED_FILES as $file) {
            if ($zip->locateName($file) === FALSE) {
                $this->errorMessage = 'Required file missing: '.$file;
                $zip->close();

                return false;
            }
        }

        $zip->close();

        return true;
    }

    function unzipFirmwareTo($firmwareTargetPath) {
        if (is_file($firmwareTargetPath)) {
            $this->errorMessage = 'Given target file already exists';
            return false;
        }

        try {
            $tempDir = $this->createTempDir();
        } catch (\Exception $e) {
            $this->errorMessage = 'Failed to create temporary directory: '.$e->getMessage();
            return false;
        }

        $zip = new \ZipArchive();
        $result = $zip->open($this->uploadedFile, \ZipArchive::RDONLY);

        if ($result !== TRUE) {
            $this->errorMessage = 'Could not open: '.$result;
            return false;
        }

        if (!$zip->extractTo($tempDir, self::REQUIRED_FILES)) {
            $this->errorMessage = 'Failed to unzip files';
            $this->removeDir($tempDir);
            return false;
        }

        $zip->close();

        $firmwareFilePath = $tempDir.'/firmware.bin';
        $hashObserved = hash_file('sha256', $firmwareFilePath);
        if ($hashObserved === FALSE) {
            $this->errorMessage = 'Could not calculate hash from given firmware file';
            $this->removeDir($tempDir);
            return false;
        }

        $hashFilePath = $tempDir.'/firmware.bin.sha256';
        $hashExpected = $this->getValueFromHashFile($hashFilePath);
        if (is_null($hashExpected)) {
            $this->errorMessage = 'Could not extract expected hash from given hash file';
            $this->removeDir($tempDir);
            return false;
        }

        if ($hashObserved !== $hashExpected) {
            $this->errorMessage = 'Firmware hash check failed';
            $this->removeDir($tempDir);
            return false;
        }

        if (!copy($firmwareFilePath, $firmwareTargetPath)) {
            $this->errorMessage = 'Failed to copy unzipped firmware file to final location';
            $this->removeDir($tempDir);
            return false;
        }

        $this->removeDir($tempDir);

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

    function removeDir(string $dir): void {
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
