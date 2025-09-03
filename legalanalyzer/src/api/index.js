// src/api/index.js - Updated to include advanced analysis
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:5001/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  return response.json();
};

// Helper function for FormData requests
const createFormData = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (Array.isArray(data[key])) {
      data[key].forEach(item => formData.append(key, item));
    } else {
      // Convert booleans to lowercase string
      const value = typeof data[key] === 'boolean'
        ? data[key].toString().toLowerCase()
        : data[key];
      formData.append(key, value);
    }
  });
  return formData;
};

export const getDocumentById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/document/${id}`);
  return handleResponse(response);
};

export const deleteDocument = async (id) => {
  const response = await fetch(`${API_BASE_URL}/document/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete document: ${response.statusText}`);
  }
};

// Updated upload function with advanced analysis option
export const uploadDocument = async (file, title, language, classification, enableOCR, enableAdvancedAnalysis = true) => {
  const formData = createFormData({
    file,
    title,
    language,
    classification,
    enableOCR,
    enableAdvancedAnalysis, // New parameter for microservice analysis
  });

  const response = await fetch(`${API_BASE_URL}/document/upload`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse(response);
};

// Updated batch upload with advanced analysis
export const batchUploadDocuments = async (files, titles, languages, classifications, enableOCR, enableAdvancedAnalysis = true) => {
  const formData = createFormData({
    files,
    titles,
    languages,
    classifications,
    enableOCR,
    enableAdvancedAnalysis, // New parameter for microservice analysis
  });

  const response = await fetch(`${API_BASE_URL}/document/batch-upload`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse(response);
};

// New: Analyze existing document with advanced analysis
export const analyzeDocument = async (documentId, useAdvancedAnalysis = true) => {
  const response = await fetch(`${API_BASE_URL}/document/${documentId}/analyze?useAdvancedAnalysis=${useAdvancedAnalysis}`, {
    method: 'POST',
  });
  return handleResponse(response);
};

// New: Analyze all documents
export const analyzeAllDocuments = async (useAdvancedAnalysis = true) => {
  const response = await fetch(`${API_BASE_URL}/document/analyze?useAdvancedAnalysis=${useAdvancedAnalysis}`, {
    method: 'POST',
  });
  return handleResponse(response);
};

// New: Summarize document
export const summarizeDocument = async (documentId) => {
  const response = await fetch(`${API_BASE_URL}/document/${documentId}/summarize`, {
    method: 'POST',
  });
  return handleResponse(response);
};

// Health check for microservices
export const checkMicroservicesHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(response);
  } catch (error) {
    return {
      overall_status: 'unavailable',
      error: error.message
    };
  }
};