import axios from 'axios'

import * as m from './lib/MQuery'

interface SensorParametersTest {
  ssid: string;
  password: string;
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
        ssid: m.GetFormInputValue('#sensorParameterTestSsid'),
        password: m.GetFormInputValue('#sensorParameterTestPassword')
      }
    }

    return null
  }

  submitJob = async () => {
    const jobParameters = this.getSensorParameters()

    try {
      const response = await axios.post('/api/jobs', {
        jobParameters: jobParameters
      })

      m.SetText('#submitJobResponse', `Job submitted, id: ${response.data}`)
    } catch (error) {
      console.error(error)
      m.SetText('#submitJobResponse', 'Failed to submit log. See browser console for details.')
    }
  }
}

export default JobSubmitter
