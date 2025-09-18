// src/api.js - Updated with file size and extracted text support for Python backend
const API_BASE_URL = window.API_BASE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '/api');

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
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

// Helper function to format file size
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get all documents (maps to Flask /cases endpoint) - Updated with file_size
export const getDocuments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases`);
    const cases = await handleResponse(response);
    
    // Map Python backend response to frontend format
    return cases.map(case_item => ({
      id: case_item.id,
      title: case_item.title || case_item.filename,
      filename: case_item.filename,
      uploadedAt: case_item.creation_date,
      status: case_item.status === 'Analyzed' ? 'Analyzed' : case_item.status || 'Pending',
      type: case_item.document_type || 'unknown',
      size: case_item.file_size || 0, // Now using actual file size from database
      fileSize: case_item.file_size || 0, // Alternative property name
      fileSizeFormatted: formatFileSize(case_item.file_size), // Pre-formatted size
      fileExtension: case_item.filename ? case_item.filename.split('.').pop().toUpperCase() : 'unknown',
      summary: case_item.summary,
      parties: case_item.parties,
      court: case_item.court,
      document_date: case_item.document_date,
      arguments: case_item.arguments ? case_item.arguments.split('||') : [],
      document_language: case_item.document_language,
      analysis_duration_ms: case_item.analysis_duration_ms,
      classification: case_item.classification,
      // For compatibility with frontend expectations
      hasAdvancedAnalysis: case_item.status === 'Analyzed' && !!case_item.summary,
      analysisProgress: case_item.status === 'Analyzed' ? 100 : 0,
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
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw new Error('Failed to fetch documents from server');
  }
};

// Get document by ID with extracted text content
export const getDocumentById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${id}`);
    const case_item = await handleResponse(response);
    
    // Map the response to frontend format including extracted_text
    const document = {
      id: case_item.id,
      title: case_item.title || case_item.filename,
      filename: case_item.filename,
      uploadedAt: case_item.creation_date,
      status: case_item.status === 'Analyzed' ? 'Analyzed' : case_item.status || 'Pending',
      type: case_item.document_type || 'unknown',
      size: case_item.file_size || 0,
      fileSize: case_item.file_size || 0,
      fileSizeFormatted: formatFileSize(case_item.file_size),
      fileExtension: case_item.filename ? case_item.filename.split('.').pop().toUpperCase() : 'unknown',
      summary: case_item.summary,
      parties: case_item.parties,
      court: case_item.court,
      document_date: case_item.document_date,
      arguments: case_item.arguments ? case_item.arguments.split('||') : [],
      document_language: case_item.document_language,
      analysis_duration_ms: case_item.analysis_duration_ms,
      classification: case_item.classification,
      // Use the extracted_text from database as the main content
      content: case_item.extracted_text || generateFallbackContent(case_item),
      rawText: case_item.extracted_text, // Keep original extracted text
      pages: 1, // Default to 1 page since we don't track pages
      hasAdvancedAnalysis: case_item.status === 'Analyzed' && !!case_item.summary,
      analysisProgress: case_item.status === 'Analyzed' ? 100 : 0,
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

    return document;
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    throw error;
  }
};

