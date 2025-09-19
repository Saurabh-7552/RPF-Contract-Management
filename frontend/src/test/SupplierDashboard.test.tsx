import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from './test-utils'
import { SupplierDashboard } from '../pages/SupplierDashboard'
import { mockApiClient, mockResponses } from './mocks/api'

// Mock the API client
vi.mock('../lib/api', () => ({
  apiClient: mockApiClient
}))

// Mock the auth context
vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: { id: 2, email: 'supplier@example.com', role: 'supplier' },
    isLoading: false
  })
}))

describe('SupplierDashboard', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock RFPs with published ones
    const publishedRFPs = {
      items: [
        {
          id: 1,
          title: 'Published RFP 1',
          description: 'Description for published RFP 1',
          status: 'PUBLISHED',
          created_at: '2023-01-01T00:00:00Z',
          deadline: '2023-12-31T23:59:59Z',
          owner_id: 1
        },
        {
          id: 2,
          title: 'Published RFP 2',
          description: 'Description for published RFP 2',
          requirements: 'Some requirements',
          status: 'PUBLISHED',
          created_at: '2023-01-02T00:00:00Z',
          deadline: null,
          owner_id: 1
        },
        {
          id: 3,
          title: 'Draft RFP',
          description: 'This should not appear',
          status: 'DRAFT',
          created_at: '2023-01-03T00:00:00Z',
          owner_id: 1
        }
      ],
      total: 3,
      page: 1,
      total_pages: 1
    }
    
    mockApiClient.getRFPs.mockResolvedValue(publishedRFPs)
  })

  it('renders supplier dashboard', async () => {
    render(<SupplierDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Supplier Dashboard')).toBeInTheDocument()
      expect(screen.getByText('2 published RFPs available')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    mockApiClient.getRFPs.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<SupplierDashboard />)
    
    expect(screen.getByRole('status')).toBeInTheDocument() // Loading spinner
  })

  it('displays only published RFPs', async () => {
    render(<SupplierDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Published RFP 1')).toBeInTheDocument()
      expect(screen.getByText('Published RFP 2')).toBeInTheDocument()
      expect(screen.queryByText('Draft RFP')).not.toBeInTheDocument()
    })
  })

  it('shows empty state when no published RFPs', async () => {
    mockApiClient.getRFPs.mockResolvedValue({
      items: [
        {
          id: 1,
          title: 'Draft RFP',
          description: 'This is a draft',
          status: 'DRAFT',
          created_at: '2023-01-01T00:00:00Z',
          owner_id: 1
        }
      ],
      total: 1,
      page: 1,
      total_pages: 1
    })
    
    render(<SupplierDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('No published RFPs available at the moment.')).toBeInTheDocument()
    })
  })

  it('opens response form when respond button is clicked', async () => {
    render(<SupplierDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Published RFP 1')).toBeInTheDocument()
    })
    
    const respondButtons = screen.getAllByRole('button', { name: /respond/i })
    await user.click(respondButtons[0])
    
    expect(screen.getByText('Respond to: Published RFP 1')).toBeInTheDocument()
    expect(screen.getByText('RFP Description:')).toBeInTheDocument()
    expect(screen.getByText('Description for published RFP 1')).toBeInTheDocument()
    expect(screen.getByLabelText(/your response/i)).toBeInTheDocument()
  })

  it('shows requirements when available', async () => {
    render(<SupplierDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Published RFP 2')).toBeInTheDocument()
    })
    
    const respondButtons = screen.getAllByRole('button', { name: /respond/i })
    await user.click(respondButtons[1]) // Second RFP has requirements
    
    expect(screen.getByText('Requirements:')).toBeInTheDocument()
    expect(screen.getByText('Some requirements')).toBeInTheDocument()
  })

  it('validates response content', async () => {
    render(<SupplierDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Published RFP 1')).toBeInTheDocument()
    })
    
    const respondButtons = screen.getAllByRole('button', { name: /respond/i })
    await user.click(respondButtons[0])
    
    // Try to submit empty response
    const submitButton = screen.getByRole('button', { name: /submit response/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Response content is required')).toBeInTheDocument()
    })
  })

  it('submits response with valid content', async () => {
    render(<SupplierDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Published RFP 1')).toBeInTheDocument()
    })
    
    const respondButtons = screen.getAllByRole('button', { name: /respond/i })
    await user.click(respondButtons[0])
    
    const responseInput = screen.getByLabelText(/your response/i)
    const submitButton = screen.getByRole('button', { name: /submit response/i })
    
    await user.type(responseInput, 'This is my detailed proposal for the RFP.')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockApiClient.respondToRFP).toHaveBeenCalledWith(1, 'This is my detailed proposal for the RFP.')
    })
  })

  it('shows loading state during response submission', async () => {
    mockApiClient.respondToRFP.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<SupplierDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Published RFP 1')).toBeInTheDocument()
    })
    
    const respondButtons = screen.getAllByRole('button', { name: /respond/i })
    await user.click(respondButtons[0])
    
    const responseInput = screen.getByLabelText(/your response/i)
    const submitButton = screen.getByRole('button', { name: /submit response/i })
    
    await user.type(responseInput, 'My proposal')
    await user.click(submitButton)
    
    expect(screen.getByText('Submitting...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('closes response form after successful submission', async () => {
    render(<SupplierDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Published RFP 1')).toBeInTheDocument()
    })
    
    const respondButtons = screen.getAllByRole('button', { name: /respond/i })
    await user.click(respondButtons[0])
    
    const responseInput = screen.getByLabelText(/your response/i)
    const submitButton = screen.getByRole('button', { name: /submit response/i })
    
    await user.type(responseInput, 'My proposal')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Respond to: Published RFP 1')).not.toBeInTheDocument()
    })
  })

  it('cancels response form when cancel button is clicked', async () => {
    render(<SupplierDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Published RFP 1')).toBeInTheDocument()
    })
    
    const respondButtons = screen.getAllByRole('button', { name: /respond/i })
    await user.click(respondButtons[0])
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    expect(screen.queryByText('Respond to: Published RFP 1')).not.toBeInTheDocument()
  })

  it('displays RFP metadata correctly', async () => {
    render(<SupplierDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Created: 1/1/2023')).toBeInTheDocument()
      expect(screen.getByText('Deadline: 12/31/2023')).toBeInTheDocument()
      expect(screen.getByText('Deadline: Not specified')).toBeInTheDocument()
    })
  })

  it('shows view details button for each RFP', async () => {
    render(<SupplierDashboard />)
    
    await waitFor(() => {
      const viewDetailsButtons = screen.getAllByRole('button', { name: /view details/i })
      expect(viewDetailsButtons).toHaveLength(2) // Only published RFPs
    })
  })
})




