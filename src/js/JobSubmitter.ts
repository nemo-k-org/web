import axios from 'axios'

import * as m from './lib/MQuery'

interface SensorParametersTest {
  nemok_sensor_test_http: number,
  nemok_wifi_ssid: string;
  nemok_wifi_pass: string;
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
      this.activateSensorParameterArea('#sensorParameterAreaNone', '#buttonSelectSensorNone')
    })
  }

  activateButtons = () => {
    m.OnClick('#buttonSelectSensorNone', () => {
      this.activateSensorParameterArea('#sensorParameterAreaNone', '#buttonSelectSensorNone')
      this.selectedSensor = 'none'
      m.SetText('#submitJobStatus', '')
    })

    m.OnClick('#buttonSelectSensorTest', () => {
      this.activateSensorParameterArea('#sensorParameterAreaTest', '#buttonSelectSensorTest')
      this.selectedSensor = 'test'
      m.SetText('#submitJobStatus', '')
    })

    m.OnClick('#buttonSubmitJob', () => {
      m.SetText('#submitJobStatus', '')
      this.activateSensorParameterArea('#sensorParameterAreaStatus')
      this.submitJob()
    })
  }

  activateSensorParameterArea = (areaSelector: string, buttonSelector?: string) => {
    m.Hide('.sensorParameterArea')
    m.Show(areaSelector)

    if (buttonSelector) {
      m.RemoveClass('.buttonSelectSensor', 'btn-primary')
      m.RemoveClass('.buttonSelectSensor', 'btn-secondary')
      m.AddClass('.buttonSelectSensor', 'btn-secondary')
      m.RemoveClass(buttonSelector, 'btn-secondary')
      m.AddClass(buttonSelector, 'btn-primary')
    }
  }

  getSensorParameters = (): SensorParametersTest|null => {
    if (this.selectedSensor === 'test') {
      return {
        nemok_sensor_test_http: 1,
        nemok_wifi_ssid: m.GetFormInputValue('#sensorParameterTestSsid'),
        nemok_wifi_pass: m.GetFormInputValue('#sensorParameterTestPassword')
      }
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
}

export default JobSubmitter
