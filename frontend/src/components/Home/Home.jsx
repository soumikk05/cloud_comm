import React from 'react';
import { UploadPage } from '../Upload/UploadPage';
import { Dashboard } from '../Dashboard/Dashboard';
import { useAnalysis } from '../../hooks/useAnalysis';

export const Home = () => {
  const { result, loading, status, error, analyze, clearResult } = useAnalysis();

  return (
    <main className="app__main pt-24 min-h-screen">
      {result ? (
        <Dashboard result={result} onBack={clearResult} />
      ) : (
        <UploadPage onAnalyze={analyze} loading={loading} status={status} error={error} />
      )}
    </main>
  );
};
