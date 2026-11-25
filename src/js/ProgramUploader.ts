import * as m from './lib/MQuery'

import { SensorType, Firmwares } from './types'
import { SensorParameters, SensorParameter } from './SensorParameters'
import FirmwareUploader from './Component/FirmwareUploader'
import DebugTerminal from './DebugTerminal'

class ProgramUploader {
  firmwares: Firmwares
  debugTerminal: DebugTerminal
  sensorParameters: SensorParameters

  constructor (firmwares: Firmwares, debugTerminal: DebugTerminal) {
    this.firmwares = firmwares
    this.debugTerminal = debugTerminal

    this.sensorParameters = new SensorParameters()

    window.addEventListener('load', () => {
      this.activateButtons()
    })
  }

  activateButtons = () => {
    m.OnEvent('.radioSensorType', 'change', () => {
      const newSensorType: SensorType | null = this.getCurrentSensorType()

      if (newSensorType !== null) {
        this.onSensorTypeChange(newSensorType)
      }
    })

    m.OnClick('#buttonUploadProgram', this.uploadProgramAndSensorParameters)
  }

  getCurrentSensorType = (): SensorType | null => {
    return m.GetFormRadioValue('sensorType') as SensorType
  }

  getCurrentSensorFirmwareURL = (): string | null => {
    const sensorType: SensorType | null = this.getCurrentSensorType()

    if (sensorType === null) {
      return null
    }

    if (sensorType in this.firmwares) {
      return this.firmwares[sensorType].url
    }

    return null
  }

  getCurrentSensorParameters = (): SensorParameter[] => {
    return this.sensorParameters.getParameters()
  }

  onSensorTypeChange = (sensorType: SensorType) => {
    if (sensorType in this.firmwares) {
      m.Hide('.sensorParameter')
      m.Show('.sensorParameterCommon')
      m.Show(this.firmwares[sensorType].uiParameterSelector)
    }
  }

  uploadProgramAndSensorParameters = async () => {
    const firmwareURL: string | null = this.getCurrentSensorFirmwareURL()

    if (firmwareURL === null) {
      return
    }

    const sensorParameters: SensorParameter[] = this.getCurrentSensorParameters()

    const firmwareUploader = new FirmwareUploader(this.debugTerminal.espLoaderTerminal)

    const firmwareUploaded = await firmwareUploader.uploadFirmware(firmwareURL, sensorParameters)

    if (firmwareUploaded) {
      this.debugTerminal.espLoaderTerminal.writeLine('Program uploaded successfully. You may now disconnect your microcontroller from your computer.')
    } else {
      this.debugTerminal.espLoaderTerminal.writeLine('An error was encountered while uploading the program. See terminal for detailed error messages.')
    }
  }
}

export default ProgramUploader
