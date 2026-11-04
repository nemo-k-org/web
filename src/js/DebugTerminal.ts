import { IEspLoaderTerminal } from 'esptool-js'
import { Terminal } from 'xterm'

import * as m from './lib/MQuery'

class DebugTerminal {
  idTerminal: string
  idButtonToggleTerminal: string
  idPanelDebugTerminal: string
  serialTerminal: Terminal | null
  espLoaderTerminal: IEspLoaderTerminal

  constructor () {
    this.idTerminal = 'terminal'
    this.idButtonToggleTerminal = 'buttonToggleDebugTerminal'
    this.idPanelDebugTerminal = 'panelDebugTerminal'
    this.serialTerminal = null

    this.espLoaderTerminal = {
      clean: () => {
        if (this.serialTerminal) {
          this.serialTerminal.clear()
        }
        this.firmwareUploadProgress(0)
      },
      writeLine: (data: string) => {
        if (this.serialTerminal) {
          this.serialTerminal.writeln(data)
        }
        this.firmwareUploadMessage(data)
      },
      write: (data: string) => {
        if (this.serialTerminal) {
          this.serialTerminal.write(data)
        }
        this.firmwareUploadMessage(data)
      }
    }

    window.addEventListener('load', () => {
      console.debug('activating things')
      this.activateTerminal()
      this.activateButtons()
    })
  }

  activateTerminal = () => {
    const elTerminal = document.getElementById(this.idTerminal)
    if (elTerminal) {
      this.serialTerminal = new Terminal()
      this.serialTerminal.open(elTerminal)
    }
  }

  activateButtons = () => {
    m.OnClick(`#${this.idButtonToggleTerminal}`, (event: MouseEvent) => {
      event.preventDefault()
      this.toggleDebugTerminalVisibility()
    })
  }

  toggleDebugTerminalVisibility = () => {
    console.debug('toggleDebugTerminal')
    const elPanelTerminal = document.getElementById(this.idPanelDebugTerminal)
    if (elPanelTerminal) {
      if (elPanelTerminal.style.display === 'block') {
        m.Hide('#panelDebugTerminal')
      } else {
        m.Show('#panelDebugTerminal')
        elPanelTerminal.scrollIntoView()
        setTimeout((el: HTMLElement) => { el.scrollIntoView() }, 1000, elPanelTerminal)
      }
    }
  }

  firmwareUploadProgress = (percent: number) => {
    console.debug(`firmwareUploadProgress: ${percent}`)
  }

  firmwareUploadMessage = (message: string) => {
    console.debug(`firmwareUploadMessage: ${message}`)
  }
}

export default DebugTerminal
