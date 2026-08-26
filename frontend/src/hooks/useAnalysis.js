import { useState, useCallback } from 'react';
import { screeningApi } from '../api/screening.api';

export function useAnalysis() {
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState('');
  const [error, setError]       = useState(null);

  const analyze = useCallback(async (documentFile, selfieFile) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setStatus('Running pre-flight diagnostics...');

    try {
      // 1. Pre-flight: Check Image Quality
      const qualityData = await screeningApi.checkImageQuality(documentFile);
      if (!qualityData.is_acceptable) {
        throw new Error(`Image quality is too low: ${qualityData.reason}`);
      }

      // 2. Pre-flight: Classify Document
      setStatus('Classifying document structure...');
      const classData = await screeningApi.classifyDocument(documentFile);
      
      // 3. Full Assessment
      setStatus(`Analyzing ${classData.document_type || 'document'}...`);
      const data = await screeningApi.assessRisk(documentFile, selfieFile);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Analysis failed');
      throw err;
    } finally {
      setLoading(false);
      setStatus('');
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setStatus('');
  }, []);

  return { result, loading, status, error, analyze, clearResult };
}