// Get extracted text specifically for a document
export const getDocumentText = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${id}/text`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching document text:', error);
    throw error;
  }
};

// Helper function to generate fallback content if extracted_text is empty
const generateFallbackContent = (case_item) => {
  const sections = [];
  
  sections.push(`DOCUMENT: ${case_item.filename || 'Unknown'}`);
  sections.push('=' + '='.repeat((case_item.filename || 'Unknown').length + 9));
  sections.push('');
  
  if (case_item.file_size) {
    sections.push(`File Size: ${formatFileSize(case_item.file_size)}`);
    sections.push('');
  }
  
  if (case_item.summary) {
    sections.push('SUMMARY');
    sections.push('-------');
    sections.push(case_item.summary);
    sections.push('');
  }
  
  if (case_item.parties) {
    sections.push('PARTIES');
    sections.push('-------');
    case_item.parties.split(',').forEach(party => {
      sections.push(`• ${party.trim()}`);
    });
    sections.push('');
  }
  
  if (case_item.court) {
    sections.push('COURT INFORMATION');
    sections.push('-----------------');
    sections.push(`Court: ${case_item.court}`);
    sections.push('');
  }
  
  if (case_item.document_date) {
    sections.push('DOCUMENT DATE');
    sections.push('-------------');
    sections.push(`Date: ${case_item.document_date}`);
    sections.push('');
  }
  
  if (case_item.arguments && case_item.arguments.includes('||')) {
    const args = case_item.arguments.split('||');
    sections.push('KEY ARGUMENTS');
    sections.push('-------------');
    args.forEach((arg, index) => {
      sections.push(`${index + 1}. ${arg}`);
    });
    sections.push('');
  }
  
  if (case_item.document_language) {
    sections.push('LANGUAGE');
    sections.push('--------');
    sections.push(`Document Language: ${case_item.document_language}`);
    sections.push('');
  }
  
  sections.push('ANALYSIS STATUS');
  sections.push('---------------');
  sections.push(`Status: ${case_item.status}`);
  sections.push(`Analysis Engine: Google Gemini AI`);
  sections.push(`Document Type: ${case_item.document_type || 'Unknown'}`);
  
  if (case_item.analysis_duration_ms) {
    sections.push(`Analysis Duration: ${case_item.analysis_duration_ms}ms`);
  }
  
  sections.push('');
  sections.push('NOTE: This is a generated preview. The original extracted text may be available through the Python backend.');
  
  return sections.join('\n');
};

// Upload document (maps to Flask /analyze endpoint)
export const uploadDocument = async (file, title, language = 'en', classification = 'auto', enableOCR = true, enableAdvancedAnalysis = true) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Add optional parameters if your Python backend supports them
  if (title && title !== file.name) {
    formData.append('title', title);
  }
  if (language !== 'en') {
    formData.append('language', language);
  }
  if (classification !== 'auto') {
    formData.append('classification', classification);
  }
  if (!enableOCR) {
    formData.append('enableOCR', 'false');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      if (response.status === 503) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      } else if (response.status === 500) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Analysis failed due to server error.');
      } else if (response.status === 413) {
        throw new Error('File too large. Maximum size is 50MB.');
      } else if (response.status === 415) {
        throw new Error('Unsupported file format. Please use PDF, DOCX, or TXT files.');
      } else {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
    }
    
    const result = await response.json();
    return {
      id: result.id || result.case_id,
      status: 'success',
      message: result.message || 'Document uploaded and analyzed successfully',
      filename: file.name,
      fileSize: result.file_size || file.size,
      analysis_duration_ms: result.analysis_duration_ms,
      analysis: result
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Batch upload documents (sequential processing since Python backend doesn't have batch endpoint)
export const batchUploadDocuments = async (files, titles, languages, classifications, enableOCR = true, enableAdvancedAnalysis = true) => {
  const results = [];
  
  // Process files sequentially to avoid overwhelming the server
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
      
      // Add a small delay between uploads to be respectful to the server
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
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

// Delete document (now supported by Python backend)
export const deleteDocument = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${id}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      return await response.json();
    } else if (response.status === 404) {
      throw new Error('Document not found');
    } else {
      throw new Error('Failed to delete document');
    }
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

// Analyze existing document (re-analysis using Python backend)
export const analyzeDocument = async (documentId, useAdvancedAnalysis = true) => {
  try {
    const response = await fetch(`${API_BASE_URL}/cases/${documentId}/reanalyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        advanced_analysis: useAdvancedAnalysis
      })
    });
    
    if (response.ok) {
      return await response.json();
    } else if (response.status === 404) {
      throw new Error('Document not found');
    } else {
      throw new Error('Failed to re-analyze document');
    }
  } catch (error) {
    console.error('Re-analysis error:', error);
    throw error;
  }
};

