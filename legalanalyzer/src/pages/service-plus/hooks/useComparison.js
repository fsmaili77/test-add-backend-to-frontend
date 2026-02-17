// src/pages/service-plus/hooks/useComparison.js
import { useState, useCallback } from 'react';
import { 
  compareDocumentsFromDatabase, 
  compareUploadedFiles, 
  validateComparisonFile,
  exportComparisonReport 
} from '../../../api/servicePlus';

export const useComparison = () => {
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const simulateProgress = useCallback(() => {
    setProgress(10);
    setTimeout(() => setProgress(30), 500);
    setTimeout(() => setProgress(60), 1500);
    setTimeout(() => setProgress(90), 3000);
  }, []);

  const compareDocuments = useCallback(async ({ 
    mode, 
    doc1Id, 
    doc2Id, 
    file1, 
    file2 
  }) => {
    setComparing(true);
    setError(null);
    setComparisonResult(null);
    setProgress(0);
    
    simulateProgress();

    try {
      let result;

      if (mode === 'database') {
        if (!doc1Id || !doc2Id) {
          throw new Error('Please select two documents to compare.');
        }
        if (doc1Id === doc2Id) {
          throw new Error('Cannot compare a document with itself. Please select two different documents.');
        }
        result = await compareDocumentsFromDatabase(doc1Id, doc2Id);
      } else {
        if (!file1 || !file2) {
          throw new Error('Please upload two files to compare.');
        }
        
        // Validate files
        const errors1 = validateComparisonFile(file1);
        const errors2 = validateComparisonFile(file2);
        
        if (errors1.length > 0) {
          throw new Error(`File 1: ${errors1.join(', ')}`);
        }
        if (errors2.length > 0) {
          throw new Error(`File 2: ${errors2.join(', ')}`);
        }
        
        result = await compareUploadedFiles(file1, file2);
      }

      setProgress(100);
      setTimeout(() => {
        setComparisonResult(result);
      }, 500);

      return result;
    } catch (err) {
      console.error('Comparison error:', err);
      setError(err.message || 'Comparison failed. Please try again.');
      setProgress(0);
      throw err;
    } finally {
      setTimeout(() => {
        setComparing(false);
        setProgress(0);
      }, 1000);
    }
  }, [simulateProgress]);

  const exportReport = useCallback((result, format = 'json') => {
    try {
      return exportComparisonReport(result, format);
    } catch (err) {
      setError('Failed to export comparison report');
      throw err;
    }
  }, []);

  const resetComparison = useCallback(() => {
    setComparisonResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    comparing,
    comparisonResult,
    error,
    progress,
    compareDocuments,
    exportReport,
    resetComparison
  };
};