// src/api.js - Complete with Client Isolation, Duplicate Handling & Auth Support

// Use Vite environment variables consistently
const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 
                    (import.meta.env.DEV ? 'http://localhost:3001' : '/api');
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5093/api';

// Helper: Get auth headers for JSON requests (includes Content-Type)
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token 
    ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
};

// 🔥 NEW: Get auth headers for multipart/form-data requests (NO Content-Type!)
export const getMultipartAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  // ✅ Return ONLY Authorization - let browser/axios set Content-Type with boundary
  return token 
    ? { 'Authorization': `Bearer ${token}` }
    : {};
};

// Helper: Handle API responses with proper error parsing
const handleResponse = async (response) => {
  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401) {
      // Token expired or invalid - try to refresh
      try {
        await refreshAccessToken();
        throw new Error('AUTH_RETRY');  // Signal to retry the request
      } catch {
        // Refresh failed - redirect to login
        logout();
        window.location.href = '/login';
        throw new Error('Authentication required. Please log in again.');
      }
    }
    
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.quota_exceeded) {
        throw new Error(`Document quota exceeded: ${errorData.error}`);
      }
      throw new Error('You do not have permission to perform this action.');
    }
    
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

// ✅ FIX #1: Get all documents with optional clientId and other filters
export const getDocuments = async (filters = {}) => {
  const params = new URLSearchParams();
  
  // ✅ Add clientId filter for client isolation
  if (filters.clientId) params.append('clientId', String(filters.clientId).trim());
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.documentType && filters.documentType !== 'all') params.append('documentType', filters.documentType);
  if (filters.practiceArea && filters.practiceArea !== 'all') params.append('practiceArea', filters.practiceArea);
  if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
  if (filters.dateRange && filters.dateRange !== 'all') params.append('dateRange', filters.dateRange);
  if (filters.needsReview !== undefined && filters.needsReview !== 'all') params.append('needsReview', filters.needsReview);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/documents${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, { headers: getAuthHeaders() });
  
  const cases = await handleResponse(response);

  return cases.map(case_item => {
    // Robust arguments handling (backend may return string with || or array)
    let argumentsArray = [];
    if (case_item.arguments) {
      if (Array.isArray(case_item.arguments)) {
        argumentsArray = case_item.arguments;
      } else if (typeof case_item.arguments === 'string') {
        argumentsArray = case_item.arguments.split('||').map(a => a.trim()).filter(Boolean);
      }
    }

    return {
      id: case_item.id,
      title: case_item.filename,
      filename: case_item.filename,
      uploadedAt: case_item.creation_date,
      status: case_item.status || 'Pending',
      type: case_item.document_type || 'unknown',
      size: case_item.file_size || case_item.size || null,
      fileExtension: case_item.filename ? case_item.filename.split('.').pop() : 'unknown',
      summary: case_item.summary,
      parties: case_item.parties,
      court: case_item.court,
      document_date: case_item.document_date,
      arguments: argumentsArray,                    // ← normalized to array
      document_language: case_item.document_language,
      practice_area: case_item.practice_area,
      priority: case_item.priority,
      confidence_score: case_item.confidence_score,
      needs_review: case_item.needs_review,
      client_id: case_item.client_id,
      user_id: case_item.user_id,
    // For compatibility with frontend expectations
    extractedInfo: {
      parties: case_item.parties ? case_item.parties.split(',').map(p => ({
        name: p.trim(),
        role: 'Unknown',
        type: 'Entity'
      })) : [],
      keyDates: case_item.document_date ? [{
        description: 'Document Date',
        date: case_item.document_date
      }] : [],
      financialTerms: [],
      riskAssessment: {
        overall: 'Unknown',
        factors: []
      }
    }
    };
  });
};

