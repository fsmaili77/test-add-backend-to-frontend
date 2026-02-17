// src/services/apiService.js
import axios from 'axios';
import authService from './authService';

const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:3001';

class ApiService {
  // Document Analysis
  async analyzeDocument(formData) {
    try {
      const response = await axios.post(`${PYTHON_API_URL}/analyze`, formData, {
        headers: {
          ...authService.getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Document analysis error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to analyze document'
      };
    }
  }

  // Get all documents
  async getDocuments(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(`${PYTHON_API_URL}/documents?${queryParams}`, {
        headers: authService.getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get documents error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch documents'
      };
    }
  }

  // Get single document
  async getDocument(documentId) {
    try {
      const response = await axios.get(`${PYTHON_API_URL}/cases/${documentId}`, {
        headers: authService.getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get document error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch document'
      };
    }
  }

  // Delete document
  async deleteDocument(documentId) {
    try {
      const response = await axios.delete(`${PYTHON_API_URL}/cases/${documentId}`, {
        headers: authService.getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Delete document error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete document'
      };
    }
  }

  // Search documents
  async searchDocuments(query) {
    try {
      const response = await axios.get(`${PYTHON_API_URL}/search?query=${encodeURIComponent(query)}`, {
        headers: authService.getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Search error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to search documents'
      };
    }
  }

  // Get analytics
  async getAnalytics() {
    try {
      const response = await axios.get(`${PYTHON_API_URL}/analytics`, {
        headers: authService.getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Analytics error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch analytics'
      };
    }
  }

  // Compare documents
  async compareDocuments(doc1Id, doc2Id) {
    try {
      const formData = new FormData();
      formData.append('doc1_id', doc1Id);
      formData.append('doc2_id', doc2Id);

      const response = await axios.post(`${PYTHON_API_URL}/service-plus/advanced-compare`, formData, {
        headers: {
          ...authService.getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Compare documents error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to compare documents'
      };
    }
  }

  // Generate document
  async generateDocument(templateId, parameters) {
    try {
      const response = await axios.post(`${PYTHON_API_URL}/service-plus/generate`, {
        template_id: templateId,
        parameters,
        user_id: authService.getUser()?.id
      }, {
        headers: authService.getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Generate document error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to generate document'
      };
    }
  }

  // Case analysis
  async analyzeCase(documentIds, analysisType, caseContext) {
    try {
      const response = await axios.post(`${PYTHON_API_URL}/service-plus/analyze-case`, {
        document_ids: documentIds,
        analysis_type: analysisType,
        case_context: caseContext,
        user_id: authService.getUser()?.id
      }, {
        headers: authService.getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Case analysis error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to analyze case'
      };
    }
  }

  // Get templates
  async getTemplates(category = 'all') {
    try {
      const response = await axios.get(`${PYTHON_API_URL}/service-plus/templates?category=${category}`, {
        headers: authService.getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get templates error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch templates'
      };
    }
  }

  // Health check
  async checkHealth() {
    try {
      const response = await axios.get(`${PYTHON_API_URL}/health`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        success: false,
        error: 'API is not available'
      };
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;