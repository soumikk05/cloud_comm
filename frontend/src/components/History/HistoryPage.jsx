import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { historyApi } from '../../api/history.api';
import { Card, Badge, Spinner } from '../common';
import { ShieldAlert, Calendar, ChevronRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    historyApi.getHistory().then(data => {
      setHistory(data.items || data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="pt-24 min-h-screen container mx-auto px-4 max-w-5xl pb-16">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <ShieldAlert size={28} className="text-cyan-400" />
        <h1 className="text-3xl font-bold font-mono text-white tracking-widest uppercase">Screening Ledger</h1>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Spinner size="lg" />
          <p className="text-cyan-400 font-mono text-sm animate-pulse">Decrypting history ledger...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.length === 0 && (
             <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-12 text-center text-slate-400 font-mono">
                No historical scans found on this node.
             </div>
          )}

          {history.map((record, idx) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/dashboard/${record.id}`)}
              className="bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-5 flex items-center justify-between cursor-pointer group hover:bg-cyan-950/20 hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-mono uppercase">ID</span>
                  <span className="text-slate-300 font-mono">{record.id.slice(0, 8)}...</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-mono uppercase flex items-center gap-1"><Calendar size={10} /> Date</span>
                  <span className="text-slate-300 font-mono text-sm">{new Date(record.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-mono uppercase flex items-center gap-1"><User size={10} /> Document</span>
                  <span className="text-slate-200 font-semibold">{record.document_type || 'Unknown'} - {record.document_number || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500 font-mono uppercase">Risk Protocol</span>
                  <Badge label={record.risk_label} variant={record.risk_label?.toLowerCase() || 'neutral'} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-500 font-mono uppercase">Score</span>
                  <span className={`font-mono font-bold text-lg ${record.risk_score > 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {record.risk_score}
                  </span>
                </div>
                <ChevronRight className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
