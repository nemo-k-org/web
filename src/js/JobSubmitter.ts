import axios from 'axios'

import * as m from './lib/MQuery'

interface SensorParametersTest {
  nemok_sensor_test_http: number,
  nemok_wifi_ssid: string;
  nemok_wifi_pass: string;
}

interface SensorParametersDS18B20 {
  nemok_sensor_temp_ds18b20: number,
  nemok_sensor_hostname: string;
  nemok_sensor_delay: number;
  nemok_sensor_key: string;
  nemok_wifi_ssid: string;
  nemok_wifi_pass: string;
  nemok_signalk_server_host: string;
  nemok_signalk_server_port: number;
}

interface SensorParametersMAX6675 {
  nemok_sensor_temp_max6675: number,
  nemok_sensor_hostname: string;
  nemok_sensor_delay: number;
  nemok_sensor_key: string;
  nemok_wifi_ssid: string;
  nemok_wifi_pass: string;
  nemok_signalk_server_host: string;
  nemok_signalk_server_port: number;
}

class JobSubmitter {
  functionCustomerCode: Function
  selectedSensor: string
  submittedJobId: string
  jobStatusPollingHandle: number
  jobStatusPollingInterval = 10000

  constructor (functionCustomerCode: Function) {
    this.functionCustomerCode = functionCustomerCode

    window.addEventListener('load', () => {
      this.activateButtons()
      this.selectedSensor = 'none'
      this.activateSensorParameterFields('.sensorParameterNone', '#buttonSelectSensorNone')
      this.activateBrowserWarning()
    })
  }

  activateButtons = () => {
    m.OnClick('#buttonSelectSensorNone', () => {
      this.activateSensorParameterFields('.sensorParameterNone', '#buttonSelectSensorNone')
      this.selectedSensor = 'none'
      m.SetText('#submitJobStatus', '')
    })

    m.OnClick('#buttonSelectSensorTest', () => {
      this.activateSensorParameterFields('.sensorParameterTest', '#buttonSelectSensorTest')
      this.selectedSensor = 'test'
      m.SetText('#submitJobStatus', '')
    })

    m.OnClick('#buttonSelectSensorDS18B20', () => {
      this.activateSensorParameterFields('.sensorParameterDS18B20', '#buttonSelectSensorDS18B20')
      this.selectedSensor = 'ds18b20'
      m.SetText('#submitJobStatus', '')
    })

    m.OnClick('#buttonSelectSensorMAX6675', () => {
      this.activateSensorParameterFields('.sensorParameterMAX6675', '#buttonSelectSensorMAX6675')
      this.selectedSensor = 'max6675'
      m.SetText('#submitJobStatus', '')
    })

    m.OnClick('#buttonSubmitJob', () => {
      m.SetText('#submitJobStatus', '')
      m.Hide('#sensorParameterArea')
      m.Show('#sensorStatusArea')

      this.submitJob()
    })
  }

  activateSensorParameterFields = (activateSelector: string, buttonSelector?: string) => {
    m.Show('#sensorParameterArea')
    m.Hide('#sensorStatusArea')
    m.Hide('.sensorParameter')
    m.Show(activateSelector)

    if (buttonSelector) {
      m.RemoveClass('.buttonSelectSensor', 'btn-primary')
      m.RemoveClass('.buttonSelectSensor', 'btn-secondary')
      m.AddClass('.buttonSelectSensor', 'btn-secondary')
      m.RemoveClass(buttonSelector, 'btn-secondary')
      m.AddClass(buttonSelector, 'btn-primary')
    }
  }

  activateBrowserWarning = () => {
    if (this.browserHasSerial()) {
      m.Hide('#browserWarningSerialSupport')
    } else {
      m.Show('#browserWarningSerialSupport')
    }
  }

