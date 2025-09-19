import { vi } from 'vitest'

// Mock the API client
export const mockApiClient = {
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  getRFPs: vi.fn(),
  getRFP: vi.fn(),
  createRFP: vi.fn(),
  updateRFP: vi.fn(),
  respondToRFP: vi.fn(),
  changeRFPStatus: vi.fn(),
  searchRFPs: vi.fn(),
  getPresignedUrl: vi.fn(),
  completeUpload: vi.fn(),
  getDocumentVersions: vi.fn(),
  uploadDocumentVersion: vi.fn(),
  revertToVersion: vi.fn(),
  getVersionPreview: vi.fn(),
}

// Mock successful responses
export const mockResponses = {
  login: {
    access_token: 'mock_access_token',
    user: {
      id: 1,
      email: 'test@example.com',
      role: 'buyer'
    }
  },
  register: {
    access_token: 'mock_access_token',
    user: {
      id: 1,
      email: 'test@example.com',
      role: 'buyer'
    }
  },
  currentUser: {
    id: 1,
    email: 'test@example.com',
    role: 'buyer'
  },
  rfps: {
    items: [
      {
        id: 1,
        title: 'Test RFP',
        description: 'Test description',
        status: 'DRAFT',
        created_at: '2023-01-01T00:00:00Z',
        owner_id: 1
      }
    ],
    total: 1,
    page: 1,
    total_pages: 1
  },
  rfp: {
    id: 1,
    title: 'Test RFP',
    description: 'Test description',
    status: 'DRAFT',
    created_at: '2023-01-01T00:00:00Z',
    owner_id: 1
  },
  presignedUrl: {
    presigned_url: 'https://mock-s3-url.com/upload',
    filename: 'test.pdf'
  },
  uploadComplete: {
    document_id: 1,
    version_number: 1
  }
}

// Setup default mock implementations
mockApiClient.login.mockResolvedValue(mockResponses.login)
mockApiClient.register.mockResolvedValue(mockResponses.register)
mockApiClient.getCurrentUser.mockResolvedValue(mockResponses.currentUser)
mockApiClient.getRFPs.mockResolvedValue(mockResponses.rfps)
mockApiClient.getRFP.mockResolvedValue(mockResponses.rfp)
mockApiClient.createRFP.mockResolvedValue(mockResponses.rfp)
mockApiClient.getPresignedUrl.mockResolvedValue(mockResponses.presignedUrl)
mockApiClient.completeUpload.mockResolvedValue(mockResponses.uploadComplete)
mockApiClient.getDocumentVersions.mockResolvedValue([])




