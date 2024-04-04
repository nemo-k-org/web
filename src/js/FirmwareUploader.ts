import axios from 'axios'
import CryptoJS from 'crypto-js'
import { ESPLoader, LoaderOptions, FlashOptions, Transport, IEspLoaderTerminal } from 'esptool-js'
import { Terminal } from 'xterm'

import { arrayBufferToString } from './lib/arrayBufferHelper'

class FirmwareUploader {
  serialTerminal: Terminal
  serialDevice: any
  serialTransport: Transport
  espLoader: ESPLoader
  espLoaderTerminal: IEspLoaderTerminal
  connectedChip: string
  firmwareImage: ArrayBuffer

  constructor () {
    this.serialDevice = null
    this.connectedChip = ''

    window.addEventListener('load', () => {
      this.activateTerminal()
    })
  }

  activateTerminal = () => {
    const elTerminal = document.getElementById('terminal')
    this.serialTerminal = new Terminal()
    this.serialTerminal.open(elTerminal)
  }

  uploadFirmware = async (customerCode: string, jobId: string): Promise<boolean> => {
    if (!await this.serialConnect()) {
      this.serialTerminal.writeln('Firmware upload failed: could not open serial connection')
      await this.serialDisconnect()
      return false
    }

    if (!await this.downloadFirmwareFromBackend(customerCode, jobId)) {
      this.serialTerminal.writeln('Firmware upload failed: could not download firmware from backend')
      await this.serialDisconnect()
      return false
    }

    if (!await this.uploadFirmwareToMicrocontroller()) {
      this.serialTerminal.writeln('Firmware upload failed: could not upload firmware to microcontroller')
      await this.serialDisconnect()
      return false
    }

    await this.serialDisconnect()

    return true
  }

  serialConnect = async (): Promise<boolean> => {
    if (this.serialDevice === null) {
      try {
        // @ts-ignore
        this.serialDevice = await window.navigator.serial.requestPort({})
      } catch (e) {
        console.error(e)
        this.serialTerminal.writeln(`Error while selecting serial port: ${e.message}`)
        return false
      }

      this.serialTransport = new Transport(this.serialDevice, true)
    }

    this.connectedChip = ''

    try {
      const flashOptions = {
        transport: this.serialTransport,
        baudrate: 115200,
        terminal: this.espLoaderTerminal
      } as LoaderOptions

      this.espLoader = new ESPLoader(flashOptions)
      this.connectedChip = await this.espLoader.main()

      // Temporarily broken
      // await this.espLoader.flashId();
      this.serialTerminal.writeln(`Successfully connected to ${this.connectedChip}`)
      console.debug(`Connected to ${this.connectedChip}`)
    } catch (e) {
      console.error(e)
      this.serialTerminal.writeln(`Error: ${e.message}`)
      return false
    }

    return true
  }

  serialDisconnect = async () => {
    if (this.serialTransport) {
      try {
        await this.serialTransport.disconnect()
        this.serialTerminal.writeln('Device disconnected successfully')
      } catch (e) {
        console.error(`Error while closing serial port: ${e.message}`)
      }
    }

    this.connectedChip = ''
    this.serialDevice = null
    this.serialTransport = null
  }

  downloadFirmwareFromBackend = async (customerCode: string, jobId: string): Promise<boolean> => {
    try {
      const response = await axios.get(`/api/jobs/${jobId}/firmware`, {
        responseType: 'arraybuffer',
        headers: {
          'NemoK-CustomerCode': customerCode
        }
      })

      this.firmwareImage = response.data
    } catch (e) {
      console.error(e)
      this.serialTerminal.writeln(`Error while downloading firmware: ${e.message}`)
      return false
    }

    console.debug('firmware is loaded', customerCode, jobId, this.firmwareImage.byteLength)

    return true
  }

  uploadFirmwareToMicrocontroller = async (): Promise<boolean> => {
    const flashOptionsFileArray = [
      {
        data: arrayBufferToString(this.firmwareImage),
        address: 0x0
      }
    ]

    try {
      const flashOptions: FlashOptions = {
        fileArray: flashOptionsFileArray,
        flashSize: 'keep',
        eraseAll: false,
        compress: true,
        flashMode: 'keep',
        flashFreq: 'keep',
        calculateMD5Hash: (image: string) => CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)).toString()
      }

      await this.espLoader.writeFlash(flashOptions)
    } catch (e) {
      console.error(e)
      this.serialTerminal.writeln(`Error: ${e.message}`)
      return false
    }

    return true
  }
}

export default FirmwareUploader
