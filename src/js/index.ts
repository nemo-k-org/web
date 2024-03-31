import 'bootstrap/dist/css/bootstrap.min.css'

import JobSubmitter from './JobSubmitter'
import FirmwareUploader from './FirmwareUploader'

const jobSubmitter = new JobSubmitter() // eslint-disable-line no-unused-vars
const firmwareUploader = new FirmwareUploader()

const espLoaderTerminal = {
  clean () {
    firmwareUploader.serialTerminal.clear()
  },
  writeLine (data: string) {
    firmwareUploader.serialTerminal.writeln(data)
  },
  write (data: string) {
    firmwareUploader.serialTerminal.write(data)
  }
}
firmwareUploader.espLoaderTerminal = espLoaderTerminal
