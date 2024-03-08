import { test, expect } from '@playwright/test'

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
