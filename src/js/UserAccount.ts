import * as m from './lib/MQuery'

class UserAccount {
  customerCode: string

  constructor () {
    window.addEventListener('load', () => {
      this.activateEvents()

      if (localStorage.getItem('customerCode')) {
        const oldCustomerCode = localStorage.getItem('customerCode')
        m.SetFormInputValue('#customerCode', oldCustomerCode)
        this.customerCode = oldCustomerCode
      }

      this.updateModalButtonText()
    })
  }

  activateEvents = () => {
    m.OnClick('#buttonOpenModalUserAccountDialog', () => {
      m.ModalShow('#modalUserAccountDialog')
    })

    m.OnClick('#buttonUseCustomerCode', () => {
      const newCustomerCode = m.GetFormInputValue('#customerCode')
      localStorage.setItem('customerCode', newCustomerCode)
      this.customerCode = newCustomerCode

      this.updateModalButtonText()
      m.ModalHide('#modalUserAccountDialog')
    })
  }

  updateModalButtonText = () => {
    const btnSelector = '#buttonOpenModalUserAccountDialog'

    if (this.customerCode) {
      m.SetText(btnSelector, 'Update your Customer Code')
      m.RemoveClass(btnSelector, 'btn-success')
      m.AddClass(btnSelector, 'btn-secondary')
    } else {
      m.SetText(btnSelector, 'Enter your Customer Code')
      m.RemoveClass(btnSelector, 'btn-secondary')
      m.AddClass(btnSelector, 'btn-success')
    }
  }

  getCustomerCode = (): string => {
    return this.customerCode
  }
}

export default UserAccount
