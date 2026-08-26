import { motion } from 'motion/react';
import { Card } from '../common';
import { Clock, Shield, Database, Activity } from 'lucide-react';

export const AuditPanel = ({ audit }) => {
  if (!audit || !audit.audit_hash) return null;

  return (
    <div id="audit" className="dashboard-section scroll-mt-32">
      <Card 
        icon={Database} 
        title="Blockchain Audit Trail" 
        subtitle="Tamper-Evident Cryptographic Ledger"
        className="card--interactive"
        glowColor="#0ea5e9"
      >
        <div className="space-y-4 font-mono text-sm mt-4">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-slate-400">Timestamp</span>
            <span className="text-cyan-300 font-bold">{new Date(audit.timestamp).toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-slate-400">Inspecting Officer</span>
            <span className="text-cyan-300 font-bold">{audit.officer || 'SYSTEM_AUTO'}</span>
          </div>
          <div className="flex flex-col gap-1 border-b border-white/5 pb-2">
            <span className="text-slate-400">Previous Hash Link</span>
            <span className="text-xs text-rose-300 break-all bg-black/40 p-3 rounded-lg border border-white/10 shadow-inner">
              {audit.previous_hash || 'GENESIS_BLOCK'}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-400">Current Cryptographic Signature</span>
            <span className="text-xs text-emerald-400 break-all bg-black/40 p-3 rounded-lg border border-white/10 shadow-inner">
              {audit.audit_hash}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const TimelinePanel = ({ timeline }) => {
  if (!timeline || Object.keys(timeline).length === 0) return null;

  return (
    <div id="timeline" className="dashboard-section scroll-mt-32">
      <Card 
        icon={Activity} 
        title="Processing Metrics" 
        subtitle="Micro-service Execution Times"
        className="card--interactive"
        glowColor="#a855f7"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {Object.entries(timeline).map(([stage, ms], idx) => (
            <motion.div 
              key={stage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-4 flex flex-col justify-center items-center gap-2 relative overflow-hidden group hover:border-purple-500/30 transition-colors"
            >
              <div 
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500/20 to-purple-500/80 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all" 
                style={{ width: `${Math.min(100, (ms / 2000) * 100)}%` }} 
              />
              <span className="text-slate-400 text-xs font-mono uppercase tracking-wider">{stage}</span>
              <span className="text-2xl font-bold font-mono text-white">
                {ms} <span className="text-xs text-purple-400">ms</span>
              </span>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
};
