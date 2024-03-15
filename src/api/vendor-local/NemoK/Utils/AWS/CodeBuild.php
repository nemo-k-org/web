<?php 

namespace Nemok\Utils\AWS;

use Aws\CodeBuild\CodeBuildClient;
use Aws\Credentials\CredentialProvider;

class CodeBuild {
    private $aws_settings;
    private $aws_client;

    function __construct($aws_settings) {
        $this->aws_settings = $aws_settings;

        $provider = CredentialProvider::ini($this->aws_settings['profile'], $this->aws_settings['credentialsPath']);
        $provider = CredentialProvider::memoize($provider);

        $this->aws_client = new CodeBuildClient([
            'region' => $this->aws_settings['region'],
            'version' => $this->aws_settings['version'],
            'credentials' => $provider,
        ]);
    }

    function dryRun() {
        if ($this->aws_settings['dryRun'] != '') {
            return true;
        }

        return false;
    }

    function submitBuild($jobId, $jobParameters) {
        $jobParametersAWS = $this->jobParametersToAWSFormat($jobParameters);

        if ($this->dryRun()) {
            return ['AWS_dry_run' => true];
        }

        $response = $this->aws_client->startBuild([
            'projectName' => $this->aws_settings['codeBuildProjectname'],
            'environmentVariablesOverride' => $jobParametersAWS,
        ]);

        return $response;
    }

    private function jobParametersToAWSFormat($jobParameters) {
        $jobParametersAWS = [];

        foreach ($jobParameters as $name => $value) {
            $parameters = [
                'name' => $name,
                'type' => 'PLAINTEXT',
                'value' => $value,
            ];

            array_push($jobParametersAWS, $parameters);
        }

        return $jobParametersAWS;
    }
}

?>