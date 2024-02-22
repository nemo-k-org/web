import * as bootstrap from 'bootstrap'

interface MQueryEventHandler {
  selector: string,
  eventType: string,
  eventListenerFn: Function
}

let MQueryEventHandlers: MQueryEventHandler[]
let MQueryBootstrapModals: Map<string, bootstrap.Modal>

export const SetText = (selector: string, newText: string) => {
  const elements = document.querySelectorAll<HTMLElement>(selector)
  elements.forEach((element) => { element.innerText = newText })
}

export const GetText = (selector: string): string => {
  let text = null

  const elements = document.querySelectorAll<HTMLElement>(selector)
  elements.forEach((element) => { text = element.innerText })

  return text
}

export const SetHTML = (selector: string, newHTML: string) => {
  const elements = document.querySelectorAll<HTMLElement>(selector)
  elements.forEach((element) => { element.innerHTML = newHTML })
}

export const Hide = (selector: string) => {
  const elements = document.querySelectorAll<HTMLElement>(selector)
  elements.forEach((element) => { element.style.display = 'none' })
}

export const Show = (selector: string) => {
  const elements = document.querySelectorAll<HTMLElement>(selector)
  elements.forEach((element) => {
    if (element.tagName === 'A') {
      element.style.display = 'inline'
    } else {
      element.style.display = 'block'
    }
  })
}

const initialiseMQueryBootstrapModals = () => {
  MQueryBootstrapModals = new Map()
}

export const ModalShow = (selector: string) => {
  if (MQueryBootstrapModals === undefined) {
    initialiseMQueryBootstrapModals()
  }

  const elements = Array.from(document.querySelectorAll(selector))
  elements.forEach((element) => {
    let modal = MQueryBootstrapModals.get(element.id)

    if (modal === undefined) {
      modal = new bootstrap.Modal(element)
      MQueryBootstrapModals.set(element.id, modal)
    }

    modal.show()
  })
}

export const ModalHide = (selector: string) => {
  if (MQueryBootstrapModals === undefined) {
    initialiseMQueryBootstrapModals()
  }

  const elements = Array.from(document.querySelectorAll(selector))
  elements.forEach((element) => {
    const modal = MQueryBootstrapModals.get(element.id)

    if (modal !== undefined) {
      modal.hide()
    }
  })
}

export const ModalOnShow = (selector: string, onShowFunction: Function) => {
  const elements = Array.from(document.querySelectorAll(selector))
  elements.forEach((element) => {
    element.addEventListener('shown.bs.modal', () => { onShowFunction() })
  })
}

export const Collapse = (selector: string) => {
  const collapseElementList = [].slice.call(document.querySelectorAll(selector))
  collapseElementList.map(function (collapseEl: HTMLElement) {
    return new bootstrap.Collapse(collapseEl)
  })
}

const intialiseMQueryEventHandlers = (eventType: string) => {
  if (MQueryEventHandlers === undefined) {
    MQueryEventHandlers = []
  }

  let eventListenerAlreadyCreated = false

  MQueryEventHandlers.forEach((handler: MQueryEventHandler) => {
    if (handler.eventType === eventType) {
      eventListenerAlreadyCreated = true
    }
  })

  if (!eventListenerAlreadyCreated) {
    document.addEventListener(eventType, mQueryEventHandler)
  }
}

const mQueryEventHandler = (event: MouseEvent) => {
  MQueryEventHandlers.forEach((handler: MQueryEventHandler) => {
    if (handler.eventType !== event.type) {
      return
    }

    // @ts-ignore
    if (event.target.matches(handler.selector)) {
      handler.eventListenerFn(event)
    }

    const el: HTMLElement = <HTMLElement>event.target
    if (el.parentElement && el.parentElement.matches(handler.selector)) {
      handler.eventListenerFn(event)
    }
  })
}

export const OnClick = (selector: string, clickFn: Function) => {
  OnEvent(selector, 'click', clickFn)
}

export const OnEvent = (selector: string, eventType: string, clickFn: Function) => {
  intialiseMQueryEventHandlers(eventType)

  MQueryEventHandlers.push({ selector: selector, eventType: eventType, eventListenerFn: clickFn })
}

export const FormInputDisable = (selector: string) => {
  const elements = Array.from(document.querySelectorAll<HTMLInputElement>(selector))
  elements.forEach((element) => { element.disabled = true })
}

export const FormInputEnable = (selector: string) => {
  const elements = Array.from(document.querySelectorAll<HTMLInputElement>(selector))
  elements.forEach((element) => { element.disabled = false })
}

export const GetFormInputValue = (selector: string): string => {
  let value: string

  const elements = Array.from(document.querySelectorAll<HTMLInputElement>(selector))
  elements.forEach((element) => { value = element.value })

  return value
}

export const SetFormInputValue = (selector: string, value: string) => {
  const elements = Array.from(document.querySelectorAll<HTMLInputElement>(selector))
  elements.forEach((element) => { element.value = value })
}

export const AddClass = (selector: string, cssClass: string) => {
  const elements = Array.from(document.querySelectorAll<HTMLInputElement>(selector))
  elements.forEach((element) => element.classList.add(cssClass))
}

export const RemoveClass = (selector: string, cssClass: string) => {
  const elements = Array.from(document.querySelectorAll<HTMLInputElement>(selector))
  elements.forEach((element) => element.classList.remove(cssClass))
}

export const GetAttribute = (selector: string, attribute: string): string => {
  let value: string

  const elements = Array.from(document.querySelectorAll<HTMLElement>(selector))
  elements.forEach((element) => { value = element.getAttribute(attribute) })

  return value
}

export const Remove = (selector: string) => {
  const elements = Array.from(document.querySelectorAll<HTMLElement>(selector))
  elements.forEach((element) => element.remove())
}

export const IsNumeric = (value: string | number): boolean => {
  if (typeof (value) === 'number') {
    return true
  }

  const valInt = parseInt(value)
  const valIntStr = valInt.toString()

  if (value === valIntStr) {
    return true
  }

  return false
}

// Enable Bootstrap.js tooltip with given selector
export const EnableTooltips = (selector?: string) => {
  if (selector === undefined) {
    selector = '[data-bs-toggle="tooltip"]'
  }

  const tooltipTriggerList = [].slice.call(document.querySelectorAll(selector))
  tooltipTriggerList.map(function (tooltipTriggerEl: any) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })
}
