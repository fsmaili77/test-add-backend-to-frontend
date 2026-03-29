// src/services/apiService.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Helper: get auth token from storage
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Helper: extract userId from JWT token payload
 */
export const getUserIdFromToken = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Adjust the claim name to match your ASP.NET Identity token (common options below)
    return (
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
      payload['nameid'] ||
      payload['sub'] ||
      payload['userId'] ||
      null
    );
  } catch {
    return null;
  }
};

/**
 * Helper: extract user roles from JWT token
 */
export const getUserRolesFromToken = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return [];
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const roles = [];
    
    // Check various possible role claim formats
    for (const [key, value] of Object.entries(payload)) {
      if (typeof key === 'string' && key.toLowerCase().includes('role')) {
        if (Array.isArray(value)) {
          roles.push(...value);
        } else {
          roles.push(value);
        }
      }
    }
    
    return [...new Set(roles)]; // Remove duplicates
  } catch {
    return [];
  }
};

/**
 * Helper: check if user is admin or manager
 */
export const isAdminOrManager = () => {
  const roles = getUserRolesFromToken();
  return roles.includes('Admin') || roles.includes('Manager');
};

// ─── CLIENTS ────────────────────────────────────────────────────────────────

/**
 * Get all clients belonging to the current user only
 */
export const getClients = async () => {
  const userId = getUserIdFromToken();
  const response = await fetch(`${API_BASE_URL}/clients?userId=${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch clients');
  return response.json();
};

/**
 * Create a new client scoped to the current user
 */
export const createClient = async (clientData) => {
  const userId = getUserIdFromToken();
  const response = await fetch(`${API_BASE_URL}/clients`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ...clientData, userId }),
  });
  if (!response.ok) throw new Error('Failed to create client');
  return response.json();
};

/**
 * Get a single client (ownership validated server-side)
 */
export const getClientById = async (clientId) => {
  const userId = getUserIdFromToken();
  const response = await fetch(`${API_BASE_URL}/clients/${clientId}?userId=${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch client');
  return response.json();
};

/**
 * Update a client
 */
export const updateClient = async (clientId, clientData) => {
  const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(clientData),
  });
  if (!response.ok) throw new Error('Failed to update client');
  return response.json();
};

/**
 * Delete a client
 */
export const deleteClient = async (clientId) => {
  const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete client');
  return response.json();
};

// ─── DOCUMENTS ──────────────────────────────────────────────────────────────

/**
 * Upload a document — always linked to current user + selected client
 */
export const uploadDocument = async (file, clientId, additionalData = {}) => {
  const userId = getUserIdFromToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  formData.append('clientId', clientId);
  Object.entries(additionalData).forEach(([key, val]) => formData.append(key, val));

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to upload document');
  return response.json();
};

/**
 * Get documents filtered by current user and optionally by client
 */
