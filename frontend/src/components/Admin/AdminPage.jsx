import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { historyApi } from '../../api/history.api';
import { apiClient } from '../../api/client';
import { Shield, AlertTriangle, Search, Plus, Trash2, ShieldOff, ShieldAlert, Trash } from 'lucide-react';
import { Spinner, Badge } from '../common';

export const AdminPage = () => {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDocNum, setNewDocNum] = useState('');
  const [newReason, setNewReason] = useState('');
  const [search, setSearch] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  const fetchBlacklist = () => {
    setLoading(true);
    historyApi.getBlacklist()
      .then(data => {
        setBlacklist(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDocNum) return;
    setIsSubmitting(true);
    try {
      await historyApi.addToBlacklist({
        document_number: newDocNum,
        reason: newReason || 'MANUAL_FLAG',
        severity: 'high',
        status: 'active'
      });
      setNewDocNum('');
      setNewReason('');
      fetchBlacklist();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (docNum) => {
    if (!window.confirm(`Are you sure you want to deactivate blacklist entry for ${docNum}?`)) return;
    try {
      await historyApi.removeFromBlacklist(docNum);
      fetchBlacklist();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePurge = async () => {
    if (!window.confirm("WARNING: This will permanently purge all expired evidence artifacts across the entire system. Proceed?")) return;
    setIsPurging(true);
    try {
      const res = await apiClient.post('/api/privacy/purge');
      alert(`Purge complete. Removed ${res.data.removed_files} expired evidence files.`);
    } catch (err) {
      console.error(err);
      alert("Purge failed. Check console.");
    } finally {
      setIsPurging(false);
    }
  };

  const filtered = blacklist.filter(b => b.document_number.toLowerCase().includes(search.toLowerCase()) || b.reason?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pt-24 min-h-screen container mx-auto px-4 max-w-6xl pb-16">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-3">
            <Shield size={28} className="text-cyan-400" />
            <h1 className="text-3xl font-bold font-mono text-white tracking-widest uppercase">Global Threat Registry</h1>
        </div>
        
        <button 
          onClick={handlePurge}
          disabled={isPurging}
          className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-lg font-mono text-sm transition-colors"
        >
          {isPurging ? <Spinner size="sm" /> : <Trash size={16} />}
          Data Privacy Purge
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ADD TO REGISTRY FORM */}
        <div className="col-span-1">
          <div className="bg-black/40 backdrop-blur-md border border-rose-500/30 rounded-xl p-6 sticky top-24">
            <h2 className="text-xl font-mono text-rose-400 mb-4 flex items-center gap-2">
              <ShieldAlert size={20} /> Watchlist Directive
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Document Number</label>
                <input 
                  type="text" 
                  value={newDocNum} 
                  onChange={e => setNewDocNum(e.target.value)} 
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-rose-500/50 outline-none transition-colors"
                  placeholder="e.g. A1234567"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">Reason / Threat Vector</label>
                <input 
                  type="text" 
                  value={newReason} 
                  onChange={e => setNewReason(e.target.value)} 
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-rose-500/50 outline-none transition-colors"
                  placeholder="Known Forgery / Stolen"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting || !newDocNum}
                className="w-full py-3 px-4 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-mono font-bold rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Spinner size="sm" /> : <Plus size={18} />}
                Add to Registry
              </button>
            </form>
          </div>
        </div>

        {/* LIST */}
        <div className="col-span-2">
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-mono text-cyan-400">Active Threats</h2>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Search registry..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-black/60 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white font-mono outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center"><Spinner size="lg" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono">No matching records found in the registry.</div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filtered.map((item, idx) => (
                    <motion.div 
                      key={item.document_number}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex justify-between items-center p-4 rounded-lg border bg-black/60 ${item.status === 'active' ? 'border-rose-500/30' : 'border-white/10 opacity-50'}`}
                    >
                      <div className="flex items-center gap-4">
                        {item.status === 'active' ? <AlertTriangle className="text-rose-500" /> : <ShieldOff className="text-slate-500" />}
                        <div>
                          <div className="font-mono text-white font-bold">{item.document_number}</div>
                          <div className="text-xs font-mono text-slate-400 mt-1">{item.reason || 'No specific reason provided'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end gap-1">
                           <span className="text-[10px] text-slate-500 font-mono uppercase">Added</span>
                           <span className="text-xs text-slate-300 font-mono">{new Date(item.added_at).toLocaleDateString()}</span>
                        </div>
                        <Badge label={item.status} variant={item.status === 'active' ? 'critical' : 'neutral'} />
                        {item.status === 'active' && (
                          <button 
                            onClick={() => handleRemove(item.document_number)}
                            className="p-2 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white ml-2"
                            title="Deactivate Threat"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
