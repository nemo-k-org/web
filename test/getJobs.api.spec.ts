import { test, expect, request } from '@playwright/test'
import { UtilDatabase, JobStatus } from './util/UtilDatabase'
import fs from 'fs'

import { CUSTOMER_EMAIL, LOCAL_SETTINGS } from './constants'

test('job submission should respond with correct status', async ({ request }) => {
    const utilDatabase = new UtilDatabase(CUSTOMER_EMAIL)
    await utilDatabase.getDatabaseSettingsFromLocalSettingsFile(LOCAL_SETTINGS)
    const customerData = await utilDatabase.addCustomer()

    expect(customerData.customerId).toBeGreaterThan(0)

    const customerDataMalicious = await utilDatabase.addCustomer()
    expect(customerDataMalicious.customerId).toBeGreaterThan(0)

    const params = {
        customerCode: customerData.customerCode,
        jobParameters: {
            nemok_sensor_test_http: 1,
            nemok_wifi_ssid: 'test-ssid',
            nemok_wifi_pass: 'test-pass'
        }
    }

    const responseJobSubmit = await request.post('jobs', { data: params })
    expect(responseJobSubmit.ok()).toBeTruthy()

    const jobId = JSON.parse(await responseJobSubmit.text())

    const responseQueryWithoutCustomerCode = await request.get(`jobs/${jobId}/status`)
    expect(responseQueryWithoutCustomerCode.status()).toBe(404)

    const responseQueryWithEmptyCustomerCode = await request.get(`jobs/${jobId}/status`, { headers: {'NemoK-CustomerCode': '' }})
    expect(responseQueryWithEmptyCustomerCode.status()).toBe(404)

    const responseQueryWithWrongCustomerCode = await request.get(`jobs/${jobId}/status`, { headers: {'NemoK-CustomerCode': customerDataMalicious.customerCode }})
    expect(responseQueryWithWrongCustomerCode.status()).toBe(401)

    const responseQueryWithCustomerCode = await request.get(`jobs/${jobId}/status`, { headers: { 'NemoK-CustomerCode': customerData.customerCode }})
    expect(responseQueryWithCustomerCode.ok()).toBeTruthy()
    expect(JSON.parse(await responseQueryWithCustomerCode.text())).toBe('submitted')
})

const jobIdsToResponseArray = (jobIds: string[], status: JobStatus): any => {
    const response: any[] = []

    jobIds.forEach((jobId) => {
        response.push({
            jobId: jobId,
            parameters: JSON.stringify({'TEST_CASE': '1'}),
            status: status
        })
    })

    return response
}

test('jobs listing works all right', async ({ request }) => {
    const utilDatabase = new UtilDatabase(CUSTOMER_EMAIL)
    await utilDatabase.getDatabaseSettingsFromLocalSettingsFile(LOCAL_SETTINGS)

    const customerData = await utilDatabase.addCustomer()
    expect(customerData.customerId).toBeGreaterThan(0)
    const jobIds: string[] = []

    const numberOfJobs = Math.floor((Math.random()*5)+3)
    expect(numberOfJobs).toBeGreaterThan(1)
    for (let n=0; n < numberOfJobs; n++ ) {
        jobIds[n] = await utilDatabase.addJob(customerData.customerId)
        await utilDatabase.addStatus(jobIds[n], 'created')
    }
    expect(jobIds.length).toBe(numberOfJobs)

    const responseInitial = await request.get(`customer/jobs`, { headers: {'NemoK-CustomerCode': customerData.customerCode }})
    const jobsInitial = await responseInitial.json()
    expect(jobsInitial).toBeTruthy()
    expect(jobsInitial.length).toBe(jobIds.length)

    jobIdsToResponseArray(jobIds, 'created').forEach((jobId: any) => {
        expect(jobsInitial).toEqual(expect.arrayContaining([jobId]))
    })

    const zip = fs.readFileSync('test/resources/nemo-k-firmware-ok.zip')

    const responseReceived = await request.post(`jobs/${jobIds[1]}/firmware`, {
        headers: { ContentType: 'multipart/form-data' },
        multipart: {
            firmware: {
                name: 'firmware.zip',
                mimeType: 'application/zip',
                buffer: zip
            }
        }
    })
    expect(responseReceived.ok()).toBeTruthy()

    const responseAfterFirmwareUpload = await request.get(`customer/jobs`, { headers: {'NemoK-CustomerCode': customerData.customerCode }})
    const jobsAfterFirmwareUpload = await responseAfterFirmwareUpload.json()
    expect(jobsAfterFirmwareUpload).toBeTruthy()
    expect(jobsAfterFirmwareUpload.length).toBe(jobIds.length)

    let jobs = jobIdsToResponseArray(jobIds, 'created')
    for (let n=0; n < jobs.length; n++ ) {
        if (n == 1) {
            jobs[n].status = 'received'
        }

        expect(jobsAfterFirmwareUpload).toEqual(expect.arrayContaining([jobs[n]]))
    }
})

test('firmware post should response with correct status', async ({ request}) => {
    const utilDatabase = new UtilDatabase(CUSTOMER_EMAIL)
    await utilDatabase.getDatabaseSettingsFromLocalSettingsFile(LOCAL_SETTINGS)
    const customerData = await utilDatabase.addCustomer()

    expect(customerData.customerId).toBeGreaterThan(0)

    const jobId = await utilDatabase.addJob(customerData.customerId)

    const zip = fs.readFileSync('test/resources/nemo-k-firmware-ok.zip')

    const responsePostFirmware = await request.post(`jobs/${jobId}/firmware`, {
        headers: { ContentType: 'multipart/form-data' },
        multipart: {
            firmware: {
                name: 'firmware.zip',
                mimeType: 'application/zip',
                buffer: zip
            }
        }
    })

    const params = {
        customerCode: customerData.customerCode
    }

    const responseStatus = await request.get(`jobs/${jobId}/status`, { headers: {'NemoK-CustomerCode': customerData.customerCode }})
    expect(responseStatus.ok()).toBeTruthy()
    expect(JSON.parse(await responseStatus.text())).toBe('received')
  
})