  getSensorParameters = (): SensorParametersTest|SensorParametersDS18B20|SensorParametersMAX6675|null => {
    if (this.selectedSensor === 'test') {
      const parameters: SensorParametersTest = {
        nemok_sensor_test_http: 1,
        nemok_wifi_ssid: m.GetFormInputValue('#sensorParameterSsid'),
        nemok_wifi_pass: m.GetFormInputValue('#sensorParameterPass')
      }

      return parameters
    }

    if (this.selectedSensor === 'ds18b20') {
      const parameters: SensorParametersDS18B20 = {
        nemok_sensor_temp_ds18b20: 1,
        nemok_sensor_hostname: m.GetFormInputValue('#sensorParameterHostname'),
        nemok_sensor_delay: +m.GetFormInputValue('#sensorParameterSensorDelay'),
        nemok_sensor_key: m.GetFormInputValue('#sensorParameterKey'),
        nemok_wifi_ssid: m.GetFormInputValue('#sensorParameterSsid'),
        nemok_wifi_pass: m.GetFormInputValue('#sensorParameterPass'),
        nemok_signalk_server_host: m.GetFormInputValue('#sensorParameterServerHost'),
        nemok_signalk_server_port: +m.GetFormInputValue('#sensorParameterServerPort')
      }

      return parameters
    }

    if (this.selectedSensor === 'max6675') {
      const parameters: SensorParametersMAX6675 = {
        nemok_sensor_temp_max6675: 1,
        nemok_sensor_hostname: m.GetFormInputValue('#sensorParameterHostname'),
        nemok_sensor_delay: +m.GetFormInputValue('#sensorParameterSensorDelay'),
        nemok_sensor_key: m.GetFormInputValue('#sensorParameterKey'),
        nemok_wifi_ssid: m.GetFormInputValue('#sensorParameterSsid'),
        nemok_wifi_pass: m.GetFormInputValue('#sensorParameterPass'),
        nemok_signalk_server_host: m.GetFormInputValue('#sensorParameterServerHost'),
        nemok_signalk_server_port: +m.GetFormInputValue('#sensorParameterServerPort')
      }

      return parameters
    }

    return null
  }

  submitJob = async () => {
    this.submittedJobId = ''
    const jobParameters = this.getSensorParameters()

    try {
      const response = await axios.post('/api/jobs', {
        jobParameters: jobParameters,
        customerCode: this.functionCustomerCode()
      })

      m.SetText('#submitJobStatus', `Job submitted, id: ${response.data}, please wait...`)
      this.submittedJobId = response.data
      this.pollJobStatusAfterTimeout()
    } catch (error) {
      console.error(error)
      if (error.response.status === 550) {
        if (error.response.data !== null && error.response.data !== '') {
          m.SetText('#submitJobStatus', `Failed to submit job: ${error.response.data}`)
        } else {
          m.SetText('#submitJobStatus', 'Failed to submit job. Check job parameters. You may find more information in the browser console.')
        }
      } else {
        m.SetText('#submitJobStatus', 'Failed to submit job. See browser console for details.')
      }
    }
  }

  pollJobStatusAfterTimeout = () => {
    if (this.jobStatusPollingHandle) {
      clearTimeout(this.jobStatusPollingHandle)
    }

    this.jobStatusPollingHandle = window.setTimeout(async () => { await this.doJobStatusPolling() }, this.jobStatusPollingInterval)
  }

  doJobStatusPolling = async () => {
    try {
      const response = await axios.get(`/api/jobs/${this.submittedJobId}/status`, {
        headers: {
          'NemoK-CustomerCode': m.GetFormInputValue('#customerCode')
        }
      })

      const jobStatus = response.data

      if (jobStatus === 'submitted') {
        m.SetText('#submitJobStatus', `Job ${this.submittedJobId} has been submitted to compilation service, please wait...`)
      } else if (jobStatus === 'received') {
        m.SetText('#submitJobStatus', `Job ${this.submittedJobId} is ready to be uploaded to your microcontroller.`)
        m.SetFormInputValue('#tabFlashJobId', this.submittedJobId)
      } else {
        m.SetText('#submitJobStatus', `Job ${this.submittedJobId} status: "${jobStatus}"`)
      }
    } catch (error) {
      console.error(error)
      m.SetText('#submitJobStatus', 'Error when querying job status. See browser log for details.')
    }

    this.pollJobStatusAfterTimeout()
  }

  browserHasSerial = ():boolean => {
    return 'serial' in window.navigator
  }
}

export default JobSubmitter
