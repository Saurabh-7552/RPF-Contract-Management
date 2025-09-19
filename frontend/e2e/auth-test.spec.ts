import { test, expect } from '@playwright/test'

test.describe('Authentication Test', () => {
  test('Can login with existing user', async ({ page }) => {
    // Go to login page
    await page.goto('/login')
    await page.waitForLoadState('load')
    
    // Wait for the login form to be visible
    await expect(page.locator('h2:has-text("Sign in to your account")')).toBeVisible()
    
    // Fill in credentials
    await page.fill('input[name="email"]', 'buyer@example.com')
    await page.fill('input[name="password"]', 'buyerpass123')
    
    // Click login button
    await page.click('button[type="submit"]')
    
    // Wait for navigation (should redirect to dashboard)
    await page.waitForURL('**/', { timeout: 10000 })
    
    // Verify we're not on login page anymore
    expect(page.url()).not.toContain('/login')
  })

  test('Shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('load')
    
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    
    // Click login button
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 })
  })
})
