// src/api/servicePlus.js - Updated with working backend integration

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

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
};

// ============================================================================
// DOCUMENT GENERATION FUNCTIONS (NOW IMPLEMENTED)
// ============================================================================

/**
 * Get available document templates
 */
export const getDocumentTemplates = async (category = 'all', jurisdiction = 'all') => {
  try {
    const params = new URLSearchParams();
    if (category !== 'all') params.append('category', category);
    if (jurisdiction !== 'all') params.append('jurisdiction', jurisdiction);

    const response = await fetch(`${API_BASE_URL}/service-plus/templates?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching document templates:', error);
    throw error;
  }
};

/**
 * Generate document from template
 */
export const generateDocument = async (templateId, parameters, options = {}) => {
  try {
    if (!templateId) {
      throw new Error('Template ID is required');
    }

    if (!parameters || typeof parameters !== 'object') {
      throw new Error('Parameters object is required');
    }

    const requestBody = {
      template_id: templateId,
      parameters: parameters,
      format: options.format || 'docx',
      ai_provider: options.aiProvider || 'gemini',
      user_id: options.userId || 'frontend_user',
      validate_compliance: options.validateCompliance !== false
    };

    const response = await fetch(`${API_BASE_URL}/service-plus/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error generating document:', error);
    throw error;
  }
};

/**
 * Get list of generated documents
 */
export const getGeneratedDocuments = async (page = 1, perPage = 10, filters = {}) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });

    if (filters.userId) params.append('user_id', filters.userId);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);

    const response = await fetch(`${API_BASE_URL}/service-plus/documents?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching generated documents:', error);
    throw error;
  }
};

/**
 * Get specific generated document
 */
export const getGeneratedDocument = async (generationId) => {
  try {
    if (!generationId) {
      throw new Error('Generation ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/service-plus/document/${generationId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching generated document:', error);
    throw error;
  }
};

/**
 * Validate document compliance
 */
export const validateDocumentCompliance = async (content, jurisdiction = 'general', documentType = 'contract') => {
  try {
    if (!content) {
      throw new Error('Document content is required');
    }

    const requestBody = {
      content: content,
      jurisdiction: jurisdiction,
      document_type: documentType
    };

    const response = await fetch(`${API_BASE_URL}/service-plus/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error validating document:', error);
    throw error;
  }
};

/**
 * Download generated document file
 */
