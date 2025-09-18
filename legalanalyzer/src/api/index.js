// src/api.js - Updated for Python Flask backend
const API_BASE_URL = window.API_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '/api');

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  return response.json();
};

// Get all documents (maps to Flask /cases endpoint)
export const getDocuments = async () => {
  const response = await fetch(`${API_BASE_URL}/cases`);
  const cases = await handleResponse(response);
  
  // Map Python backend response to frontend format
  return cases.map(case_item => ({
    id: case_item.id,
    title: case_item.filename,
    filename: case_item.filename,
    uploadedAt: case_item.creation_date,
    status: case_item.summary ? 'Analyzed' : 'Pending',
    type: case_item.document_type || 'unknown',
    size: null, // Not stored in Python backend
    fileExtension: case_item.filename ? case_item.filename.split('.').pop() : 'unknown',
    summary: case_item.summary,
    parties: case_item.parties,
    court: case_item.court,
    document_date: case_item.document_date,
    arguments: case_item.arguments ? case_item.arguments.split('||') : [],
    document_language: case_item.document_language,
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

// Get document by ID
export const getDocumentById = async (id) => {
  const documents = await getDocuments();
  const document = documents.find(doc => doc.id.toString() === id.toString());
  
  if (!document) {
    throw new Error('Document not found');
  }
  
  // Add mock content for viewer (since Python backend doesn't store full content)
  return {
    ...document,
    content: `Document: ${document.filename}\n\nSummary: ${document.summary || 'No summary available'}\n\nParties: ${document.parties || 'Not identified'}\n\nCourt: ${document.court || 'Not specified'}\n\nDocument Date: ${document.document_date || 'Not specified'}\n\nArguments:\n${document.arguments.map((arg, index) => `${index + 1}. ${arg}`).join('\n')}`
  };
};

// Upload document (maps to Flask /analyze endpoint)
export const uploadDocument = async (file, title, language, classification, enableOCR, enableAdvancedAnalysis = true) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });
  
  return handleResponse(response);
};

// Batch upload documents
export const batchUploadDocuments = async (files, titles, languages, classifications, enableOCR, enableAdvancedAnalysis = true) => {
  const results = [];
  
  // Process files sequentially since Python backend doesn't have batch endpoint
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadDocument(
        files[i],
        titles[i],
        languages[i],
        classifications[i],
        enableOCR,
        enableAdvancedAnalysis
      );
      results.push(result);
    } catch (error) {
      results.push({ error: error.message, filename: files[i].name });
    }
  }
  
  return results;
};

// Delete document (not implemented in Python backend, mock response)
export const deleteDocument = async (id) => {
  // Since Python backend doesn't have delete endpoint, return success
  // You may want to implement this in your Python backend
  console.warn('Delete functionality not implemented in Python backend');
  return Promise.resolve();
};

// Analyze existing document (re-analyze using Python backend)
export const analyzeDocument = async (documentId, useAdvancedAnalysis = true) => {
  // Since Python backend doesn't have re-analysis endpoint, return mock success
  console.warn('Re-analysis functionality not implemented in Python backend');
  return Promise.resolve({
    status: 'Analyzed',
    message: 'Analysis completed'
  });
};

// Search documents (maps to Flask /search endpoint)
export const searchDocuments = async (keyword) => {
  const response = await fetch(`${API_BASE_URL}/search?keyword=${encodeURIComponent(keyword)}`);
  const cases = await handleResponse(response);
  
  // Map to frontend format
  return cases.map(case_item => ({
    id: case_item.id,
    title: case_item.filename,
    filename: case_item.filename,
    uploadedAt: case_item.creation_date,
    status: case_item.summary ? 'Analyzed' : 'Pending',
    type: case_item.document_type || 'unknown',
    summary: case_item.summary,
    parties: case_item.parties,
    court: case_item.court
  }));
};

// Get trends (maps to Flask /trends endpoint)
export const getTrends = async () => {
  const response = await fetch(`${API_BASE_URL}/trends`);
  return handleResponse(response);
};

// Get analytics (maps to Flask /analytics endpoint)  
export const getAnalytics = async () => {
  const response = await fetch(`${API_BASE_URL}/analytics`);
  return handleResponse(response);
};

// Extract text only (maps to Flask /extract-text endpoint)
export const extractText = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/extract-text`, {
    method: 'POST',
    body: formData,
  });
  
  return handleResponse(response);
};

// Health check
export const checkMicroservicesHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases`);
    if (response.ok) {
      return {
        overall_status: 'healthy',
        python_backend: 'healthy'
      };
    }
    throw new Error('Backend not responding');
  } catch (error) {
    return {
      overall_status: 'unavailable',
      error: error.message
    };
  }
};