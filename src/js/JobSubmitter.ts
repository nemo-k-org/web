import axios from 'axios'

import * as m from './lib/MQuery'

interface SensorParametersTest {
  nemok_sensor_test_http: number,
  nemok_wifi_ssid: string;
  nemok_wifi_pass: string;
}

class JobSubmitter {
  selectedSensor: string

  constructor () {
    window.addEventListener('load', () => {
      this.activateButtons()
      this.selectedSensor = 'none'
      this.activateSensorParameterArea('#buttonSelectSensorNone', '#sensorParameterAreaNone')
    })
  }

  activateButtons = () => {
    m.OnClick('#buttonSelectSensorNone', () => {
      this.activateSensorParameterArea('#buttonSelectSensorNone', '#sensorParameterAreaNone')
      this.selectedSensor = 'none'
    })

    m.OnClick('#buttonSelectSensorTest', () => {
      this.activateSensorParameterArea('#buttonSelectSensorTest', '#sensorParameterAreaTest')
      this.selectedSensor = 'test'
    })

    m.OnClick('#submitJob', () => {
      this.submitJob()
    })
  }

  activateSensorParameterArea = (buttonSelector: string, areaSelector: string) => {
    m.Hide('.sensorParameterArea')
    m.Show(areaSelector)

    m.RemoveClass('.buttonSelectSensor', 'btn-primary')
    m.RemoveClass('.buttonSelectSensor', 'btn-secondary')
    m.AddClass('.buttonSelectSensor', 'btn-secondary')
    m.RemoveClass(buttonSelector, 'btn-secondary')
    m.AddClass(buttonSelector, 'btn-primary')

    m.SetText('#submitJobResponse', '')
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
    const jobParameters = this.getSensorParameters()

    try {
      const response = await axios.post('/api/jobs', {
        jobParameters: jobParameters,
        customerCode: m.GetFormInputValue('#customerCode')
      })

      m.SetText('#submitJobResponse', `Job submitted, id: ${response.data}`)
    } catch (error) {
      console.error(error)
      if (error.response.status === 550) {
        if (error.response.data !== null && error.response.data !== '') {
          m.SetText('#submitJobResponse', `Failed to submit job: ${error.response.data}`)
        } else {
          m.SetText('#submitJobResponse', 'Failed to submit job. Check job parameters. You may find more information in the browser console.')
        }
      } else {
        m.SetText('#submitJobResponse', 'Failed to submit job. See browser console for details.')
      }
    }
  }
}

export default JobSubmitter