// Alternative: Enhanced version that handles actual file downloads from backend
export const downloadGeneratedDocument = async (generationId) => {
  try {
    // First get the document details
    const generatedDoc = await getGeneratedDocument(generationId);
    
    if (!generatedDoc.file_path) {
      throw new Error('No file available for download');
    }

    // If backend provides file download endpoint
    const response = await fetch(`${API_BASE_URL}/service-plus/document/${generationId}/download`, {
      method: 'GET',
      headers: {
        'Accept': 'application/octet-stream',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download file from server');
    }

    // Get the file as blob
    const blob = await response.blob();
    
    // Create download URL
    const url = window.URL.createObjectURL(blob);
    
    // Get filename from response headers or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `${generatedDoc.document_name}.${generatedDoc.format_type}`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Create and trigger download
    const linkElement = window.document.createElement('a');
    linkElement.href = url;
    linkElement.download = filename;
    
    window.document.body.appendChild(linkElement);
    linkElement.click();
    window.document.body.removeChild(linkElement);
    
    // Clean up
    window.URL.revokeObjectURL(url);
    
    return { 
      success: true, 
      filename: filename,
      format: generatedDoc.format_type
    };
    
  } catch (error) {
    console.error('Error downloading document file:', error);
    // Fallback to content download
    return downloadGeneratedDocument(generationId);
  }
};

// ============================================================================
// DOCUMENT COMPARISON FUNCTIONS (EXISTING - UNCHANGED)
// ============================================================================

export const compareDocumentsFromDatabase = async (doc1Id, doc2Id) => {
  try {
    if (!doc1Id || !doc2Id) {
      throw new Error('Both document IDs are required');
    }
    
    if (doc1Id === doc2Id) {
      throw new Error('Cannot compare a document with itself');
    }

    const formData = new FormData();
    formData.append('doc1_id', doc1Id.toString());
    formData.append('doc2_id', doc2Id.toString());

    const response = await fetch(`${API_BASE_URL}/service-plus/advanced-compare`, {
      method: 'POST',
      body: formData,
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error comparing documents from database:', error);
    throw error;
  }
};

export const compareUploadedFiles = async (file1, file2) => {
  try {
    if (!file1 || !file2) {
      throw new Error('Both files are required');
    }

    const validationErrors1 = validateComparisonFile(file1);
    const validationErrors2 = validateComparisonFile(file2);
    
    if (validationErrors1.length > 0) {
      throw new Error(`File 1: ${validationErrors1.join(', ')}`);
    }
    if (validationErrors2.length > 0) {
      throw new Error(`File 2: ${validationErrors2.join(', ')}`);
    }

    const formData = new FormData();
    formData.append('file1', file1);
    formData.append('file2', file2);

    const response = await fetch(`${API_BASE_URL}/service-plus/compare`, {
      method: 'POST',
      body: formData,
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error comparing uploaded files:', error);
    throw error;
  }
};

export const getComparisonHistory = async (page = 1, perPage = 10, type = 'all') => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(type !== 'all' && { type })
    });

    const response = await fetch(`${API_BASE_URL}/service-plus/comparisons?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching comparison history:', error);
    throw error;
  }
};

export const getComparisonById = async (comparisonId) => {
  try {
    if (!comparisonId) {
      throw new Error('Comparison ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/service-plus/comparison/${comparisonId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching comparison details:', error);
    throw error;
  }
};

export const deleteComparison = async (comparisonId) => {
  try {
    if (!comparisonId) {
      throw new Error('Comparison ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/service-plus/comparison/${comparisonId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error deleting comparison:', error);
    throw error;
  }
};

// ============================================================================
// UPDATED SERVICE HEALTH CHECK
// ============================================================================

export const checkServicePlusHealth = async () => {
  try {
    // Check all three services
    const [comparisonCheck, generationCheck, analysisCheck] = await Promise.allSettled([
      fetch(`${API_BASE_URL}/service-plus/comparisons?page=1&per_page=1`),
      fetch(`${API_BASE_URL}/service-plus/templates`),
      fetch(`${API_BASE_URL}/service-plus/analyses?page=1&per_page=1`)
    ]);

    const comparisonAvailable = comparisonCheck.status === 'fulfilled' && 
      (comparisonCheck.value.ok || comparisonCheck.value.status === 404);
    
    const generationAvailable = generationCheck.status === 'fulfilled' && 
      generationCheck.value.ok;

    const analysisAvailable = analysisCheck.status === 'fulfilled' && 
      (analysisCheck.value.ok || analysisCheck.value.status === 404);

    let overallStatus = 'healthy';
    const activeServices = [comparisonAvailable, generationAvailable, analysisAvailable].filter(Boolean).length;
    
    if (activeServices === 0) {
      overallStatus = 'unavailable';
    } else if (activeServices < 3) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      service_plus_available: activeServices > 0,
      comparison_service: comparisonAvailable,
      generation_service: generationAvailable,
      analysis_service: analysisAvailable,
      active_services: activeServices,
      total_services: 3,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Service+ health check failed:', error);
    return {
      status: 'unavailable',
      service_plus_available: false,
      comparison_service: false,
      generation_service: false,
      analysis_service: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// ============================================================================
// UPDATED STATS FUNCTION
// ============================================================================

export const getServicePlusStats = async () => {
  try {
    const [comparisonData, generationData, analysisData] = await Promise.allSettled([
      getComparisonHistory(1, 100).catch(() => ({
        comparisons: [],
        pagination: { total_count: 0 }
      })),
      getGeneratedDocuments(1, 100).catch(() => ({
        documents: [],
        pagination: { total_count: 0 }
      })),
      getCaseAnalyses(1, 100).catch(() => ({
        analyses: [],
        pagination: { total_count: 0 }
      }))
    ]);

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Comparison stats
    const comparisons = comparisonData.status === 'fulfilled' ? comparisonData.value.comparisons || [] : [];
    const todayComparisons = comparisons.filter(comp => {
      if (!comp.compared_at) return false;
      const compDate = new Date(comp.compared_at);
      return compDate >= todayStart;
    }).length;

    const avgSimilarity = comparisons.length > 0
      ? Math.round(comparisons.reduce((sum, comp) => 
          sum + (comp.similarity_score || 0), 0) / comparisons.length * 100)
      : 0;

    // Generation stats
    const generations = generationData.status === 'fulfilled' ? generationData.value.documents || [] : [];
    const todayGenerations = generations.filter(doc => {
      if (!doc.created_at) return false;
      const docDate = new Date(doc.created_at);
      return docDate >= todayStart;
    }).length;

    // Analysis stats
    const analyses = analysisData.status === 'fulfilled' ? analysisData.value.analyses || [] : [];
    const todayAnalyses = analyses.filter(analysis => {
      if (!analysis.created_at) return false;
      const analysisDate = new Date(analysis.created_at);
      return analysisDate >= todayStart;
    }).length;

    return {
      totalComparisons: comparisonData.status === 'fulfilled' ? 
        comparisonData.value.pagination?.total_count || 0 : 0,
      todayComparisons,
      avgSimilarity,
      generatedDocuments: generationData.status === 'fulfilled' ? 
        generationData.value.pagination?.total_count || 0 : 0,
      todayGenerations,
      caseAnalyses: analysisData.status === 'fulfilled' ? 
        analysisData.value.pagination?.total_count || 0 : 0,
      todayAnalyses,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching Service+ stats:', error);
    return {
      totalComparisons: 0,
      todayComparisons: 0,
      avgSimilarity: 0,
      generatedDocuments: 0,
      todayGenerations: 0,
      caseAnalyses: 0,
      todayAnalyses: 0,
      error: error.message,
      lastUpdated: new Date().toISOString()
    };
  }
};

// ============================================================================
// VALIDATION AND UTILITY FUNCTIONS
// ============================================================================

export const validateComparisonFile = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return errors;
  }

  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const supportedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  const supportedExtensions = ['pdf', 'docx', 'txt'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (!supportedMimeTypes.includes(file.type) && !supportedExtensions.includes(fileExtension)) {
    errors.push(`Unsupported file format. Supported formats: PDF, DOCX, TXT`);
  }

  if (file.size > maxFileSize) {
    errors.push(`File size too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB (max 50MB)`);
  }

  if (file.size === 0) {
    errors.push('File appears to be empty');
  }

  return errors;
};

export const validateGenerationParameters = (templateId, parameters, requiredFields = []) => {
  const errors = [];

  if (!templateId) {
    errors.push('Template ID is required');
  }

  if (!parameters || typeof parameters !== 'object') {
    errors.push('Parameters object is required');
  }

  if (requiredFields.length > 0) {
    const missingFields = requiredFields.filter(field => 
      !parameters[field] || parameters[field].toString().trim() === ''
    );
    
    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  return errors;
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Export comparison report (existing function)
export const exportComparisonReport = (comparisonResult, format = 'json') => {
  try {
    const exportData = {
      comparison_id: comparisonResult.comparison_id,
      export_timestamp: new Date().toISOString(),
      documents: {
        document1: comparisonResult.doc1_name,
        document2: comparisonResult.doc2_name
      },
      analysis_results: {
        overall_similarity: comparisonResult.overall_similarity,
        comparison_type: 'advanced-gemini',
        clauses_compared: comparisonResult.clauses_compared
      },
      key_differences: comparisonResult.key_differences,
      gemini_analysis: comparisonResult.gemini_summary,
      semantic_analysis: comparisonResult.semantic_clause_diff,
      metadata: {
        generated_by: 'Legal Analyzer Service+',
        version: '1.0.0',
        format: format
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const timestamp = new Date().toISOString().split('T')[0];
    const exportFileName = `comparison-report-${timestamp}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();

    return {
      success: true,
      filename: exportFileName,
      format: 'json'
    };
  } catch (error) {
    console.error('Error exporting comparison report:', error);
    throw error;
  }
};

// ============================================================================
// CASE ANALYSIS FUNCTIONS (NOW IMPLEMENTED)
// ============================================================================

/**
 * Analyze case using multiple documents
 */
export const analyzeCaseDocuments = async (documentIds, analysisType, caseContext, userId = 'frontend_user') => {
  try {
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      throw new Error('Document IDs array is required and must not be empty');
    }

    const requestBody = {
      document_ids: documentIds,
      analysis_type: analysisType || 'case-strategy',
      case_context: caseContext || {},
      user_id: userId
    };

    const response = await fetch(`${API_BASE_URL}/service-plus/analyze-case`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching case analyses:', error);
    throw error;
  }
};

/**
 * Get specific case analysis
 */
export const getCaseAnalysis = async (analysisId) => {
  try {
    if (!analysisId) {
      throw new Error('Analysis ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/service-plus/analysis/${analysisId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching case analysis:', error);
    throw error;
  }
};

/**
 * Settlement analysis
 */
export const analyzeSettlementOpportunities = async (caseContext, legalIssues, damagesEstimate, litigationCosts) => {
  try {
    const requestBody = {
      case_context: caseContext || {},
      legal_issues: legalIssues || [],
      damages_estimate: damagesEstimate,
      litigation_costs: litigationCosts
    };

    const response = await fetch(`${API_BASE_URL}/service-plus/settlement-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error analyzing settlement opportunities:', error);
    throw error;
  }
};

/**
 * Research legal precedents
 */
export const researchPrecedents = async (legalIssues, jurisdiction, caseType, limit = 10) => {
  try {
    if (!Array.isArray(legalIssues) || legalIssues.length === 0) {
      throw new Error('Legal issues array is required');
    }

    const requestBody = {
      legal_issues: legalIssues,
      jurisdiction: jurisdiction || 'general',
      case_type: caseType || 'litigation',
      limit: limit
    };

    const response = await fetch(`${API_BASE_URL}/service-plus/research-precedents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error researching precedents:', error);
    throw error;
  }
};

/**
 * Assess case risks
 */
export const assessCaseRisk = async (legalIssues, caseContext, practiceArea = 'litigation') => {
  try {
    if (!Array.isArray(legalIssues) || legalIssues.length === 0) {
      throw new Error('Legal issues array is required');
    }

    const requestBody = {
      legal_issues: legalIssues,
      case_context: caseContext || {},
      practice_area: practiceArea
    };

    const response = await fetch(`${API_BASE_URL}/service-plus/assess-risk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error assessing case risk:', error);
    throw error;
  }
};

/**
 * Get strategic recommendations
 */
export const getStrategyRecommendations = async (legalIssues, caseContext, analysisType = 'case-strategy') => {
  try {
    if (!Array.isArray(legalIssues) || legalIssues.length === 0) {
      throw new Error('Legal issues array is required');
    }

    const requestBody = {
      legal_issues: legalIssues,
      case_context: caseContext || {},
      analysis_type: analysisType
    };

    const response = await fetch(`${API_BASE_URL}/service-plus/strategy-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error getting strategy recommendations:', error);
    throw error;
  }
};

/**
 * Generate case timeline
 */
export const generateCaseTimeline = async (caseType, jurisdiction, caseContext = {}) => {
  try {
    const requestBody = {
      case_type: caseType || 'litigation',
      jurisdiction: jurisdiction || 'federal',
      case_context: caseContext
    };

    const response = await fetch(`${API_BASE_URL}/service-plus/case-timeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error generating case timeline:', error);
    throw error;
  }
};

/**
 * Get case analysis history
 */
export const getCaseAnalyses = async (page = 1, perPage = 10, filters = {}) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });

    if (filters.userId) params.append('user_id', filters.userId);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);

    const response = await fetch(`${API_BASE_URL}/service-plus/analyses?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching case analyses:', error);
    throw error;
  }
};

/**
 * Get all clients belonging to the current authenticated user.
 * Calls GET /clients  (Flask blueprint endpoint in main.py)
 */
export const getClients = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/clients`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // credentials: 'include',  // uncomment if your backend uses cookie-based auth
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

// Export all functions
export default {
  // Document Comparison (existing)
  compareDocumentsFromDatabase,
  compareUploadedFiles,
  getComparisonHistory,
  getComparisonById,
  deleteComparison,
  
  // Document Generation (now implemented)
  getDocumentTemplates,
  generateDocument,
  getGeneratedDocuments,
  getGeneratedDocument,
  validateDocumentCompliance,
  downloadGeneratedDocument,
  
  // Case Analysis (now implemented)
  analyzeCaseDocuments,
  researchPrecedents,
  assessCaseRisk,
  getStrategyRecommendations,
  generateCaseTimeline,
  getCaseAnalyses,
  getCaseAnalysis,
  analyzeSettlementOpportunities,

  // Client management
  getClients,
  
  // Health and stats
  checkServicePlusHealth,
  getServicePlusStats,
  
  // Validation and utilities
  validateComparisonFile,
  validateGenerationParameters,
  formatFileSize,
  exportComparisonReport
};