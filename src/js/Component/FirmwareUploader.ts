import axios from 'axios'
import { Buffer } from 'buffer'
import CryptoJS from 'crypto-js'
import { ESPLoader, LoaderOptions, FlashOptions, Transport, IEspLoaderTerminal } from 'esptool-js'
import createLittleFS from 'littlefs'

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

  getTestLittleFSImage = async (): Promise<Uint8Array> => {
    console.debug('creating fs')

    const BLOCK_SIZE = 4096;
    const PROG_SIZE = 256;
    const BLOCK_COUNT = 64;

    // const littlefs = await createLittleFS({locateFile: () => '/littlefs.wasm'})
    const littlefs = await createLittleFS({locateFile: () => '/littlefs.wasm'})

    console.debug('littlefs has _lfs_make_dir', typeof littlefs._lfs_make_dir)
    const flash = new Uint8Array(BLOCK_SIZE * BLOCK_COUNT);

    const flashRead = (
      _cfg: number,
      block: number,
      offset: number,
      buffer: number,
      size: number,
    ): number => {
      const start = block * BLOCK_SIZE + offset;
      littlefs.HEAPU8.set(flash.subarray(start, start + size), buffer);
      return 0;
    };

    const flashProg = (
      _cfg: number,
      block: number,
      offset: number,
      buffer: number,
      size: number,
    ): number => {
      const start = block * BLOCK_SIZE + offset;
      flash.set(littlefs.HEAPU8.subarray(buffer, buffer + size), start);
      return 0;
    };

    const flashErase = (_cfg: number, block: number): number => {
      const start = block * BLOCK_SIZE;
      flash.fill(0xff, start, start + BLOCK_SIZE);
      return 0;
    };

    const flashSync = (_cfg: number): number => {
      console.debug('flashSync cfg', _cfg)
      return 0
    };

    const readFn = littlefs.addFunction(flashRead, "iiiiii")
    const progFn = littlefs.addFunction(flashProg, "iiiiii")
    const eraseFn = littlefs.addFunction(flashErase, "iii")
    const syncFn = littlefs.addFunction(flashSync, "ii")

    const config = littlefs._new_lfs_config(
      readFn,
      progFn,
      eraseFn,
      syncFn,
      BLOCK_COUNT,
      BLOCK_SIZE,
      PROG_SIZE,
    )

    this.espLoaderTerminal.write('Creating littlefs... ')
    const lfs = littlefs._new_lfs()

    this.espLoaderTerminal.write('formatting... ')
    littlefs._lfs_format(lfs, config)

    this.espLoaderTerminal.write('mounting... ')
    littlefs._lfs_mount(lfs, config)

    this.espLoaderTerminal.write('creating directories... ')
    const mkdir = littlefs.cwrap(
      'lfs_make_dir',
      'number',
      ['number', 'string']
    )

    const result_mkdirNvs: number = mkdir(lfs, 'nvs')
    if (result_mkdirNvs < 0) {
      throw new Error(`mkdir returns error code: ${result_mkdirNvs}`)
    }

    const result_mkdirTestapp: number = mkdir(lfs, 'nvs/testapp')
    if (result_mkdirTestapp < 0) {
      throw new Error(`mkdir returns error code: ${result_mkdirTestapp}`)
    }

    this.espLoaderTerminal.write('writing files... ')
    const fileWrite = littlefs.cwrap(
      'lfs_write_file',
      ['number'],
      ['number', 'string', 'string', 'number']
    )

    const fileData = 'Hello from new littlefs!\n'
    fileWrite(lfs, 'test.txt', fileData, fileData.length)

    const fileData2 = 'test string'
    fileWrite(lfs, 'nvs/testapp/teststr', fileData2, fileData2.length)

    const fileData3 = Buffer.alloc(4)
    fileData3.writeInt32LE(42, 0)
    fileWrite(lfs, 'nvs/testapp/testint', fileData3.toString(), fileData3.length)

    this.espLoaderTerminal.write('unmounting... ')
    littlefs._lfs_unmount(lfs)

    this.espLoaderTerminal.writeLine('done')

    return flash
  }

  getTestLittleFSImageHTTP = async (): Promise<Uint8Array> => {
    const response = await fetch("http://localhost:8000/littlefs.bin", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching littlefs.bin`);
    }

    const image = new Uint8Array(await response.arrayBuffer());

    if (image.byteLength !== 262144) {
      throw new Error(`Expected 262144 bytes, got ${image.byteLength}`);
    }

    console.log(`Fetched ${image.byteLength} bytes`);

    return image
  }

  uploadFirmwareToMicrocontroller = async (): Promise<boolean> => {
    this.espLoaderTerminal.write('Creating littlefs image...')
    const littleFSImage = await this.getTestLittleFSImage()
    // const littleFSImage = await this.getTestLittleFSImageHTTP()
    // await this.getTestLittleFSImage()
    this.espLoaderTerminal.writeLine('done')

    const hex = (bytes: Uint8Array) =>
      Array.from(bytes, b => b.toString(16).padStart(2, "0")).join(" ")

    console.log("littlefs-wasm 32 bytes", hex(littleFSImage.subarray(0, 32)))
    console.log("littlefs-wasm image size", littleFSImage.length)

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
