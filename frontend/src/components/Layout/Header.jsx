import { motion } from 'motion/react';
import { ShieldCheck, Activity, Cpu, Sparkles } from 'lucide-react';
import { CyberText } from '../common';
import './Header.css';

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="header"
    >
      <div className="header__inner">
        {/* Brand */}
        <Link to="/" className="header__brand" style={{ textDecoration: 'none' }}>
          <motion.div
            className="header__logo-wrap"
            animate={{
              boxShadow: [
                '0 0 15px rgba(14, 165, 233, 0.3)',
                '0 0 25px rgba(14, 165, 233, 0.6)',
                '0 0 15px rgba(14, 165, 233, 0.3)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ShieldCheck className="header__logo-icon" size={24} />
          </motion.div>
          <div>
            <div className="header__title-row">
              <span className="header__title"><CyberText text="DocShield" /></span>
              <span className="header__ai-tag">AI 2.0</span>
            </div>
            <div className="header__subtitle">
              <CyberText text="Forensic Document Screening & Fraud Intelligence" />
            </div>
          </div>
        </Link>

        {/* Right Nav / Stats */}
        <div className="header__meta">
          {user && (
            <div className="flex items-center gap-4 mr-4 border-r border-white/10 pr-6">
              <Link to="/" className="text-sm font-mono text-slate-300 hover:text-cyan-400 transition-colors">Screening</Link>
              
              {['officer', 'supervisor', 'admin', 'auditor'].includes(user.role) && (
                <Link to="/history" className="text-sm font-mono text-slate-300 hover:text-cyan-400 transition-colors">History</Link>
              )}

              {['admin', 'supervisor'].includes(user.role) && (
                <Link to="/admin" className="text-sm font-mono text-slate-300 hover:text-cyan-400 transition-colors">Admin</Link>
              )}
              
              <button onClick={handleLogout} className="text-sm font-mono text-rose-400 hover:text-rose-300 transition-colors ml-2">
                Logout
              </button>
            </div>
          )}

          <motion.div
            className="header__status"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <span className="header__status-beacon">
              <span className="header__status-dot" />
              <span className="header__status-ping" />
            </span>
            <span className="header__status-text">Pipeline Active</span>
          </motion.div>

          <div className="header__engines">
            <div className="header__engine-pill">
              <Cpu size={13} className="header__engine-icon" />
              <span>OCR + ELA</span>
            </div>
            <div className="header__engine-pill">
              <Activity size={13} className="header__engine-icon" />
              <span>DeepFace 512d</span>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__info">
          <Sparkles size={14} className="footer__sparkle" />
          <span>SIH AI Document Fraud Screening Engine • Real-time Multimodal Security Verification</span>
        </div>
        <div className="footer__badges">
          <span className="footer__badge">FastAPI v0.115</span>
          <span className="footer__badge">React 19 + Motion</span>
        </div>
      </div>
    </footer>
  );
}
