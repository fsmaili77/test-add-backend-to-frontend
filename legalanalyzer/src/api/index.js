// src/api.js

// Use Vite environment variables consistently
const API_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 
                    (import.meta.env.DEV ? 'http://localhost:3001' : '/api');
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5093/api';

// Helper: Get auth headers with Bearer token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token 
    ? { 'Authorization': `Bearer ${token}` }
    : {};
};

// Helper: Handle API responses with proper error parsing
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    let errorData = { error: `HTTP ${response.status}: ${errorText || response.statusText}` };
    
    try {
      // Try to parse JSON error response
      errorData = JSON.parse(errorText);
    } catch {
      // Keep the text error if JSON parsing fails
    }
    
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }
  return response.json();
};

// ✅ FIX #1: Get all documents with optional clientId and other filters
export const getDocuments = async (filters = {}) => {
  const params = new URLSearchParams();
  
  // Add clientId filter for client isolation
  if (filters.clientId) {
    params.append('clientId', filters.clientId);
  }
  
  // Add other optional filters
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters.documentType && filters.documentType !== 'all') {
    params.append('documentType', filters.documentType);
  }
  if (filters.practiceArea && filters.practiceArea !== 'all') {
    params.append('practiceArea', filters.practiceArea);
  }
  if (filters.priority && filters.priority !== 'all') {
    params.append('priority', filters.priority);
  }
  if (filters.dateRange && filters.dateRange !== 'all') {
    params.append('dateRange', filters.dateRange);
  }
  if (filters.needsReview !== undefined && filters.needsReview !== 'all') {
    params.append('needsReview', filters.needsReview);
  }
  
  const queryString = params.toString();
  const url = `${API_BASE_URL}/documents${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  });
  
  const cases = await handleResponse(response);
  
  // Map Python backend response to frontend format
  return cases.map(case_item => ({
    id: case_item.id,
    title: case_item.filename,
    filename: case_item.filename,
    uploadedAt: case_item.creation_date,
    status: case_item.status || 'Pending',
    type: case_item.document_type || 'unknown',
    size: case_item.file_size || null,
    fileExtension: case_item.filename ? case_item.filename.split('.').pop() : 'unknown',
    summary: case_item.summary,
    parties: case_item.parties,
    court: case_item.court,
    document_date: case_item.document_date,
    arguments: case_item.arguments ? case_item.arguments.split('||') : [],
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
  }));
};

// Get document by ID with client context
export const getDocumentById = async (id, clientId = null) => {
  const params = clientId ? `?clientId=${clientId}` : '';
  const response = await fetch(`${API_BASE_URL}/cases/${id}${params}`, {
    headers: getAuthHeaders()
  });
  
  const document = await handleResponse(response);
  
  if (!document) {
    throw new Error('Document not found');
  }
  
  // Add mock content for viewer (since Python backend doesn't store full content)
  return {
    ...document,
    content: `Document: ${document.filename}\n\nSummary: ${document.summary || 'No summary available'}\n\nParties: ${document.parties || 'Not identified'}\n\nCourt: ${document.court || 'Not specified'}\n\nDocument Date: ${document.document_date || 'Not specified'}\n\nArguments:\n${(document.arguments || []).map((arg, index) => `${index + 1}. ${arg}`).join('\n')}`
  };
};

// ✅ FIX #2: Upload document with duplicate handling
export const uploadDocument = async (file, title, language, classification, enableOCR, enableAdvancedAnalysis = true, clientId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('language', language || 'en');
  formData.append('classification', classification || 'auto');
  formData.append('enableOCR', enableOCR ? 'true' : 'false');
  
  // Add clientId for proper document association
  if (clientId) {
    formData.append('clientId', clientId);
  }
  
  // ✅ IMPORTANT: Do NOT set 'Content-Type' header manually for FormData
  // Axios/fetch will automatically set it with the correct boundary
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: getAuthHeaders(), // No 'Content-Type' - let browser set it
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
        clientId // Pass clientId to each upload
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
  
  // Add clientId for search isolation
  if (filters.clientId) {
    params.append('clientId', filters.clientId);
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
    headers: getAuthHeaders(), // No 'Content-Type' for FormData
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