// ✅ FIXED: getDocumentById with robust arguments parsing
export const getDocumentById = async (id, clientId = null) => {
  const params = clientId ? `?clientId=${clientId}` : '';
  const response = await fetch(`${API_BASE_URL}/cases/${id}${params}`, {
    headers: getAuthHeaders()
  });

  let document = await handleResponse(response);
  if (!document) throw new Error('Document not found');

  // 🔥 ROBUST arguments handling
  let argumentsArray = [];
  if (document.arguments) {
    if (Array.isArray(document.arguments)) argumentsArray = document.arguments;
    else if (typeof document.arguments === 'string') {
      argumentsArray = document.arguments.split('||').map(a => a.trim()).filter(Boolean);
    }
  }

  const mockContent = `Document: ${document.filename}\n\n` +
    `Summary: ${document.summary || 'No summary available'}\n\n` +
    `Parties: ${document.parties || 'Not identified'}\n\n` +
    `Court: ${document.court || 'Not specified'}\n\n` +
    `Document Date: ${document.document_date || 'Not specified'}\n\n` +
    `Arguments:\n${argumentsArray.map((arg, i) => `${i + 1}. ${arg}`).join('\n') || 'No arguments extracted yet.'}`;

  return {
    ...document,
    arguments: argumentsArray,           // normalized
    content: mockContent,
    fileSize: document.file_size || document.size || null,
    size: document.file_size || document.size || null
  };
};

// ✅ FIX #2: Upload document with duplicate handling and proper auth headers
export const uploadDocument = async (file, title, language, classification, enableOCR, enableAdvancedAnalysis = true, clientId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('language', language || 'en');
  formData.append('classification', classification || 'auto');
  
  // ✅ FIX: Convert boolean to string for FormData
  formData.append('enableOCR', enableOCR ? 'true' : 'false');
  
  // Add clientId for proper document association
  if (clientId) {
    formData.append('clientId', String(clientId).trim());
  }
  
  // ✅ IMPORTANT: Do NOT set 'Content-Type' header manually for FormData
  // axios/fetch will automatically set it with the correct boundary
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: getMultipartAuthHeaders(),  // ✅ NO 'Content-Type' - let browser set it
    body: formData,
  });
  
  const result = await handleResponse(response);
  
  // ✅ Handle duplicate status from backend
  if (result.status === 'duplicate') {
    return {
      ...result,
      isDuplicate: true,
      message: result.message || `Document '${file.name}' already exists for this client`
    };
  }
  // 🔥 AUTO-ANALYZE if still Processing/Pending (fixes manual Analyze button requirement)
  if (result.id && (result.status === 'Processing' || result.status === 'Pending')) {
    try {
      await analyzeDocument(result.id, enableAdvancedAnalysis, clientId);
    } catch (e) {
      console.warn('Auto-analysis after upload failed (user can still trigger manually):', e);
    }
  }
  
  return result;
};

// Batch upload documents with client isolation
export const batchUploadDocuments = async (files, titles, languages, classifications, enableOCR, enableAdvancedAnalysis = true, clientId = null) => {
  const results = [];
  
  // Process files sequentially since Python backend doesn't have true batch endpoint
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadDocument(
        files[i],
        titles[i],
        languages[i],
        classifications[i],
        enableOCR,
        enableAdvancedAnalysis,
        clientId  // Pass clientId to each upload
      );
      results.push(result);
    } catch (error) {
      results.push({ 
        error: error.message, 
        filename: files[i].name,
        status: 'failed'
      });
    }
  }
  
  return results;
};

