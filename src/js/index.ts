import 'bootstrap/dist/css/bootstrap.min.css'

import { Firmwares } from './types'

import DebugTerminal from './DebugTerminal'
import ProgramUploader from './ProgramUploader'

const firmwares: Firmwares = {
  none: {
    legend: 'No sensor',
    url: null
  },
  test: {
    legend: 'Test sensor',
    url: '/firmware/firmware_test.bin'
  },
  tempds18b20: {
    legend: 'Temperature sensor DS18B20',
    url: '/firmware/firmware_ds18b20.bin'
  },
  tempmax6675: {
    legend: 'Temperature sensor MAX6675',
    url: '/firmware/firmware_max6675.bin'
  }
}

const debugTerminal = new DebugTerminal()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const programUploader = new ProgramUploader(
  (sensorType: string) => { console.debug(`New sensor type: ${sensorType}`) },
  firmwares,
  debugTerminal
)
