import { test, expect } from '@playwright/test'

test.describe('Error Handling E2E', () => {
  test('Network error handling', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/**', route => route.abort())
    
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Network error')).toBeVisible()
  })

  test('Invalid credentials handling', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('Session timeout handling', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', 'buyer@example.com')
    await page.fill('input[name="password"]', 'buyerpass123')
    await page.click('button[type="submit"]')
    
    // Simulate token expiration
    await page.evaluate(() => {
      localStorage.removeItem('access_token')
    })
    
    // Try to access protected route
    await page.goto('/')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })

  test('File upload error handling', async ({ page }) => {
    // Login as buyer
    await page.goto('/login')
    await page.fill('input[name="email"]', 'buyer@example.com')
    await page.fill('input[name="password"]', 'buyerpass123')
    await page.click('button[type="submit"]')
    
    // Navigate to RFP details
    await page.click('text=View Details')
    
    // Try to upload invalid file type
    await page.click('text=Upload Document')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test.exe',
      mimeType: 'application/x-executable',
      buffer: Buffer.from('executable content')
    })
    
    await page.click('text=Upload')
    
    // Should show error message
    await expect(page.locator('text=Invalid file type')).toBeVisible()
  })

  test('Large file upload handling', async ({ page }) => {
    // Login as buyer
    await page.goto('/login')
    await page.fill('input[name="email"]', 'buyer@example.com')
    await page.fill('input[name="password"]', 'buyerpass123')
    await page.click('button[type="submit"]')
    
    // Navigate to RFP details
    await page.click('text=View Details')
    
    // Try to upload large file (simulate 100MB)
    await page.click('text=Upload Document')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'large-file.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(100 * 1024 * 1024) // 100MB
    })
    
    await page.click('text=Upload')
    
    // Should show file size error
    await expect(page.locator('text=File too large')).toBeVisible()
  })

  test('Concurrent user actions', async ({ browser }) => {
    // Create two browser contexts
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    // Login as buyer on both pages
    await page1.goto('/login')
    await page1.fill('input[name="email"]', 'buyer@example.com')
    await page1.fill('input[name="password"]', 'buyerpass123')
    await page1.click('button[type="submit"]')
    
    await page2.goto('/login')
    await page2.fill('input[name="email"]', 'buyer@example.com')
    await page2.fill('input[name="password"]', 'buyerpass123')
    await page2.click('button[type="submit"]')
    
    // Try to edit same RFP on both pages
    await page1.click('text=View Details')
    await page2.click('text=View Details')
    
    // Edit on page 1
    await page1.click('text=Edit RFP')
    await page1.fill('input[name="title"]', 'Updated by Page 1')
    await page1.click('button[type="submit"]')
    
    // Try to edit on page 2
    await page2.click('text=Edit RFP')
    await page2.fill('input[name="title"]', 'Updated by Page 2')
    await page2.click('button[type="submit"]')
    
    // Should show conflict message
    await expect(page2.locator('text=Conflict detected')).toBeVisible()
    
    await context1.close()
    await context2.close()
  })
})