export const getDocuments = async (clientId = null, filters = {}) => {
  const userId = getUserIdFromToken();
  const params = new URLSearchParams({ userId });
  
  if (clientId) params.append('clientId', clientId);
  
  // Add additional filters
  if (filters.dateRange) params.append('dateRange', filters.dateRange);
  if (filters.documentType) params.append('documentType', filters.documentType);
  if (filters.practiceArea) params.append('practiceArea', filters.practiceArea);
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.needsReview) params.append('needsReview', filters.needsReview);

  const response = await fetch(`${API_BASE_URL}/documents?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch documents');
  return response.json();
};

/**
 * Get all cases (alias for getDocuments for backward compatibility)
 */
export const getCases = async (clientId = null, filters = {}) => {
  return getDocuments(clientId, filters);
};

/**
 * Get a single document (ownership validated server-side)
 */
export const getDocumentById = async (documentId) => {
  const userId = getUserIdFromToken();
  const response = await fetch(
    `${API_BASE_URL}/cases/${documentId}?userId=${userId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error('Failed to fetch document');
  return response.json();
};

/**
 * Get a single case (alias for getDocumentById)
 */
export const getCaseById = async (caseId) => {
  return getDocumentById(caseId);
};

/**
 * Delete a document (ownership validated server-side)
 */
export const deleteDocument = async (documentId) => {
  const userId = getUserIdFromToken();
  const response = await fetch(
    `${API_BASE_URL}/cases/${documentId}?userId=${userId}`,
    { method: 'DELETE', headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error('Failed to delete document');
  return response.json();
};

/**
 * Update case/document metadata
 */
export const updateCaseMetadata = async (caseId, metadata) => {
  const response = await fetch(`${API_BASE_URL}/cases/${caseId}/update-metadata`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(metadata),
  });
  if (!response.ok) throw new Error('Failed to update case metadata');
  return response.json();
};

/**
 * Reanalyze a single document
 */
export const reanalyzeDocument = async (documentId) => {
  const response = await fetch(`${API_BASE_URL}/cases/${documentId}/reanalyze`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to reanalyze document');
  return response.json();
};

/**
 * Batch upload documents
 */
export const batchUploadDocuments = async (files, clientId, options = {}) => {
  const formData = new FormData();
  
  // Add all files
  files.forEach(file => {
    formData.append('files', file);
  });
  
  // Add client ID
  formData.append('clientId', clientId);
  
  // Add options
  if (options.titles) {
    options.titles.forEach(title => formData.append('titles', title));
  }
  if (options.classifications) {
    options.classifications.forEach(cls => formData.append('classifications', cls));
  }
  if (options.languages) {
    options.languages.forEach(lang => formData.append('languages', lang));
  }
  if (options.priorities) {
    options.priorities.forEach(priority => formData.append('priorities', priority));
  }
  if (options.practiceAreas) {
    options.practiceAreas.forEach(area => formData.append('practiceAreas', area));
  }
  if (options.enableOCR !== undefined) {
    formData.append('enableOCR', options.enableOCR.toString());
  }

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/batch-upload`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  
  if (!response.ok) throw new Error('Failed to batch upload documents');
  return response.json();
};

// ─── ANALYSIS ───────────────────────────────────────────────────────────────

/**
 * Get analyzed documents — scoped to current user, optionally filtered by client
 */
export const getAnalysisResults = async (clientId = null) => {
  const userId = getUserIdFromToken();
  const params = new URLSearchParams({ userId });
  if (clientId) params.append('clientId', clientId);

  const response = await fetch(`${API_BASE_URL}/documents?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch analysis results');
  return response.json();
};

/**
 * Get analysis for a specific document (ownership validated server-side)
 */
export const getAnalysisById = async (analysisId) => {
  const userId = getUserIdFromToken();
  const response = await fetch(
    `${API_BASE_URL}/cases/${analysisId}?userId=${userId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error('Failed to fetch analysis');
  return response.json();
};

/**
 * Trigger analysis on a document
 */
export const analyzeDocument = async (documentId, clientId) => {
  const userId = getUserIdFromToken();
  const response = await fetch(`${API_BASE_URL}/cases/${documentId}/reanalyze`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ documentId, clientId, userId }),
  });
  if (!response.ok) throw new Error('Failed to analyze document');
  return response.json();
};

// ─── ANALYTICS ──────────────────────────────────────────────────────────────

/**
 * Get analytics data — scoped to current user and optionally by client
 */
export const getAnalytics = async (clientId = null) => {
  const userId = getUserIdFromToken();
  const params = new URLSearchParams();
  
  if (!isAdminOrManager()) {
    params.append('userId', userId);
  }
  
  if (clientId) {
    params.append('clientId', clientId);
  }

  const response = await fetch(
    `${API_BASE_URL}/analytics?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
};

/**
 * Get practice areas statistics
 */
export const getPracticeAreas = async (clientId = null) => {
  const params = new URLSearchParams();
  if (clientId) params.append('clientId', clientId);

  const response = await fetch(
    `${API_BASE_URL}/practice-areas?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error('Failed to fetch practice areas');
  return response.json();
};

/**
 * Get quick filter statistics
 */
export const getQuickFilterStats = async (clientId = null) => {
  const params = new URLSearchParams();
  if (clientId) params.append('clientId', clientId);

  const response = await fetch(
    `${API_BASE_URL}/quick-filters?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error('Failed to fetch quick filter stats');
  return response.json();
};

/**
 * Get trends data
 */
export const getTrends = async (clientId = null) => {
  const params = new URLSearchParams();
  if (clientId) params.append('clientId', clientId);

  const response = await fetch(
    `${API_BASE_URL}/trends?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error('Failed to fetch trends');
  return response.json();
};

// ─── SEARCH ─────────────────────────────────────────────────────────────────

/**
 * Search documents/analysis — always scoped to current user
 */
export const searchDocuments = async (query, clientId = null) => {
  const userId = getUserIdFromToken();
  const params = new URLSearchParams({ query, userId });
  if (clientId) params.append('clientId', clientId);

  const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Search failed');
  return response.json();
};

/**
 * Search cases (alias for searchDocuments)
 */
export const searchCases = async (keyword, clientId = null) => {
  return searchDocuments(keyword, clientId);
};

// ─── SERVICE PLUS (Microservices) ───────────────────────────────────────────

/**
 * Compare two documents
 */
export const compareDocuments = async (documentId1, documentId2, options = {}) => {
  const userId = getUserIdFromToken();
  const response = await fetch(`${API_BASE_URL}/service-plus/compare`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      documentId1,
      documentId2,
      userId,
      ...options
    }),
  });
  if (!response.ok) throw new Error('Failed to compare documents');
  return response.json();
};

/**
 * Generate document from template
 */
export const generateDocument = async (templateId, data, clientId) => {
  const userId = getUserIdFromToken();
  const response = await fetch(`${API_BASE_URL}/service-plus/generate-document`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      templateId,
      data,
      userId,
      clientId,
    }),
  });
  if (!response.ok) throw new Error('Failed to generate document');
  return response.json();
};

/**
 * Analyze case with advanced AI
 */
export const analyzeCase = async (caseId, analysisType = 'full', options = {}) => {
  const userId = getUserIdFromToken();
  const response = await fetch(`${API_BASE_URL}/service-plus/analyze-case`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      caseId,
      analysisType,
      userId,
      ...options
    }),
  });
  if (!response.ok) throw new Error('Failed to analyze case');
  return response.json();
};

/**
 * Get available templates
 */
export const getTemplates = async (category = null) => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);

  const response = await fetch(
    `${API_BASE_URL}/service-plus/templates?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
};

/**
 * Get a specific template by ID
 */
export const getTemplateById = async (templateId) => {
  const response = await fetch(
    `${API_BASE_URL}/service-plus/templates/${templateId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error('Failed to fetch template');
  return response.json();
};

// ─── HEALTH & SYSTEM ────────────────────────────────────────────────────────

/**
 * Check system health
 */
export const checkHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/health`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
};

/**
 * Check microservices health
 */
export const checkMicroservicesHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/microservices/health`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Microservices health check failed');
  return response.json();
};

// ─── ADMIN FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Get audit logs (Admin only)
 */
export const getAuditLogs = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.action) params.append('action', filters.action);

  const response = await fetch(
    `${API_BASE_URL}/admin/audit-logs?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error('Failed to fetch audit logs');
  return response.json();
};

/**
 * Reanalyze all documents (Admin only)
 */
export const reanalyzeAllDocuments = async () => {
  const response = await fetch(`${API_BASE_URL}/reanalyze-all`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to reanalyze all documents');
  return response.json();
};

// ─── TEXT EXTRACTION ────────────────────────────────────────────────────────

/**
 * Extract text from a file without analyzing
 */
export const extractText = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/extract-text`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to extract text');
  return response.json();
};

// ─── EXPORT/DOWNLOAD ────────────────────────────────────────────────────────

/**
 * Download a document file
 */
export const downloadDocument = async (documentId) => {
  const userId = getUserIdFromToken();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  const response = await fetch(
    `${API_BASE_URL}/documents/${documentId}/download?userId=${userId}`,
    {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    }
  );
  
  if (!response.ok) throw new Error('Failed to download document');
  
  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = 'document.pdf';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
    if (filenameMatch) filename = filenameMatch[1];
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Export analytics data as CSV
 */
export const exportAnalytics = async (clientId = null, format = 'csv') => {
  const userId = getUserIdFromToken();
  const params = new URLSearchParams({ format });
  
  if (!isAdminOrManager()) {
    params.append('userId', userId);
  }
  
  if (clientId) {
    params.append('clientId', clientId);
  }
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const response = await fetch(
    `${API_BASE_URL}/analytics/export?${params.toString()}`,
    {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    }
  );
  
  if (!response.ok) throw new Error('Failed to export analytics');
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.${format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────────────

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check token expiry
    if (payload.exp) {
      return payload.exp * 1000 > Date.now();
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Get current user info from token
 */
export const getCurrentUserInfo = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: getUserIdFromToken(),
      email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload['email'],
      name: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload['name'],
      roles: getUserRolesFromToken(),
      subscriptionTier: payload['subscriptionTier'],
      documentQuota: parseInt(payload['documentQuota'] || 50),
      documentsProcessed: parseInt(payload['documentsProcessed'] || 0),
    };
  } catch {
    return null;
  }
};

/**
 * Format error message from API response
 */
export const formatApiError = (error) => {
  if (error.response && error.response.data) {
    return error.response.data.error || error.response.data.message || 'An error occurred';
  }
  return error.message || 'An unexpected error occurred';
};

// Default export with all functions
export default {
  // Auth helpers
  getUserIdFromToken,
  getUserRolesFromToken,
  isAdminOrManager,
  isAuthenticated,
  getCurrentUserInfo,
  
  // Clients
  getClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
  
  // Documents
  uploadDocument,
  getDocuments,
  getCases,
  getDocumentById,
  getCaseById,
  deleteDocument,
  updateCaseMetadata,
  reanalyzeDocument,
  batchUploadDocuments,
  
  // Analysis
  getAnalysisResults,
  getAnalysisById,
  analyzeDocument,
  
  // Analytics
  getAnalytics,
  getPracticeAreas,
  getQuickFilterStats,
  getTrends,
  
  // Search
  searchDocuments,
  searchCases,
  
  // Service Plus
  compareDocuments,
  generateDocument,
  analyzeCase,
  getTemplates,
  getTemplateById,
  
  // Health
  checkHealth,
  checkMicroservicesHealth,
  
  // Admin
  getAuditLogs,
  reanalyzeAllDocuments,
  
  // Text Extraction
  extractText,
  
  // Export/Download
  downloadDocument,
  exportAnalytics,
  
  // Utilities
  formatApiError,
};