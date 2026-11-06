import axios from 'axios'
import { Buffer } from 'buffer'
import CryptoJS from 'crypto-js'
import { ESPLoader, LoaderOptions, FlashOptions, Transport, IEspLoaderTerminal } from 'esptool-js'
import { createLittleFS, formatDiskVersion, DISK_VERSION_2_0, DISK_VERSION_2_1 } from 'littlefs-wasm'

class FirmwareUploader {
  static readonly ESP01_FLASHSIZE = "1MB"

  serialDevice: any
  serialTransport: Transport | null
  espLoader: ESPLoader
  espLoaderTerminal: IEspLoaderTerminal
  connectedChip: string
  firmwareImage: ArrayBuffer

  constructor(espLoaderTerminal: IEspLoaderTerminal) {
    this.serialDevice = null
    this.serialTransport = null
    this.connectedChip = ''
    this.espLoaderTerminal = espLoaderTerminal
    this.firmwareImage = new ArrayBuffer()
  }

  uploadFirmware = async (firmwareURL: string): Promise<boolean> => {
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

  getTestLittleFSImage = async (): Promise<Uint8Array<ArrayBufferLike>> => {
    console.debug('creating fs')
    const fs = await createLittleFS({
      blockSize: 4096,
      blockCount: 64,
      formatOnInit: true,
      // diskVersion: DISK_VERSION_2_0,
    })

    console.debug(
      'littlefs-wasm disk versions',
      `DISK_VERSION_2_0: ${DISK_VERSION_2_0}`,
      `DISK_VERSION_2_1: ${DISK_VERSION_2_1}`,
      `current disk version: ${ fs.getDiskVersion() }`,
    )

    console.debug('making directories')
    fs.mkdir('/nvs')
    fs.mkdir('/nvs/testapp')

    fs.writeFile('/test.txt', 'This is from mklittlefs-wasm!')

    const intBuffer = Buffer.alloc(4);
    intBuffer.writeInt32LE(42, 0);
    fs.writeFile('/nvs/testapp/testint', intBuffer)

    console.debug('writing teststr')
    fs.writeFile('/nvs/testapp/teststr', 'Hello wasm!')

    console.log('littlefs-wasm files', fs.list("/"))
    console.log('littlefs-wasm disk version:', formatDiskVersion(fs.getDiskVersion()))

    const image = fs.toImage()
    fs.destroy()

    return image
  }

  uploadFirmwareToMicrocontroller = async (): Promise<boolean> => {
    this.espLoaderTerminal.write('Creating littlefs image...')
    const littleFSImage = await this.getTestLittleFSImage()
    // await this.getTestLittleFSImage()
    this.espLoaderTerminal.writeLine('done')

    const hex = (bytes: Uint8Array) =>
      Array.from(bytes, b => b.toString(16).padStart(2, "0")).join(" ")

    console.log("littlefs-wasm 32 bytes", hex(littleFSImage.subarray(0, 32)))

    const flashOptionsFileArray = [
      {
        data: new Uint8Array(this.firmwareImage),
        address: 0x0
      },
      {
        data: littleFSImage,
        address: 0xBB000
      }
    ]

    try {
      const flashOptions: FlashOptions = {
        fileArray: flashOptionsFileArray,
        eraseAll: false,
        compress: true,
        flashMode: 'keep',
        flashFreq: 'keep',
        flashSize: FirmwareUploader.ESP01_FLASHSIZE,
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
}

export default FirmwareUploader
