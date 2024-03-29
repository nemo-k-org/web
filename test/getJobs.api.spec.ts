import { test, expect, request } from '@playwright/test'
import { UtilDatabase } from './util/UtilDatabase'
import fs from 'fs'

import { CUSTOMER_EMAIL, LOCAL_SETTINGS } from './constants'

test.afterAll(async () => {
    const utilDatabase = new UtilDatabase(CUSTOMER_EMAIL)
    await utilDatabase.getDatabaseSettingsFromLocalSettingsFile(LOCAL_SETTINGS)
    await utilDatabase.removeTestCustomersAndJobs()
})

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

    const responseQueryWithEmptyCustomerCode = await request.get(`jobs/${jobId}/status`, { data: {customerCode: '' }})
    expect(responseQueryWithEmptyCustomerCode.status()).toBe(404)

    const responseQueryWithWrongCustomerCode = await request.get(`jobs/${jobId}/status`, { data: {customerCode: customerDataMalicious.customerCode }})
    expect(responseQueryWithWrongCustomerCode.status()).toBe(401)

    const responseQueryWithCustomerCode = await request.get(`jobs/${jobId}/status`, { data: { customerCode: customerData.customerCode }})
    expect(responseQueryWithCustomerCode.ok()).toBeTruthy()
    expect(JSON.parse(await responseQueryWithCustomerCode.text())).toBe('submitted')
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

    const responseStatus = await request.get(`jobs/${jobId}/status`, { data: params })
    expect(responseStatus.ok()).toBeTruthy()
    expect(JSON.parse(await responseStatus.text())).toBe('received')
  
})