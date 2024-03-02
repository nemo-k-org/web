import * as m from './lib/MQuery'

class Tabs {
  constructor () {
    window.addEventListener('load', () => {
      this.activateButtons()
      this.activateTab('#tabButtonSubmit', '#tabSubmit')
    })
  }

  activateButtons = () => {
    m.OnClick('#tabButtonSubmit', () => {
      this.activateTab('#tabButtonSubmit', '#tabSubmit')
    })

    m.OnClick('#tabButtonFlash', () => {
      this.activateTab('#tabButtonFlash', '#tabFlash')
    })
  }

  activateTab = (tabButtonSelector: string, tabSelector: string) => {
    m.RemoveClass('.nav-link', 'active')
    m.AddClass(tabButtonSelector, 'active')

    m.Hide('.tabArea')
    m.Show(tabSelector)
  }
}

export default Tabs
