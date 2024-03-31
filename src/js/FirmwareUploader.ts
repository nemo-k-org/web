import axios from 'axios'
import CryptoJS from 'crypto-js'
import { ESPLoader, LoaderOptions, FlashOptions, Transport, IEspLoaderTerminal } from 'esptool-js'
import { Terminal } from 'xterm'

import * as m from './lib/MQuery'
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
      this.activateButtons()
    })
  }

  activateTerminal = () => {
    const elTerminal = document.getElementById('terminal')
    this.serialTerminal = new Terminal()
    this.serialTerminal.open(elTerminal)
  }

  activateButtons = () => {
    m.OnClick('#buttonFlashConnect', (event: Event) => {
      event.preventDefault()
      this.serialConnect()
    })
    m.OnClick('#buttonFlashDisconnect', (event: Event) => {
      event.preventDefault()
      this.serialDisconnect()
    })
    m.OnClick('#buttonFlashUpload', async (event: Event) => {
      event.preventDefault()
      await this.downloadFirmwareFromBackend()
      await this.uploadFirmwareToMicrocontroller()
    })
  }

  serialConnect = async () => {
    if (this.serialDevice === null) {
      try {
        // @ts-ignore
        this.serialDevice = await window.navigator.serial.requestPort({})
      } catch (e) {
        console.error(e)
        this.serialTerminal.writeln(`Error while selecting serial port: ${e.message}`)
        return
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
    }
  }

  serialDisconnect = async () => {
    if (this.serialTransport) {
      await this.serialTransport.disconnect()
    }

    this.serialTerminal.writeln('Device disconnected successfully')

    this.connectedChip = ''
    this.serialDevice = null
  }

  downloadFirmwareFromBackend = async () => {
    const jobId = m.GetFormInputValue('#tabFlashJobId')
    const customerCode = m.GetFormInputValue('#customerCode')

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
    }
  }

  uploadFirmwareToMicrocontroller = async () => {
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
    }
  }
}

export default FirmwareUploader
