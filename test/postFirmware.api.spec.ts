import { test, expect, request } from '@playwright/test'
import { UtilDatabase } from './util/UtilDatabase'
import fs from 'fs'
import * as crypto from 'crypto'

import { CUSTOMER_EMAIL, LOCAL_SETTINGS } from './constants'

test('firmware upload should give 404 if no job id in url', async ({ request }) => {
    const noData = await request.post('jobs/firmware', {})
    expect(noData.status()).toBe(404)
})

test('firmware upload should give 404 if job id missing', async ({ request }) => {
    const noData = await request.post('jobs//firmware', {})
    expect(noData.status()).toBe(404)
})

test('firmware upload should give error if no zip file given', async ({ request }) => {
    const utilDatabase = new UtilDatabase(CUSTOMER_EMAIL)
    await utilDatabase.getDatabaseSettingsFromLocalSettingsFile(LOCAL_SETTINGS)
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
    const utilDatabase = new UtilDatabase(CUSTOMER_EMAIL)
    await utilDatabase.getDatabaseSettingsFromLocalSettingsFile(LOCAL_SETTINGS)
    const customerData = await utilDatabase.addCustomer()

    expect(customerData.customerId).toBeGreaterThan(0)

    const jobId = await utilDatabase.addJob(customerData.customerId)

    const testCases = [
        ['test/resources/nemo-k-firmware-nohashfile.zip', 551],
        ['test/resources/nemo-k-firmware-tampered.zip', 551],
        ['test/resources/nemo-k-firmware-badhashfile.zip', 551],
        ['test/resources/nemo-k-firmware-nobinfile.zip', 551],
        ['test/resources/nemo-k-firmware-nozip.zip', 551],
        ['test/resources/nemo-k-firmware-ok.zip', 200, 'af505aeb4ae81f0ca8e988e25ff4f41ed8effe57fb1d1148c29a317c7e234024'],
    ]

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

        if (testCase[1] === 200) {
            const responseDownloadWithoutCustomerCode = await apiContext.get(`jobs/${jobId}/firmware`)
            expect(responseDownloadWithoutCustomerCode.status()).toBe(404)

            const responseDownload = await apiContext.get(`jobs/${jobId}/firmware`, {
                headers: {
                    'NemoK-CustomerCode': customerData.customerCode
                }
            })

            const firmware = await responseDownload.body()

            const hashAsString = crypto.createHash('sha256').update(firmware).digest('hex')
            expect(hashAsString, {message: `${testCase[0]}, ${jobId}` }).toBe(testCase[2])
        }
    }
})
