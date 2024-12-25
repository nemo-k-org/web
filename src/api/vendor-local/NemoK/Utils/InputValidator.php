<?php

namespace NemoK\Utils;

class InputValidator {
    private $jobParameters;

    function __construct($jobParameters = null) {
        $this->jobParameters = $jobParameters;
    }

    function getValidatedJobParameters($jobParameters = null) {
        if (is_null($jobParameters)) {
            $jobParameters = $this->jobParameters;
        }

        $validatedParameters = [];

        // NB! There should be no integers among values, otherwise AWS Serialization will croak:
        // SerializationException (client): class com.amazon.coral.value.json.numbers.TruncatingBigNumber can not be converted to an String

        if (@$jobParameters['nemok_sensor_test_http'] != '') {
            $validatedParameters['NEMOK_SENSOR_TEST_HTTP'] = '1';

            $validatedParameters['NEMOK_WIFI_SSID'] = $this->validateAlphanumeric(@$jobParameters['nemok_wifi_ssid'], 'SSID');
            $validatedParameters['NEMOK_WIFI_PASS'] = $this->validateAlphanumeric(@$jobParameters['nemok_wifi_pass'], 'WiFi password');

            if ($this->missingRequiredFields($validatedParameters, ['NEMOK_WIFI_SSID', 'NEMOK_WIFI_PASS'])) {
                throw new \Exception('Missing required parameters');
            }
        }

        if (@$jobParameters['nemok_sensor_temp_ds18b20'] != '') {
            $validatedParameters['NEMOK_SENSOR_TEMP_DS18B20'] = '1';

            $validatedParameters['NEMOK_WIFI_SSID'] = $this->validateAlphanumeric(@$jobParameters['nemok_wifi_ssid'], 'SSID');
            $validatedParameters['NEMOK_WIFI_PASS'] = $this->validateAlphanumeric(@$jobParameters['nemok_wifi_pass'], 'WiFi password');

            $validatedParameters['NEMOK_SENSOR_HOSTNAME'] = $this->validateAlphanumeric(@$jobParameters['nemok_sensor_hostname'], 'Sensor Hostname');
            $validatedParameters['NEMOK_SENSOR_DELAY'] = "".$this->validateNumeric(@$jobParameters['nemok_sensor_delay'], 'Sensor Delay');
            $validatedParameters['NEMOK_SENSOR_KEY'] = "".$this->validateAlphanumericWithDots(@$jobParameters['nemok_sensor_key'], 'Sensor Key');

            $validatedParameters['NEMOK_SIGNALK_SERVER_HOST'] = $this->validateAlphanumericWithDots(@$jobParameters['nemok_signalk_server_host'], 'Server Host');
            $validatedParameters['NEMOK_SIGNALK_SERVER_PORT'] = "".$this->validateNumeric(@$jobParameters['nemok_signalk_server_port'], 'Server Port');

            if ($this->missingRequiredFields($validatedParameters, ['NEMOK_WIFI_SSID', 'NEMOK_WIFI_PASS', 'NEMOK_SENSOR_HOSTNAME'])) {
                throw new \Exception('Missing required parameters');
            }
        }

        if (@$jobParameters['nemok_sensor_temp_max6675'] != '') {
            $validatedParameters['NEMOK_SENSOR_TEMP_MAX6675'] = '1';

            $validatedParameters['NEMOK_WIFI_SSID'] = $this->validateAlphanumeric(@$jobParameters['nemok_wifi_ssid'], 'SSID');
            $validatedParameters['NEMOK_WIFI_PASS'] = $this->validateAlphanumeric(@$jobParameters['nemok_wifi_pass'], 'WiFi password');

            $validatedParameters['NEMOK_SENSOR_HOSTNAME'] = $this->validateAlphanumeric(@$jobParameters['nemok_sensor_hostname'], 'Sensor Hostname');
            $validatedParameters['NEMOK_SENSOR_DELAY'] = "".$this->validateNumeric(@$jobParameters['nemok_sensor_delay'], 'Sensor Delay');
            $validatedParameters['NEMOK_SENSOR_KEY'] = "".$this->validateAlphanumericWithDots(@$jobParameters['nemok_sensor_key'], 'Sensor Key');

            $validatedParameters['NEMOK_SIGNALK_SERVER_HOST'] = $this->validateAlphanumericWithDots(@$jobParameters['nemok_signalk_server_host'], 'Server Host');
            $validatedParameters['NEMOK_SIGNALK_SERVER_PORT'] = "".$this->validateNumeric(@$jobParameters['nemok_signalk_server_port'], 'Server Port');

            if ($this->missingRequiredFields($validatedParameters, ['NEMOK_WIFI_SSID', 'NEMOK_WIFI_PASS', 'NEMOK_SENSOR_HOSTNAME'])) {
                throw new \Exception('Missing required parameters');
            }
        }

        return $validatedParameters;
    }

    function missingRequiredFields($parameters, $fields) {
        foreach ($fields as $thisField) {
            if (is_null($parameters[$thisField])) return true;
            if ($parameters[$thisField] == '') return true;
        }

        return false;
    }

    function validateNumeric($str, $field=null) {
        if (preg_match('/[^\d]/', $str)) {
            if (is_null($field)) {
                throw new \Exception('given value is not alphanumeric');
            }
            else {
                throw new \Exception('given value "'.$field.'" is not alphanumeric');
            }
        }

        return $str;
    }

    function validateAlphanumeric($str, $field=null) {
        if (preg_match('/[^\w\d\-_]/', $str)) {
            if (is_null($field)) {
                throw new \Exception('given value is not alphanumeric');
            }
            else {
                throw new \Exception('given value "'.$field.'" is not alphanumeric');
            }
        }

        return $str;
    }

    function validateAlphanumericWithDots($str, $field=null) {
        if (preg_match('/[^\w\d\-_\.]/', $str)) {
            if (is_null($field)) {
                throw new \Exception('given value is not alphanumeric-with-dots');
            }
            else {
                throw new \Exception('given value "'.$field.'" is not alphanumeric-with-dots');
            }
        }

        return $str;
    }

    function validateUuid($str, $field=null) {
        if (preg_match('/[^\-0-9a-fA-F]/', $str)) {
            if (is_null($field)) {
                throw new \Exception('given value is not UUID');
            }
            else {
                throw new \Exception('given value "'.$field.'" is not UUID');
            }
        }

        return $str;
    }
}

?>
