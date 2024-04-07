import 'bootstrap/dist/css/bootstrap.min.css'
import { IEspLoaderTerminal } from 'esptool-js'

import MainUI from './MainUI'
import JobSubmitter from './JobSubmitter'
import UserAccount from './UserAccount'
import JobsTableHandler from './JobsTableHandler'

const mainUI = new MainUI()

const espLoaderTerminal: IEspLoaderTerminal = {
  clean () {
    mainUI.firmwareUploader.serialTerminal.clear()
  },
  writeLine (data: string) {
    mainUI.firmwareUploader.serialTerminal.writeln(data)
    mainUI.firmwareUploadMessage(data)
  },
  write (data: string) {
    mainUI.firmwareUploader.serialTerminal.write(data)
    mainUI.firmwareUploadMessage(data)
  }
}
mainUI.firmwareUploader.espLoaderTerminal = espLoaderTerminal

const userAccount = new UserAccount()
const jobSubmitter = new JobSubmitter(userAccount.getCustomerCode) // eslint-disable-line no-unused-vars
const jobsTableHandler = new JobsTableHandler('#tableJobs', userAccount.getCustomerCode)
jobsTableHandler.firmwareUploader = mainUI.firmwareUploader
