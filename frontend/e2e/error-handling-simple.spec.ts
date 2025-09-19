import { test, expect } from '@playwright/test'

test.describe('Error Handling E2E', () => {
  test('Invalid credentials handling', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('load')
    
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 })
  })

  test('Form validation errors', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('load')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Invalid email address')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Password is required')).toBeVisible({ timeout: 5000 })
  })

  test('Registration validation', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('load')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Invalid email address')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Password is required')).toBeVisible({ timeout: 5000 })
  })

  test('Network error handling', async ({ page }) => {
    // Test with invalid API endpoint
    const response = await page.request.get('http://127.0.0.1:8000/invalid-endpoint')
    expect(response.status()).toBe(404)
  })
})
