import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldAlert, KeyRound, User, Briefcase } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth.api';

export const LoginPage = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('demo-admin');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const ROLES_INFO = [
    { id: 'admin', label: 'Admin', desc: 'Full Access', user: 'admin', pass: 'demo-admin' },
    { id: 'officer', label: 'Officer', desc: 'Screening', user: 'officer', pass: 'demo-officer' },
    { id: 'supervisor', label: 'Supervisor', desc: 'Overrides', user: 'supervisor', pass: 'demo-supervisor' },
    { id: 'auditor', label: 'Auditor', desc: 'Read Only', user: 'auditor', pass: 'demo-auditor' },
  ];

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    const target = ROLES_INFO.find(r => r.id === selectedRole);
    if (target) {
      setUsername(target.user);
      setPassword(target.pass);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await authApi.login(username, password, role);
      login(data.access_token, data.role);
      window.scrollTo(0, 0);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Login Form */}
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <motion.div 
          className="w-full max-w-md relative"
          initial={{ opacity: 0, y: 100, scale: 0.8, rotateX: 20 }}
          whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
        >
        <motion.div
          animate={{ 
            y: [-4, 4, -2, 5, -4],
            rotateZ: [-0.5, 0.3, -0.4, 0.5, -0.5],
            boxShadow: [
              "0 8px 32px rgba(6, 182, 212, 0.2)",
              "0 8px 48px rgba(6, 182, 212, 0.5)",
              "0 8px 24px rgba(168, 85, 247, 0.3)",
              "0 8px 40px rgba(6, 182, 212, 0.4)",
              "0 8px 32px rgba(6, 182, 212, 0.2)"
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.25, 0.5, 0.75, 1]
          }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden"
        >
          {/* Decorative corner accents with continuous pulse */}
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/80 rounded-tl-xl" 
          />
          <motion.div 
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/80 rounded-br-xl" 
          />

          <div className="flex flex-col items-center mb-6">
            <motion.div 
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4 border border-cyan-500/30 border-dashed"
            >
              <ShieldAlert className="w-8 h-8 text-cyan-400 absolute" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white tracking-widest font-mono">DOCSHIELD <span className="text-cyan-400">AUTH</span></h2>
            <p className="text-slate-400 text-sm mt-2 text-center">Restricted Access. Authorized personnel only.</p>
          </div>

          {/* Quick Preset Selector */}
          <div className="mb-6">
            <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Quick Select Demo Profile</span>
              <span className="text-slate-500 text-[10px]">1-Click Autofill</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900/80 rounded-lg border border-white/10">
              {ROLES_INFO.map((r) => {
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r.id)}
                    className={`py-1.5 px-2 rounded text-xs font-mono font-medium transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-3"
            >
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-rose-200 text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">Operator ID</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">Passcode</label>
              <div className="relative group">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">Clearance Level</label>
              <div className="relative group">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                <select 
                  value={role}
                  onChange={(e) => handleRoleSelect(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors font-mono text-sm appearance-none cursor-pointer"
                >
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="officer">Officer (Screening)</option>
                  <option value="supervisor">Supervisor (Overrides)</option>
                  <option value="auditor">Auditor (Read Only)</option>
                </select>
              </div>
            </div>

            <motion.button 
              type="submit" 
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-lg mt-4 transition-colors tracking-wide flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-500/20"
            >
              {loading ? 'AUTHENTICATING...' : 'INITIALIZE SESSION'}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
      </div>
    </>
  );
};
