import axios from 'axios'
import { DataTable } from 'simple-datatables'
import timesago from 'timesago'

import * as m from './lib/MQuery'
import FirmwareUploader from './FirmwareUploader'

class JobsTableHandler {
  functionCustomerCode: Function
  jobStatusPollingHandle: number
  jobStatusPollingInterval = 3000
  selectorJobsTable: string
  jobsTable: DataTable
  jobsTableColumnHeadings: string[]
  firmwareUploader: FirmwareUploader

  constructor (selectorJobsTable: string, functionCustomerCode: Function) {
    this.selectorJobsTable = selectorJobsTable
    this.functionCustomerCode = functionCustomerCode

    this.jobsTableColumnHeadings = ['isFirmware', 'status', 'updatedSecsAgo', 'parameters', 'jobId', 'updatedSecsAgo']

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

  cellRenderUpdateSecsAgo = (data: any, cell: object, dataIndex: number, cellIndex: number): string => {
    return timesago(Date.now() - (data[0].data * 1000))
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
      sortable: false,
      columns: [
        {
          select: 0,
          render: this.cellRenderIsFirmware
        },
        {
          select: 1
        },
        {
          select: 2,
          render: this.cellRenderUpdateSecsAgo
        },
        {
          select: 3
        },
        {
          select: 4,
          render: this.cellRenderJobId
        },
        {
          select: 5,
          sort: 'asc',
          hidden: true
        }
      ]
    })
  }

  activateEvents = () => {
    this.startCountdownForNextJobStatusUpdate()

    m.OnClick('.jobsTableLinkJobId', this.eventClickedJobsTableLinkJobId)

    m.OnClick('.jobsTableButtonUpload', async (event: MouseEvent) => {
      const elButton = event.target as HTMLElement
      const elRow = elButton.parentNode.parentNode
      const elJobIdLink = elRow.querySelector('[data-bs-title]')
      const jobId = elJobIdLink.getAttribute('data-bs-title')

      const firmwareUploaded = await this.firmwareUploader.uploadFirmware(this.functionCustomerCode(), jobId)
      if (firmwareUploaded) {
        alert('Program uploaded successfully.')
      } else {
        alert('Could not upload firmware. See terminal for detailed error messages.')
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

    this.jobsTable.update()
  }

  doJobStatusPolling = async () => {
    const customerCode = this.functionCustomerCode()

    if (!customerCode) {
      this.startCountdownForNextJobStatusUpdate()
      return
    }

    try {
      const response = await axios.get('/api/customer/jobs', {
        headers: {
          'NemoK-CustomerCode': customerCode
        }
      })

      this.jobsTableReplaceData(response.data)
    } catch (error) {
      console.error(`Error while getting job status for customerCode ${customerCode}`, error)
      this.jobsTableReplaceData([])
    }

    this.startCountdownForNextJobStatusUpdate()
  }
}

export default JobsTableHandler
