import { test, expect } from '@playwright/test'

test.describe('Performance E2E', () => {
  test('Page load performance', async ({ page }) => {
    // Measure login page load time
    const startTime = Date.now()
    await page.goto('/login')
    // Wait for the page to be fully loaded
    await page.waitForLoadState('load')
    // Wait for the login form to be visible using a more specific selector
    await page.waitForSelector('h2:has-text("Sign in to your account")', { timeout: 10000 })
    const loadTime = Date.now() - startTime
    
    // Should load within 10 seconds (increased timeout for development)
    expect(loadTime).toBeLessThan(10000)
  })

  test('Login performance', async ({ page }) => {
    // Test login performance
    const startTime = Date.now()
    await page.goto('/login')
    await page.waitForLoadState('load')
    
    await page.fill('input[name="email"]', 'buyer@example.com')
    await page.fill('input[name="password"]', 'buyerpass123')
    await page.click('button[type="submit"]')
    
    // Wait for successful login (redirect away from login page)
    await page.waitForURL('**/', { timeout: 10000 })
    const loginTime = Date.now() - startTime
    
    // Login should complete within 5 seconds
    expect(loginTime).toBeLessThan(5000)
    expect(page.url()).not.toContain('/login')
  })

  test('API response performance', async ({ page }) => {
    // Test API response times
    const startTime = Date.now()
    const response = await page.request.get('http://127.0.0.1:8000/health')
    const apiTime = Date.now() - startTime
    
    expect(response.status()).toBe(200)
    expect(apiTime).toBeLessThan(1000) // API should respond within 1 second
  })

  test('Page navigation performance', async ({ page }) => {
    // Test page navigation performance
    const startTime = Date.now()
    await page.goto('/login')
    await page.waitForLoadState('load')
    
    // Navigate to register page
    await page.click('text=create a new account')
    await page.waitForLoadState('load')
    
    const navTime = Date.now() - startTime
    expect(navTime).toBeLessThan(3000) // Navigation should be fast
    expect(page.url()).toContain('/register')
  })

  test('Form validation performance', async ({ page }) => {
    // Test form validation performance
    await page.goto('/register')
    await page.waitForLoadState('load')
    
    const startTime = Date.now()
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Wait for validation errors to appear
    await expect(page.locator('text=Invalid email address')).toBeVisible({ timeout: 5000 })
    const validationTime = Date.now() - startTime
    
    expect(validationTime).toBeLessThan(2000) // Validation should be fast
  })
})



