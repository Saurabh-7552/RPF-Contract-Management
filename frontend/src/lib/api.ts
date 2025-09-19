import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true, // For httpOnly cookies
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Only try to refresh if we have a token and it's not already a refresh request
          if (this.accessToken && !error.config.url?.includes('/auth/refresh')) {
            try {
              await this.refreshToken();
              // Retry the original request
              return this.client.request(error.config);
            } catch (refreshError) {
              this.clearToken();
              // Only redirect if we're not already on the login page
              if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
              }
              return Promise.reject(refreshError);
            }
          } else {
            // No token or refresh failed, just reject
            this.clearToken();
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('access_token', token);
  }

  clearToken() {
    this.accessToken = null;
    localStorage.removeItem('access_token');
  }

  private async refreshToken(): Promise<void> {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
      withCredentials: true,
    });
    this.setAccessToken(response.data.access_token);
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    this.setAccessToken(response.data.access_token);
    return response.data;
  }

  async register(email: string, password: string, role: string) {
    const response = await this.client.post('/auth/register', { email, password, role });
    this.setAccessToken(response.data.access_token);
    return response.data;
  }

  async logout() {
    await this.client.post('/auth/logout');
    this.clearToken();
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // RFP endpoints
  async getRFPs(page = 1, limit = 10) {
    const response = await this.client.get(`/rfps?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getRFP(id: number) {
    const response = await this.client.get(`/rfps/${id}`);
    return response.data;
  }

  async createRFP(data: { title: string; description: string; requirements?: string }) {
    const response = await this.client.post('/rfps', data);
    return response.data;
  }

  async updateRFP(id: number, data: { title?: string; description?: string; status?: string }) {
    const response = await this.client.put(`/rfps/${id}`, data);
    return response.data;
  }

  async respondToRFP(id: number, content: string) {
    const response = await this.client.post(`/rfps/${id}/respond`, { content });
    return response.data;
  }

  async changeRFPStatus(id: number, status: string) {
    const response = await this.client.patch(`/rfps/${id}/status?new_status=${status}`);
    return response.data;
  }

  async searchRFPs(query: string, page = 1, limit = 10) {
    const response = await this.client.get(`/rfps/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  }

  // Supplier-specific endpoints
  async getSupplierResponses() {
    const response = await this.client.get('/rfps/supplier/responses');
    return response.data;
  }

  async getPublishedRFPsWithOwners(limit = 10, offset = 0) {
    const response = await this.client.get(`/rfps/supplier/published?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  // Upload endpoints
  async getPresignedUrl(filename: string, contentType: string) {
    const response = await this.client.post('/uploads/presign', { filename, content_type: contentType });
    return response.data;
  }

  async completeUpload(filename: string, rfpId: number, documentType: string) {
    const response = await this.client.post('/uploads/complete', {
      filename,
      rfp_id: rfpId,
      document_type: documentType,
    });
    return response.data;
  }

  // Document version endpoints
  async getDocumentVersions(documentId: number) {
    const response = await this.client.get(`/documents/${documentId}/versions`);
    return response.data;
  }

  async uploadDocumentVersion(documentId: number, filename: string, notes?: string) {
    const response = await this.client.post(`/documents/${documentId}/versions`, {
      filename,
      notes,
    });
    return response.data;
  }

  async revertToVersion(documentId: number, versionNumber: number) {
    const response = await this.client.post(`/documents/${documentId}/versions/${versionNumber}/revert`);
    return response.data;
  }

  async getVersionPreview(documentId: number, versionNumber: number) {
    const response = await this.client.get(`/documents/${documentId}/versions/${versionNumber}/preview`);
    return response.data;
  }
}

export const apiClient = new ApiClient();




