import * as m from './lib/MQuery'

import { Firmwares } from './types'
import FirmwareUploader from './Component/FirmwareUploader'
import DebugTerminal from './DebugTerminal'

class ProgramUploader {
  onSensorTypeChange: Function
  firmwares: Firmwares
  debugTerminal: DebugTerminal

  constructor (onSensorTypeChange: Function, firmwares: Firmwares, debugTerminal: DebugTerminal) {
    this.onSensorTypeChange = onSensorTypeChange
    this.firmwares = firmwares
    this.debugTerminal = debugTerminal

    window.addEventListener('load', () => {
      this.activateButtons()
    })
  }

  activateButtons = () => {
    m.OnEvent('.radioSensorType', 'change', () => {
      const newSensorType: string | null = this.getCurrentSensorType()

      if (newSensorType !== null) {
        this.onSensorTypeChange(newSensorType)
      }
    })

    m.OnClick('#buttonUploadProgram', this.uploadProgram)
  }

  getCurrentSensorType = (): string | null => {
    return m.GetFormRadioValue('sensorType')
  }

  getCurrentSensorFirmwareURL = (): string | null => {
    const sensorType: string | null = this.getCurrentSensorType()

    if (sensorType === null) {
      return null
    }

    if (sensorType in this.firmwares) {
      return this.firmwares[sensorType].url
    }

    return null
  }

  uploadProgram = async () => {
    const firmwareURL: string | null = this.getCurrentSensorFirmwareURL()

    if (firmwareURL === null) {
      return
    }

    const firmwareUploader = new FirmwareUploader(this.debugTerminal.espLoaderTerminal)

    const firmwareUploaded = await firmwareUploader.uploadFirmware(firmwareURL)

    if (firmwareUploaded) {
      this.debugTerminal.espLoaderTerminal.writeLine('Program uploaded successfully. You may now disconnect your microcontroller from your computer.')
    } else {
      this.debugTerminal.espLoaderTerminal.writeLine('An error was encountered while uploading the program. See terminal for detailed error messages.')
    }
  }
}

export default ProgramUploader
