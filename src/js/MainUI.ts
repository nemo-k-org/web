import * as m from './lib/MQuery'
import FirmwareUploader from './Component/FirmwareUploader'

class MainUI {
  firmwareUploader: FirmwareUploader

  constructor () {
    this.firmwareUploader = new FirmwareUploader()

    window.addEventListener('load', () => {
      this.activateButtons()
    })
  }

  activateButtons = () => {
    m.OnClick('#buttonToggleDebugTerminal', (event: MouseEvent) => {
      event.preventDefault()
      this.toggleDebugTerminalVisibility()
    })
  }

  toggleDebugTerminalVisibility = () => {
    const elPanelTerminal = document.getElementById('panelDebugTerminal')
    if (elPanelTerminal.style.display === 'block') {
      m.Hide('#panelDebugTerminal')
    } else {
      m.Show('#panelDebugTerminal')
      document.getElementById('panelDebugTerminal').scrollIntoView()
      setTimeout(() => { document.getElementById('panelDebugTerminal').scrollIntoView() }, 1000)
    }
  }

  firmwareUploadMessage = (data: string) => {
    m.ModalShow('#modalUploadFirmwareProgressDialog')
    m.SetText('#messageUploadFirmwareProgress', data)
  }
}

export default MainUI
