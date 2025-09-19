import { test, expect } from '@playwright/test'

test.describe('RFP Lifecycle E2E', () => {
  test('Complete buyer to supplier workflow', async ({ page }) => {
    // Start at login page
    await page.goto('/login')

    // Register buyer account
    await page.click('text=create a new account')
    await page.fill('input[name="email"]', 'buyer@example.com')
    await page.selectOption('select[name="role"]', 'buyer')
    await page.fill('input[name="password"]', 'buyerpass123')
    await page.fill('input[name="confirmPassword"]', 'buyerpass123')
    await page.click('button[type="submit"]')

    // Should be redirected to buyer dashboard
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1')).toContainText('Buyer Dashboard')

    // Create new RFP
    await page.click('text=Create New RFP')
    await page.fill('input[name="title"]', 'E2E Test RFP')
    await page.fill('textarea[name="description"]', 'This is a test RFP created during E2E testing')
    await page.fill('textarea[name="requirements"]', 'Test requirements for E2E')
    await page.click('button[type="submit"]')

    // Verify RFP was created
    await expect(page.locator('text=E2E Test RFP')).toBeVisible()
    await expect(page.locator('text=DRAFT')).toBeVisible()

    // Publish the RFP
    await page.click('text=Publish')
    await expect(page.locator('text=PUBLISHED')).toBeVisible()

    // Logout and register as supplier
    await page.click('text=Logout')
    await expect(page).toHaveURL('/login')

    // Register supplier account
    await page.click('text=create a new account')
    await page.fill('input[name="email"]', 'supplier@example.com')
    await page.selectOption('select[name="role"]', 'supplier')
    await page.fill('input[name="password"]', 'supplierpass123')
    await page.fill('input[name="confirmPassword"]', 'supplierpass123')
    await page.click('button[type="submit"]')

    // Should be redirected to supplier dashboard
    await expect(page).toHaveURL('/supplier')
    await expect(page.locator('h1')).toContainText('Supplier Dashboard')

    // Verify published RFP is visible
    await expect(page.locator('text=E2E Test RFP')).toBeVisible()
    await expect(page.locator('text=This is a test RFP created during E2E testing')).toBeVisible()

    // Respond to the RFP
    await page.click('text=Respond')
    await expect(page.locator('text=Respond to: E2E Test RFP')).toBeVisible()
    await expect(page.locator('text=Test requirements for E2E')).toBeVisible()

    // Fill response form
    await page.fill('textarea[name="content"]', 'This is my detailed proposal for the E2E Test RFP. I can provide the requested services within the specified timeline.')
    await page.click('button[type="submit"]')

    // Verify response was submitted
    await expect(page.locator('text=Respond to: E2E Test RFP')).not.toBeVisible()

    // Logout and login as buyer to review response
    await page.click('text=Logout')
    await expect(page).toHaveURL('/login')

    // Login as buyer
    await page.fill('input[name="email"]', 'buyer@example.com')
    await page.fill('input[name="password"]', 'buyerpass123')
    await page.click('button[type="submit"]')

    // Should be redirected to buyer dashboard
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1')).toContainText('Buyer Dashboard')

    // Verify RFP status changed to RESPONSE_SUBMITTED
    await expect(page.locator('text=RESPONSE_SUBMITTED')).toBeVisible()

    // View RFP details
    await page.click('text=View Details')
    await expect(page.locator('h1')).toContainText('E2E Test RFP')
    await expect(page.locator('text=RESPONSE_SUBMITTED')).toBeVisible()

    // Change status to UNDER_REVIEW
    await page.click('text=Change Status')
    await page.selectOption('select[name="status"]', 'UNDER_REVIEW')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=UNDER_REVIEW')).toBeVisible()

    // Approve the RFP
    await page.click('text=Change Status')
    await page.selectOption('select[name="status"]', 'APPROVED')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=APPROVED')).toBeVisible()
  })

  test('Search functionality', async ({ page }) => {
    // Login as buyer
    await page.goto('/login')
    await page.fill('input[name="email"]', 'buyer@example.com')
    await page.fill('input[name="password"]', 'buyerpass123')
    await page.click('button[type="submit"]')

    // Navigate to search page
    await page.click('text=Search')
    await expect(page).toHaveURL('/search')
    await expect(page.locator('h1')).toContainText('Search RFPs')

    // Search for RFP
    await page.fill('input[placeholder*="Search RFPs"]', 'E2E Test')
    await page.click('button[type="submit"]')

    // Verify search results
    await expect(page.locator('text=E2E Test RFP')).toBeVisible()
    await expect(page.locator('text=This is a test RFP created during E2E testing')).toBeVisible()

    // Test status filter
    await page.click('text=Published')
    await expect(page.locator('text=E2E Test RFP')).toBeVisible()

    // Test view details from search
    await page.click('text=View Details →')
    await expect(page.locator('h1')).toContainText('E2E Test RFP')
  })

  test('File upload workflow', async ({ page }) => {
    // Login as buyer
    await page.goto('/login')
    await page.fill('input[name="email"]', 'buyer@example.com')
    await page.fill('input[name="password"]', 'buyerpass123')
    await page.click('button[type="submit"]')

    // Navigate to RFP details
    await page.click('text=View Details')
    await expect(page.locator('h1')).toContainText('E2E Test RFP')

    // Upload document
    await page.click('text=Upload Document')
    await expect(page.locator('text=Upload New Document')).toBeVisible()

    // Create a test file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Test PDF content')
    })

    await page.click('text=Upload')
    await expect(page.locator('text=test-document.pdf')).toBeVisible()
    await expect(page.locator('text=v1')).toBeVisible()

    // Upload new version
    await page.click('text=Upload Document')
    const newFileInput = page.locator('input[type="file"]')
    await newFileInput.setInputFiles({
      name: 'test-document-v2.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Updated PDF content')
    })

    await page.click('text=Upload')
    await expect(page.locator('text=test-document-v2.pdf')).toBeVisible()
    await expect(page.locator('text=v2')).toBeVisible()

    // Test version preview
    await page.click('text=Preview')
    // Note: In a real test, you'd verify the preview URL or download
  })

  test('Authentication and authorization', async ({ page }) => {
    // Try to access protected route without login
    await page.goto('/')
    await expect(page).toHaveURL('/login')

    // Login as supplier
    await page.fill('input[name="email"]', 'supplier@example.com')
    await page.fill('input[name="password"]', 'supplierpass123')
    await page.click('button[type="submit"]')

    // Should be redirected to supplier dashboard
    await expect(page).toHaveURL('/supplier')

    // Try to access buyer-only route
    await page.goto('/buyer')
    await expect(page).toHaveURL('/unauthorized')

    // Go back to supplier dashboard
    await page.click('text=Go to Dashboard')
    await expect(page).toHaveURL('/supplier')
  })

  test('Form validation', async ({ page }) => {
    // Test login form validation
    await page.goto('/login')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Invalid email address')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()

    // Test registration form validation
    await page.click('text=create a new account')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Invalid email address')).toBeVisible()
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
    await expect(page.locator('text=Please select a role')).toBeVisible()

    // Test password confirmation
    await page.fill('input[name="email"]', 'test@example.com')
    await page.selectOption('select[name="role"]', 'buyer')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'different123')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Passwords don\'t match')).toBeVisible()
  })
})




