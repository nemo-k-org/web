import 'bootstrap/dist/css/bootstrap.min.css'

import JobSubmitter from './JobSubmitter'
import FirmwareUploader from './FirmwareUploader'
import UserAccount from './UserAccount'
import JobsTableHandler from './JobsTableHandler'

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

const userAccount = new UserAccount()
const jobSubmitter = new JobSubmitter(userAccount.getCustomerCode) // eslint-disable-line no-unused-vars
const jobsTableHandler = new JobsTableHandler('#tableJobs', userAccount.getCustomerCode)
jobsTableHandler.firmwareUploader = firmwareUploader
