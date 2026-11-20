import axios from 'axios'
import CryptoJS from 'crypto-js'
import { ESPLoader, LoaderOptions, FlashOptions, Transport, IEspLoaderTerminal } from 'esptool-js'
import LittleFSWASMPreferences from '@nemo-k-org/littlefs-wasm-preferences'

import { SensorParameter } from '../SensorParameters'

class FirmwareUploader {
  serialDevice: any
  serialTransport: Transport | null
  espLoader: ESPLoader
  espLoaderTerminal: IEspLoaderTerminal
  connectedChip: string
  firmwareImage: ArrayBuffer
  preferencesImage: Uint8Array

  constructor(espLoaderTerminal: IEspLoaderTerminal) {
    this.serialDevice = null
    this.serialTransport = null
    this.connectedChip = ''
    this.espLoaderTerminal = espLoaderTerminal
    this.firmwareImage = new ArrayBuffer()
    this.preferencesImage = new ArrayBuffer()
  }

  uploadFirmware = async (firmwareURL: string, sensorParameters: SensorParameter[]): Promise<boolean> => {
    if (!await this.createPreferencesImage(sensorParameters)) {
      this.espLoaderTerminal.writeLine('Creating preferences image failed')
      return false
    }

    if (!await this.serialConnect()) {
      this.espLoaderTerminal.writeLine('Firmware upload failed: could not open serial connection')
      await this.serialDisconnect()
      return false
    }

    if (!await this.downloadFirmwareFromBackend(firmwareURL)) {
      this.espLoaderTerminal.writeLine('Firmware upload failed: could not download firmware from backend')
      await this.serialDisconnect()
      return false
    }

    if (!await this.uploadFirmwareToMicrocontroller()) {
      this.espLoaderTerminal.writeLine('Firmware upload failed: could not upload firmware to microcontroller')
      await this.serialDisconnect()
      return false
    }

    await this.serialDisconnect()

    return true
  }

  serialConnect = async (): Promise<boolean> => {
    if (this.serialDevice === null) {
      try {
        // @ts-expect-error: for some reason "serial" is problematic
        this.serialDevice = await window.navigator.serial.requestPort({})
      } catch (e: any) {
        console.error(e)
        this.espLoaderTerminal.writeLine(`Error while selecting serial port: ${e.message}`)
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
      this.espLoaderTerminal.writeLine(`Successfully connected to ${this.connectedChip}`)
      console.debug(`Connected to ${this.connectedChip}`)
    } catch (e: any) {
      console.error(e)
      this.espLoaderTerminal.writeLine(`Error: ${e.message}`)
      return false
    }

    return true
  }

  serialDisconnect = async () => {
    if (this.serialTransport) {
      try {
        await this.serialTransport.disconnect()
        this.espLoaderTerminal.writeLine('Device disconnected successfully')
      } catch (e: any) {
        console.error(`Error while closing serial port: ${e.message}`)
        this.espLoaderTerminal.writeLine(`Error while closing serial port: ${e.message}`)
      }
    }

    this.connectedChip = ''
    this.serialDevice = null
    this.serialTransport = null
  }

  downloadFirmwareFromBackend = async (firmwareURL: string): Promise<boolean> => {
    try {
      const response = await axios.get(firmwareURL, {
        responseType: 'arraybuffer'
      })

      this.firmwareImage = response.data
    } catch (e: any) {
      console.error(e)
      this.espLoaderTerminal.writeLine(`Error while downloading firmware: ${e.message}`)
      return false
    }

    this.espLoaderTerminal.writeLine(`Firmware downloaded from ${firmwareURL}, length: ${this.firmwareImage.byteLength}`)
    console.debug('firmware is loaded', firmwareURL, this.firmwareImage.byteLength)

    return true
  }

  uploadFirmwareToMicrocontroller = async (): Promise<boolean> => {
    const flashOptionsFileArray = [
      {
        data: new Uint8Array(this.firmwareImage),
        address: 0x0
      },
      {
        data: this.preferencesImage,
        address: 0xBB000
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
        calculateMD5Hash: (image: Uint8Array) =>
          CryptoJS.MD5(
            CryptoJS.lib.WordArray.create(image as unknown as number[])
          ).toString()
      }

      await this.espLoader.writeFlash(flashOptions)
      await this.espLoader.after()
    } catch (e: any) {
      console.error(e)
      this.espLoaderTerminal.writeLine(`Error: ${e.message}`)
      return false
    }

    return true
  }

  createPreferencesImage = async (sensorParameters: SensorParameter[]): Promise<boolean> => {
    const preferencesFS = new LittleFSWASMPreferences(
      'nemok',
      (message: string) => { this.espLoaderTerminal.writeLine(message) }
    )

    for (const sensorParameter of sensorParameters) {
      console.debug('createPreferencesImage', sensorParameter)
      if (sensorParameter.value !== null) {
        try {
          preferencesFS.put(
            sensorParameter.key,
            sensorParameter.value,
            sensorParameter.type
          )

        } catch (error: any) {
          this.espLoaderTerminal.writeLine(`Error while adding values to preferences image: ${error.message}`)
          return false
        }
      }
    }

    this.preferencesImage = await preferencesFS.getLittleFSImage()

    return true
  }
}

export default FirmwareUploader
