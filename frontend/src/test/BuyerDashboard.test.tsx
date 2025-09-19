import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from './test-utils'
import { BuyerDashboard } from '../pages/BuyerDashboard'
import { mockApiClient, mockResponses } from './mocks/api'

// Mock the API client
vi.mock('../lib/api', () => ({
  apiClient: mockApiClient
}))

// Mock the auth context
vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'buyer@example.com', role: 'buyer' },
    isLoading: false
  })
}))

describe('BuyerDashboard', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockApiClient.getRFPs.mockResolvedValue(mockResponses.rfps)
  })

  it('renders dashboard with create RFP button', async () => {
    render(<BuyerDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Buyer Dashboard')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create new rfp/i })).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    mockApiClient.getRFPs.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<BuyerDashboard />)
    
    expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
  })

  it('displays list of RFPs', async () => {
    render(<BuyerDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test RFP')).toBeInTheDocument()
      expect(screen.getByText('Test description')).toBeInTheDocument()
      expect(screen.getByText('DRAFT')).toBeInTheDocument()
    })
  })

  it('shows empty state when no RFPs', async () => {
    mockApiClient.getRFPs.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      total_pages: 0
    })
    
    render(<BuyerDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('No RFPs created yet.')).toBeInTheDocument()
    })
  })

  it('opens create RFP form when button is clicked', async () => {
    render(<BuyerDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Buyer Dashboard')).toBeInTheDocument()
    })
    
    const createButton = screen.getByRole('button', { name: /create new rfp/i })
    await user.click(createButton)
    
    expect(screen.getByText('Create New RFP')).toBeInTheDocument()
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
  })

  it('validates required fields in create form', async () => {
    render(<BuyerDashboard />)
    
    // Open create form
    const createButton = screen.getByRole('button', { name: /create new rfp/i })
    await user.click(createButton)
    
    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /create rfp/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
      expect(screen.getByText('Description is required')).toBeInTheDocument()
    })
  })

  it('submits create RFP form with valid data', async () => {
    render(<BuyerDashboard />)
    
    // Open create form
    const createButton = screen.getByRole('button', { name: /create new rfp/i })
    await user.click(createButton)
    
    // Fill form
    const titleInput = screen.getByLabelText(/title/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const submitButton = screen.getByRole('button', { name: /create rfp/i })
    
    await user.type(titleInput, 'New Test RFP')
    await user.type(descriptionInput, 'New test description')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockApiClient.createRFP).toHaveBeenCalledWith({
        title: 'New Test RFP',
        description: 'New test description',
        requirements: undefined
      })
    })
  })

  it('shows loading state during RFP creation', async () => {
    mockApiClient.createRFP.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<BuyerDashboard />)
    
    // Open create form
    const createButton = screen.getByRole('button', { name: /create new rfp/i })
    await user.click(createButton)
    
    // Fill and submit form
    const titleInput = screen.getByLabelText(/title/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const submitButton = screen.getByRole('button', { name: /create rfp/i })
    
    await user.type(titleInput, 'New Test RFP')
    await user.type(descriptionInput, 'New test description')
    await user.click(submitButton)
    
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('closes form after successful creation', async () => {
    render(<BuyerDashboard />)
    
    // Open create form
    const createButton = screen.getByRole('button', { name: /create new rfp/i })
    await user.click(createButton)
    
    // Fill and submit form
    const titleInput = screen.getByLabelText(/title/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const submitButton = screen.getByRole('button', { name: /create rfp/i })
    
    await user.type(titleInput, 'New Test RFP')
    await user.type(descriptionInput, 'New test description')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Create New RFP')).not.toBeInTheDocument()
    })
  })

  it('cancels form when cancel button is clicked', async () => {
    render(<BuyerDashboard />)
    
    // Open create form
    const createButton = screen.getByRole('button', { name: /create new rfp/i })
    await user.click(createButton)
    
    // Cancel form
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    expect(screen.queryByText('Create New RFP')).not.toBeInTheDocument()
  })

  it('displays RFP status badges correctly', async () => {
    const rfpsWithStatuses = {
      items: [
        { ...mockResponses.rfp, status: 'DRAFT' },
        { ...mockResponses.rfp, id: 2, title: 'Published RFP', status: 'PUBLISHED' },
        { ...mockResponses.rfp, id: 3, title: 'Approved RFP', status: 'APPROVED' }
      ],
      total: 3,
      page: 1,
      total_pages: 1
    }
    
    mockApiClient.getRFPs.mockResolvedValue(rfpsWithStatuses)
    
    render(<BuyerDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('DRAFT')).toBeInTheDocument()
      expect(screen.getByText('PUBLISHED')).toBeInTheDocument()
      expect(screen.getByText('APPROVED')).toBeInTheDocument()
    })
  })
})




