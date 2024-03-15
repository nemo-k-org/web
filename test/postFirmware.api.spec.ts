import { test, expect, request } from '@playwright/test'
import { UtilDatabase } from './util/UtilDatabase'
import fs from 'fs'

test('firmware upload should give 404 if no job id in url', async ({ request }) => {
    const noData = await request.post('jobs/firmware', {})
    expect(noData.status()).toBe(404)
})

test('firmware upload should give 404 if job id missing', async ({ request }) => {
    const noData = await request.post('jobs//firmware', {})
    expect(noData.status()).toBe(404)
})

test('firmware upload should give error if no zip file given', async ({ request }) => {
    const utilDatabase = new UtilDatabase()
    const customerData = await utilDatabase.addCustomer()
    expect(customerData.customerId).toBeGreaterThan(0)

    const jobId = await utilDatabase.addJob(customerData.customerId)

    expect(jobId).not.toBe('')
    expect(jobId).not.toBeNull()

    const noData = await request.post(`jobs/${jobId}/firmware`, {
        data: {}
    })
    expect(noData.status()).toBe(551)
})

test('firmware upload should check zip and its content', async () => {
    const utilDatabase = new UtilDatabase()
    const customerData = await utilDatabase.addCustomer()

    expect(customerData.customerId).toBeGreaterThan(0)

    const jobId = await utilDatabase.addJob(customerData.customerId)

    const testCases = [
        ['test/resources/nemo-k-firmware-nohashfile.zip', 551],
        ['test/resources/nemo-k-firmware-tampered.zip', 551],
        ['test/resources/nemo-k-firmware-badhashfile.zip', 551],
        ['test/resources/nemo-k-firmware-nobinfile.zip', 551],
        ['test/resources/nemo-k-firmware-nozip.zip', 551],
        ['test/resources/nemo-k-firmware-ok.zip', 200],
    ]

    const params = {
        customerCode: customerData.customerCode
    }

    const apiContext = await request.newContext()

    for (const testCase of testCases) {
        const zip = fs.readFileSync(testCase[0])

        const response = await apiContext.post(`jobs/${jobId}/firmware`, {
            headers: { ContentType: 'multipart/form-data' },
            multipart: {
                firmware: {
                    name: 'firmware.zip',
                    mimeType: 'application/zip',
                    buffer: zip
                }
            }
        })

        expect(response.status(), { message: testCase[0] as string }).toBe(testCase[1])
    }
})