// Delete document (calls Python backend endpoint)
export const deleteDocument = async (id, clientId = null) => {
  const params = clientId ? `?clientId=${clientId}` : '';
  const response = await fetch(`${API_BASE_URL}/cases/${id}${params}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  
  return handleResponse(response);
};

// Analyze/re-analyze existing document
export const analyzeDocument = async (documentId, useAdvancedAnalysis = true, clientId = null) => {
  const params = clientId ? `?clientId=${clientId}` : '';
  const response = await fetch(`${API_BASE_URL}/cases/${documentId}/reanalyze${params}`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ useAdvancedAnalysis })
  });
  
  return handleResponse(response);
};

// Search documents with client isolation
export const searchDocuments = async (keyword, filters = {}) => {
  const params = new URLSearchParams();
  params.append('keyword', keyword);
  
  // ✅ Add clientId for search isolation
  if (filters.clientId) {
    const clientIdValue = String(filters.clientId).trim();
    if (clientIdValue && !['null', 'undefined', ''].includes(clientIdValue)) {
      params.append('clientId', clientIdValue);
    }
  }
  
  const queryString = params.toString();
  const response = await fetch(`${API_BASE_URL}/search?${queryString}`, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  
  const cases = await handleResponse(response);
  
  // Map to frontend format
  return cases.map(case_item => ({
    id: case_item.id,
    title: case_item.filename,
    filename: case_item.filename,
    uploadedAt: case_item.creation_date,
    status: case_item.status || 'Pending',
    type: case_item.document_type || 'unknown',
    summary: case_item.summary,
    parties: case_item.parties,
    court: case_item.court,
    client_id: case_item.client_id
  }));
};

// Get analytics with optional client filter
export const getAnalytics = async (clientId = null) => {
  const params = clientId ? `?clientId=${clientId}` : '';
  const response = await fetch(`${API_BASE_URL}/analytics${params}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// Get trends with optional client filter
export const getTrends = async (clientId = null) => {
  const params = clientId ? `?clientId=${clientId}` : '';
  const response = await fetch(`${API_BASE_URL}/trends${params}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// Extract text only (no analysis)
export const extractText = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/extract-text`, {
    method: 'POST',
    headers: getMultipartAuthHeaders(),  // ✅ NO 'Content-Type' for FormData
    body: formData,
  });
  
  return handleResponse(response);
};

// Health check for microservices
export const checkMicroservicesHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/microservices/health`, {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      const health = await response.json();
      return {
        overall_status: health.overall_status || 'healthy',
        python_backend: health.services?.gemini_api?.status || 'unknown',
        database: health.services?.database?.status || 'unknown',
        file_system: health.services?.file_system?.status || 'unknown'
      };
    }
    throw new Error('Backend not responding');
  } catch (error) {
    console.warn('Health check failed:', error);
    return {
      overall_status: 'unavailable',
      error: error.message,
      python_backend: 'unknown',
      database: 'unknown',
      file_system: 'unknown'
    };
  }
};

// Get practice areas with optional client filter
export const getPracticeAreas = async (clientId = null) => {
  const params = clientId ? `?clientId=${clientId}` : '';
  const response = await fetch(`${API_BASE_URL}/practice-areas${params}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// Get quick filter stats with client isolation
export const getQuickFilterStats = async (clientId = null) => {
  const params = clientId ? `?clientId=${clientId}` : '';
  const response = await fetch(`${API_BASE_URL}/quick-filters${params}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// Update case metadata
export const updateCaseMetadata = async (caseId, metadata, clientId = null) => {
  const params = clientId ? `?clientId=${clientId}` : '';
  const response = await fetch(`${API_BASE_URL}/cases/${caseId}/update-metadata${params}`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });
  return handleResponse(response);
};

// Format file size helper
export const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate file before upload
export const validateFile = (file, options = {}) => {
  const errors = [];
  const {
    maxFileSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  } = options;
  
  // Check file size
  if (file.size > maxFileSize) {
    errors.push(`File size exceeds ${formatFileSize(maxFileSize)} limit`);
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx?|txt)$/i)) {
    errors.push('Unsupported file format');
  }
  
  // Check filename
  if (file.name.length > 255) {
    errors.push('Filename too long (max 255 characters)');
  }
  
  return errors;
};

// 🔥 Token management helpers
export const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

export const isTokenExpired = (token = null) => {
  const tokenToCheck = token || getToken();
  if (!tokenToCheck) return true;
  
  try {
    const payload = JSON.parse(atob(tokenToCheck.split('.')[1]));
    return payload.exp ? payload.exp * 1000 <= Date.now() : false;
  } catch {
    return true;
  }
};

// Attempt to refresh the access token
export const refreshAccessToken = async () => {
  const token = getToken();
  if (!token) throw new Error('No token to refresh');

  const response = await fetch(`${AUTH_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  const newToken = data.token || data.accessToken;
  if (newToken) {
    localStorage.setItem('token', newToken);
  }
  return data;
};

// Logout helper
export const logout = async () => {
  try {
    const token = getToken();
    if (token) {
      await fetch(`${AUTH_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // Proceed with local cleanup even if server call fails
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedClientId');
    sessionStorage.clear();
    window.dispatchEvent(new Event('storage'));
  }
};

// Export default object for backward compatibility
export default {
  getDocuments,
  getDocumentById,
  uploadDocument,
  batchUploadDocuments,
  deleteDocument,
  analyzeDocument,
  searchDocuments,
  getTrends,
  getAnalytics,
  extractText,
  checkMicroservicesHealth,
  getPracticeAreas,
  getQuickFilterStats,
  updateCaseMetadata,
  formatFileSize,
  validateFile,
  getAuthHeaders,
  getMultipartAuthHeaders,
  getToken,
  isTokenExpired,
  refreshAccessToken,
  logout
};