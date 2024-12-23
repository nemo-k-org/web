import { test, expect, request } from '@playwright/test'
import { UtilDatabase } from './util/UtilDatabase'

import { CUSTOMER_EMAIL, LOCAL_SETTINGS } from './constants'

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
    const utilDatabase = new UtilDatabase(CUSTOMER_EMAIL)
    await utilDatabase.getDatabaseSettingsFromLocalSettingsFile(LOCAL_SETTINGS)
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
            body: customerData.customerCode,
            expectedStatus: 200,
            case: 'contains all required parameters'
        },
        {
            params: {
                customerCode: customerData.customerCode,
                jobParameters: {
                    nemok_sensor_temp_ds18b20: 1,
                    nemok_wifi_ssid: 'test-ssid',
                    nemok_wifi_pass: 'test-pass',
                    nemok_sensor_hostname: 'TestSensor',
                    nemok_sensor_delay: 1000,
                    nemok_signalk_server_host: '127.0.0.1',
                    nemok_signalk_server_port: 3000
                }
            },
            body: customerData.customerCode,
            expectedStatus: 200,
            case: 'contains all required parameters for sensor ds18b20'
        },
        {
            params: {
                customerCode: customerData.customerCode,
                jobParameters: {
                    nemok_sensor_temp_max6675: 1,
                    nemok_wifi_ssid: 'test-ssid',
                    nemok_wifi_pass: 'test-pass',
                    nemok_sensor_hostname: 'TestSensor',
                    nemok_sensor_delay: 1000,
                    nemok_signalk_server_host: '127.0.0.1',
                    nemok_signalk_server_port: 3000
                }
            },
            body: customerData.customerCode,
            expectedStatus: 200,
            case: 'contains all required parameters for sensor max6675'
        }
    ]

    const apiContext = await request.newContext()

    for (const thisTest of testGrid) {
        const response = await apiContext.post('jobs', { data: thisTest.params })
        expect(response.status(), { message: `${thisTest.case}, customerCode: ${customerData.customerCode}` }).toBe(thisTest.expectedStatus)

        if (thisTest.body) {
            const responseBody = await response.json()
            expect(responseBody, { message: thisTest.case }).not.toBe('')
        }
    }
})
