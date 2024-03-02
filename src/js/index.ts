import 'bootstrap/dist/css/bootstrap.min.css'

import { ESPLoader, LoaderOptions, FlashOptions, Transport } from 'esptool-js'
import { Terminal } from 'xterm'
import CryptoJS from 'crypto-js'

import JobSubmitter from './JobSubmitter'
import * as m from './lib/MQuery'
import { arrayBufferToString } from './lib/arrayBufferHelper'

let device: any = null
let transport: Transport
let chip: string = null
let esploader: ESPLoader
let term: Terminal

const jobSubmitter = new JobSubmitter() // eslint-disable-line no-unused-vars

window.addEventListener('load', () => {
  const elTerminal = document.getElementById('terminal')
  term = new Terminal()
  term.open(elTerminal)
})

const espLoaderTerminal = {
  clean () {
    term.clear()
  },
  writeLine (data: string) {
    term.writeln(data)
  },
  write (data: string) {
    term.write(data)
  }
}

m.OnClick('#buttonConnect', async () => {
  if (device === null) {
    try {
      // @ts-ignore
      device = await window.navigator.serial.requestPort({})
    } catch (e) {
      console.error(e)
      term.writeln(`Error while selecting serial port: ${e.message}`)
      return
    }

    transport = new Transport(device, true)
  }

  try {
    const flashOptions = {
      transport,
      baudrate: 115200,
      terminal: espLoaderTerminal
    } as LoaderOptions

    esploader = new ESPLoader(flashOptions)

    chip = await esploader.main()

    // Temporarily broken
    // await esploader.flashId();
    term.writeln(`Successfully connected to ${chip}`)
  } catch (e) {
    console.error(e)
    term.writeln(`Error: ${e.message}`)
  }

  console.debug(`Connected to ${chip}`)
})

m.OnClick('#buttonFlash', async () => {
  const elFileFirmware = document.getElementById('fileFirmware') as HTMLInputElement
  const fileFirmware: File = elFileFirmware.files[0]
  const firmwareBuf = await fileFirmware.arrayBuffer()
  const firmware = arrayBufferToString(firmwareBuf)

  const flashOptionsFileArray = [
    { data: firmware, address: 0x0 }
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

    await esploader.writeFlash(flashOptions)
  } catch (e) {
    console.error(e)
    term.writeln(`Error: ${e.message}`)
  }
})

m.OnClick('#buttonDisconnect', async () => {
  if (transport) {
    await transport.disconnect()
  }

  term.writeln('Device disconnected successfully')
})