// Search documents (maps to Flask /search endpoint)
export const searchDocuments = async (keyword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/search?keyword=${encodeURIComponent(keyword)}`);
    const cases = await handleResponse(response);
    
    // Map to frontend format with file sizes
    return cases.map(case_item => ({
      id: case_item.id,
      title: case_item.title || case_item.filename,
      filename: case_item.filename,
      uploadedAt: case_item.creation_date,
      status: case_item.status === 'Analyzed' ? 'Analyzed' : case_item.status || 'Pending',
      type: case_item.document_type || 'unknown',
      size: case_item.file_size || 0,
      fileSizeFormatted: formatFileSize(case_item.file_size),
      summary: case_item.summary,
      parties: case_item.parties,
      court: case_item.court,
      snippet: case_item.summary ? case_item.summary.substring(0, 200) + '...' : '',
      relevanceScore: 0.95 // Mock relevance score
    }));
  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Failed to search documents');
  }
};

// Get trends (maps to Flask /trends endpoint)
export const getTrends = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/trends`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Trends error:', error);
    throw error;
  }
};

// Get analytics (maps to Flask /analytics endpoint)
export const getAnalytics = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Analytics error:', error);
    throw error;
  }
};

// Extract text only (maps to Flask /extract-text endpoint)
export const extractText = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(`${API_BASE_URL}/extract-text`, {
      method: 'POST',
      body: formData,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to extract text from document');
  }
};

// Health check for Python backend
export const checkMicroservicesHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const healthData = await response.json();
      return {
        overall_status: 'healthy',
        python_backend: 'healthy',
        database: healthData.database || 'connected',
        timestamp: healthData.timestamp || new Date().toISOString()
      };
    } else {
      throw new Error('Health check failed');
    }
  } catch (error) {
    console.error('Health check error:', error);
    return {
      overall_status: 'unavailable',
      python_backend: 'unavailable',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Get document statistics
export const getDocumentStats = async () => {
  try {
    const documents = await getDocuments();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
    
    return {
      total: documents.length,
      analyzed: documents.filter(doc => doc.status === 'Analyzed').length,
      pending: documents.filter(doc => doc.status === 'Pending' || doc.status === 'Processing').length,
      errors: documents.filter(doc => doc.status === 'Error').length,
      today: documents.filter(doc => {
        const uploadDate = new Date(doc.uploadedAt);
        return uploadDate >= today;
      }).length,
      totalSize: totalSize,
      totalSizeFormatted: formatFileSize(totalSize),
      by_type: documents.reduce((acc, doc) => {
        const type = doc.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error('Error getting document stats:', error);
    throw error;
  }
};

// Utility function to validate file before upload
export const validateFile = (file) => {
  const errors = [];
  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const supportedFormats = ['PDF', 'DOCX', 'TXT', 'DOC'];
  const fileExtension = file.name.split('.').pop().toUpperCase();
  
  if (!supportedFormats.includes(fileExtension)) {
    errors.push(`Unsupported format: ${fileExtension}. Supported formats: ${supportedFormats.join(', ')}`);
  }
  
  if (file.size > maxFileSize) {
    errors.push(`File too large: ${formatFileSize(file.size)} (max 50MB)`);
  }
  
  if (file.name.length > 255) {
    errors.push('Filename too long (max 255 characters)');
  }
  
  return errors;
};

export default {
  getDocuments,
  getDocumentById,
  getDocumentText,
  uploadDocument,
  batchUploadDocuments,
  deleteDocument,
  analyzeDocument,
  searchDocuments,
  getTrends,
  getAnalytics,
  extractText,
  checkMicroservicesHealth,
  getDocumentStats,
  formatFileSize,
  validateFile
};