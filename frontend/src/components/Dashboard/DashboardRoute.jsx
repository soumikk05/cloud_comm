import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { operationsApi } from '../../api/operations.api';

export const DashboardRoute = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the hydration payload for this specific screening ID
    operationsApi.getDashboard(id).then(data => {
      setResult(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="pt-24 min-h-screen text-center text-cyan-400">Loading Dashboard...</div>;
  }

  if (!result) {
    return <div className="pt-24 min-h-screen text-center text-rose-400">Failed to load Dashboard data.</div>;
  }

  return (
    <div className="pt-24 min-h-screen">
      <Dashboard result={result} onBack={() => window.history.back()} />
    </div>
  );
};
