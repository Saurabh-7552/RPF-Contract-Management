import { test, expect } from '@playwright/test'

test.describe('RFP Lifecycle E2E', () => {
  test('Complete login workflow', async ({ page }) => {
    // Test buyer registration and login
    await page.goto('/register')
    await page.waitForLoadState('load')
    
    const timestamp = Date.now()
    await page.fill('input[name="email"]', `buyer${timestamp}@example.com`)
    await page.fill('input[name="password"]', 'buyerpass123')
    await page.fill('input[name="confirmPassword"]', 'buyerpass123')
    await page.selectOption('select[name="role"]', 'buyer')
    await page.click('button[type="submit"]')
    
    // Should be redirected to dashboard
    await page.waitForURL('**/', { timeout: 10000 })
    expect(page.url()).not.toContain('/register')
  })

  test('Supplier registration workflow', async ({ page }) => {
    // Test supplier registration
    await page.goto('/register')
    await page.waitForLoadState('load')
    
    const timestamp = Date.now()
    await page.fill('input[name="email"]', `supplier${timestamp}@example.com`)
    await page.fill('input[name="password"]', 'supplierpass123')
    await page.fill('input[name="confirmPassword"]', 'supplierpass123')
    await page.selectOption('select[name="role"]', 'supplier')
    await page.click('button[type="submit"]')
    
    // Should be redirected to dashboard
    await page.waitForURL('**/', { timeout: 10000 })
    expect(page.url()).not.toContain('/register')
  })

  test('Authentication flow', async ({ page }) => {
    // Test login with existing user
    await page.goto('/login')
    await page.waitForLoadState('load')
    
    await page.fill('input[name="email"]', 'buyer@example.com')
    await page.fill('input[name="password"]', 'buyerpass123')
    await page.click('button[type="submit"]')
    
    // Should be redirected to dashboard
    await page.waitForURL('**/', { timeout: 10000 })
    expect(page.url()).not.toContain('/login')
  })

  test('Form validation', async ({ page }) => {
    // Test login form validation
    await page.goto('/login')
    await page.waitForLoadState('load')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Invalid email address')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Password is required')).toBeVisible({ timeout: 5000 })
    
    // Test registration form validation
    await page.click('text=create a new account')
    await page.waitForLoadState('load')
    
    // Try to submit empty registration form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Invalid email address')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Password is required')).toBeVisible({ timeout: 5000 })
  })
})
