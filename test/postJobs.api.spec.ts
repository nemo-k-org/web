import { test, expect, request } from '@playwright/test'
import { env } from 'node:process'
import { UtilDatabase } from './util/UtilDatabase'

test('should give 404 if no authorisation sent', async ({ request }) => {
    const noData = await request.post('jobs', {})
    expect(noData.status()).toBe(404)
})

test('should give 404 if nonexisting authorisation sent', async ({ request }) => {
    const noData = await request.post('jobs', {
        data: {
            customerCode: 'foo-bar'
        }
    })
    expect(noData.status()).toBe(404)
})

test('should require a defined set of parameters', async () => {
    const utilDatabase = new UtilDatabase()
    const customerData = await utilDatabase.addCustomer()
    expect(customerData.customerId).toBeGreaterThan(0)

    const testGrid = [
        {
            params: {
                customerCode: customerData.customerCode,
            },
            expectedStatus: 550,
            case: 'missing jobParameters'
        },
        {
            params: {
                customerCode: customerData.customerCode,
                jobParameters: {
                    nemok_sensor_test_http: 1
                }
            },
            expectedStatus: 550,
            case: 'task needs more parameters'
        },
        {
            params: {
                customerCode: customerData.customerCode,
                jobParameters: {
                    nemok_sensor_test_http: 1,
                    nemok_wifi_ssid: 'test-ssid'
                }
            },
            expectedStatus: 550,
            case: 'task needs more parameters (nemok_wifi_pass)'
        },
        {
            params: {
                customerCode: customerData.customerCode,
                jobParameters: {
                    nemok_sensor_test_http: 1,
                    nemok_wifi_ssid: 'test-ssid',
                    nemok_wifi_pass: ''
                }
            },
            expectedStatus: 550,
            case: 'task needs more parameters (empty nemok_wifi_pass)'
        },
        {
            params: {
                customerCode: customerData.customerCode,
                jobParameters: {
                    nemok_sensor_test_http: 1,
                    nemok_wifi_pass: 'test-pass'
                }
            },
            expectedStatus: 550,
            case: 'task needs more parameters (nemok_wifi_ssid)'
        },
        {
            params: {
                customerCode: customerData.customerCode,
                jobParameters: {
                    nemok_sensor_test_http: 1,
                    nemok_wifi_ssid: '',
                    nemok_wifi_pass: 'test-pass'
                }
            },
            expectedStatus: 550,
            case: 'task needs more parameters (empty nemok_wifi_ssid)'
        },
        {
            params: {
                customerCode: customerData.customerCode,
                jobParameters: {
                    nemok_sensor_test_http: 1,
                    nemok_wifi_ssid: 'test-ssid',
                    nemok_wifi_pass: 'test-pass'
                }
            },
            expectedStatus: 200,
            case: 'contains all required parameters'
        }
    ]

    const apiContext = await request.newContext()

    for (const thisTest of testGrid) {
        const response = await apiContext.post('jobs', { data: thisTest.params })
        expect(response.status(), { message: thisTest.case }).toBe(thisTest.expectedStatus)
    }
})
