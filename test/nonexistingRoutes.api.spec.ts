import { test, expect } from '@playwright/test'

test('should give 404 if no route - post', async ({ request }) => {
    const noData = await request.post('', {})
    expect(noData.status()).toBe(404)
})

test('should give 404 if nonexisting route - post', async ({ request }) => {
    const noData = await request.post('foo', {})
    expect(noData.status()).toBe(404)
})

test('should give 404 if no route - get', async ({ request }) => {
    const noData = await request.get('', {})
    expect(noData.status()).toBe(404)
})

test('should give 404 if nonexisting route - get', async ({ request }) => {
    const noData = await request.get('bar', {})
    expect(noData.status()).toBe(404)
})
