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

      this.updateUIBasedOnAuthenticaton()
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

      this.updateUIBasedOnAuthenticaton()
      m.ModalHide('#modalUserAccountDialog')
    })
  }

  updateUIBasedOnAuthenticaton = () => {
    const btnUserAccountDialog = '#buttonOpenModalUserAccountDialog'
    const btnCreateNewProgram = '#buttonOpenModalCreateProgramDialog'

    if (this.customerCode) {
      m.SetText(btnUserAccountDialog, 'Update your Customer Code')
      m.RemoveClass(btnUserAccountDialog, 'btn-success')
      m.AddClass(btnUserAccountDialog, 'btn-secondary')

      m.RemoveClass(btnCreateNewProgram, 'btn-secondary')
      m.AddClass(btnCreateNewProgram, 'btn-success')
      m.FormInputEnable(btnCreateNewProgram)
    } else {
      m.SetText(btnUserAccountDialog, 'Enter your Customer Code')
      m.RemoveClass(btnUserAccountDialog, 'btn-secondary')
      m.AddClass(btnUserAccountDialog, 'btn-success')

      m.RemoveClass(btnCreateNewProgram, 'btn-success')
      m.AddClass(btnCreateNewProgram, 'btn-secondary')
      m.FormInputDisable(btnCreateNewProgram)
    }
  }

  getCustomerCode = (): string => {
    return this.customerCode
  }
}

export default UserAccount
