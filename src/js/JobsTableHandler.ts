import axios from 'axios'
import { DataTable } from 'simple-datatables'

import * as m from './lib/MQuery'
import FirmwareUploader from './FirmwareUploader'

class JobsTableHandler {
  selectorCustomerCode: string
  customerCode: string
  jobStatusPollingHandle: number
  jobStatusPollingInterval = 3000
  selectorJobsTable: string
  jobsTable: DataTable
  jobsTableColumnHeadings: string[]
  firmwareUploader: FirmwareUploader

  constructor (selectorCustomerCode: string, selectorJobsTable: string) {
    this.selectorCustomerCode = selectorCustomerCode
    this.selectorJobsTable = selectorJobsTable

    this.jobsTableColumnHeadings = ['isFirmware', 'status', 'updatedSecsAgo', 'parameters', 'jobId']

    window.addEventListener('load', () => {
      this.activateTable()
      this.activateEvents()
    })
  }

  cellRenderIsFirmware = (data: any, cell: object, dataIndex: number, cellIndex: number): string => {
    if (data[0].data === 'true') {
      return '<button type="button" class="btn btn-primary btn-sm jobsTableButtonUpload">Upload</button>'
    }

    return ' '
  }

  cellRenderJobId = (data: any, cell: object, dataIndex: number, cellIndex: number): string => {
    const jobId = data[0].data
    return `<a href="#" data-bs-toggle="tooltip" data-bs-title="${jobId}" class="jobsTableLinkJobId">jobId</a>`
  }

  activateTable = () => {
    const elementJobsTable: HTMLTableElement = document.querySelector(this.selectorJobsTable)
    this.jobsTable = new DataTable(elementJobsTable, {
      searchable: false,
      paging: false,
      columns: [
        {
          select: 0,
          sortable: false,
          render: this.cellRenderIsFirmware
        },
        {
          select: 1,
          sortable: true
        },
        {
          select: 2,
          sortable: true,
          sort: 'asc'
        },
        {
          select: 3,
          sortable: true
        },
        {
          select: 4,
          sortable: false,
          render: this.cellRenderJobId
        }
      ]
    })
  }

  activateEvents = () => {
    m.OnEvent(this.selectorCustomerCode, 'keyup', () => {
      this.customerCode = m.GetFormInputValue(this.selectorCustomerCode)
      this.startCountdownForNextJobStatusUpdate()
    })

    m.OnClick('.jobsTableLinkJobId', this.eventClickedJobsTableLinkJobId)

    m.OnClick('.jobsTableButtonUpload', async (event: MouseEvent) => {
      const elButton = event.target as HTMLElement
      const elRow = elButton.parentNode.parentNode
      const elJobIdLink = elRow.querySelector('[data-bs-title]')
      const jobId = elJobIdLink.getAttribute('data-bs-title')

      console.debug(jobId)

      const firmwareUploaded = await this.firmwareUploader.uploadFirmware(this.customerCode, jobId)
      if (!firmwareUploaded) {
        alert('Could not upload firmware for whatnot reason')
      }
    })
  }

  eventClickedJobsTableLinkJobId = (event: MouseEvent) => {
    event.preventDefault()
    const elLink = event.target as HTMLElement
    const jobId = elLink.getAttribute('data-bs-title')
    navigator.clipboard.writeText(jobId)
  }

  startCountdownForNextJobStatusUpdate = () => {
    this.cancelCountdownForNextJobStatusUpdate()

    if (this.jobStatusPollingHandle) {
      clearTimeout(this.jobStatusPollingHandle)
    }

    this.jobStatusPollingHandle = window.setTimeout(async () => { await this.doJobStatusPolling() }, this.jobStatusPollingInterval)
  }

  cancelCountdownForNextJobStatusUpdate = () => {
    if (this.jobStatusPollingHandle) {
      clearTimeout(this.jobStatusPollingHandle)
    }

    this.jobStatusPollingHandle = null
  }

  jobsTableRowValues = (rowObject: any): string[] => {
    const rowArray: string[] = []

    this.jobsTableColumnHeadings.forEach((heading: string, col: number) => {
      rowArray[col] = rowObject[heading]
    })

    return rowArray
  }

  jobsTableReplaceData = (newData: any) => {
    document.querySelectorAll('.tooltip').forEach(el => el.remove())
    this.jobsTable.data.data = []
    this.jobsTable.insert({ data: newData.map((item: any) => this.jobsTableRowValues(item)) })
    m.EnableTooltips()
  }

  doJobStatusPolling = async () => {
    try {
      const response = await axios.get('/api/customer/jobs', {
        headers: {
          'NemoK-CustomerCode': this.customerCode
        }
      })

      this.jobsTableReplaceData(response.data)

      this.startCountdownForNextJobStatusUpdate()
    } catch (error) {
      console.error(`Error while getting job status for customerCode ${this.customerCode}`, error)
      return
    }

    this.jobsTable.update()
  }
}

export default JobsTableHandler
