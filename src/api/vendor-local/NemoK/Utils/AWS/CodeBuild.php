<?php 

namespace Nemok\Utils\AWS;

use Aws\CodeBuild\CodeBuildClient;
use Aws\Credentials\CredentialProvider;

class CodeBuild {
    private $aws_settings;
    private $aws_client;

    function __construct($aws_settings) {
        $this->aws_settings = $aws_settings;

        $this->aws_client = new CodeBuildClient([
            'profile' => $this->aws_settings['profile'],
            'region' => $this->aws_settings['region'],
            'version' => $this->aws_settings['version']
        ]);
    }

    function submitBuild($jobId, $jobParameters) {
        $jobParametersAWS = $this->jobParametersToAWSFormat($jobParameters);

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