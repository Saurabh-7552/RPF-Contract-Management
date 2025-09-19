import { test, expect } from '@playwright/test'

test.describe('Simple E2E Tests', () => {
  test('Login page loads correctly', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('load')
    
    // Wait for the login form to be visible
    await expect(page.locator('h2:has-text("Sign in to your account")')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('Can login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('load')
    
    // Fill in login form
    await page.fill('input[name="email"]', 'buyer@example.com')
    await page.fill('input[name="password"]', 'buyerpass123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for navigation (should redirect to dashboard)
    await page.waitForURL('**/', { timeout: 10000 })
    
    // Should be on the main page (not login page)
    expect(page.url()).not.toContain('/login')
  })

  test('Shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('load')
    
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for error message to appear
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 })
  })

  test('Registration page loads correctly', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('load')
    
    // Wait for the registration form to be visible
    await expect(page.locator('h2:has-text("Create your account")')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
    await expect(page.locator('select[name="role"]')).toBeVisible()
  })

  test('Can register new user', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('load')
    
    // Fill in registration form
    const timestamp = Date.now()
    await page.fill('input[name="email"]', `test${timestamp}@example.com`)
    await page.fill('input[name="password"]', 'testpass123')
    await page.fill('input[name="confirmPassword"]', 'testpass123')
    await page.selectOption('select[name="role"]', 'buyer')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for navigation (should redirect to dashboard)
    await page.waitForURL('**/', { timeout: 10000 })
    
    // Should be on the main page (not register page)
    expect(page.url()).not.toContain('/register')
  })

  test('Health endpoint works', async ({ page }) => {
    // Test the backend health endpoint
    const response = await page.request.get('http://127.0.0.1:8000/health')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.status).toBe('ok')
  })

  test('Auth endpoints are accessible', async ({ page }) => {
    // Test that auth endpoints exist
    const loginResponse = await page.request.post('http://127.0.0.1:8000/auth/login', {
      data: { email: 'test@example.com', password: 'testpass' }
    })
    // Should get 401 for invalid credentials, not 404
    expect(loginResponse.status()).toBe(401)
    
    const meResponse = await page.request.get('http://127.0.0.1:8000/auth/me')
    // Should get 401 for unauthenticated request, not 404
    expect(meResponse.status()).toBe(401)
  })
})
