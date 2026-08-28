import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  Scan,
  ScanFace,
  Activity,
  Server,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { screeningApi } from '../../api/screening.api';
import './Sidebar.css';

const MODULE_ITEMS = [
  {
    path: '/pipeline',
    aliases: ['/'],
    label: 'Risk Pipeline',
    sublabel: 'Full Assessment',
    badge: 'PRIMARY',
    icon: ShieldCheck,
  },
  {
    path: '/ocr',
    label: 'OCR Extraction',
    sublabel: 'Neural Text & MRZ',
    badge: 'OCR',
    icon: FileText,
  },
  {
    path: '/validation',
    label: 'Doc Validation',
    sublabel: 'Rule Engine & ICAO',
    badge: 'RULES',
    icon: CheckCircle2,
  },
  {
    path: '/tampering',
    label: 'Tampering Analysis',
    sublabel: 'ELA + CNN Forgery',
    badge: 'FORENSIC',
    icon: Scan,
  },
  {
    path: '/face',
    label: 'Face Verification',
    sublabel: 'Biometrics & Liveness',
    badge: 'DEEPFACE',
    icon: ScanFace,
  },
];

export function Sidebar() {
  const location = useLocation();
  const [healthStatus, setHealthStatus] = useState({
    online: false,
    pingMs: null,
    version: null,
    loading: true,
  });

  const checkServerHealth = async () => {
    const start = performance.now();
    try {
      const data = await screeningApi.checkHealth();
      const ping = Math.round(performance.now() - start);
      setHealthStatus({
        online: true,
        pingMs: ping,
        version: data?.version || 'v1.0.0',
        loading: false,
      });
    } catch (err) {
      setHealthStatus({
        online: false,
        pingMs: null,
        version: null,
        loading: false,
      });
    }
  };

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (item) => {
    if (item.aliases && item.aliases.includes(location.pathname)) return true;
    return location.pathname === item.path;
  };

  return (
    <motion.aside
      animate={{ 
        y: [-4, 4, -2, 5, -4],
        rotateZ: [-0.5, 0.3, -0.4, 0.5, -0.5],
        boxShadow: [
          "0 8px 32px rgba(6, 182, 212, 0.15)",
          "0 8px 48px rgba(6, 182, 212, 0.4)",
          "0 8px 24px rgba(168, 85, 247, 0.2)",
          "0 8px 40px rgba(6, 182, 212, 0.3)",
          "0 8px 32px rgba(6, 182, 212, 0.15)"
        ]
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.25, 0.5, 0.75, 1]
      }}
      className="sidebar overflow-hidden"
    >
      {/* Decorative corner accents with continuous pulse */}
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/80 rounded-tl-xl pointer-events-none" 
      />
      <motion.div 
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/80 rounded-br-xl pointer-events-none" 
      />

      {/* Sidebar Top Header */}
      <div className="sidebar__header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-cyan-400" />
          <span className="sidebar__title">Screening Modules</span>
        </div>
        <span className="text-[10px] font-mono text-cyan-400/70 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20">
          5 ACTIVE
        </span>
      </div>

      {/* Nav List */}
      <nav className="sidebar__nav">
        {MODULE_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar__item ${active ? 'sidebar__item--active' : ''}`}
            >
              {active && (
                <motion.div
                  layoutId="activeSidebarPill"
                  className="sidebar__active-pill"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              
              <Icon size={18} className="sidebar__icon" />
              
              <div className="sidebar__label flex flex-col">
                <span className="font-semibold">{item.label}</span>
                <span className="text-[10px] text-slate-400 font-normal leading-tight">
                  {item.sublabel}
                </span>
              </div>

              <span className="sidebar__badge">{item.badge}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Pinned Backend Health Card */}
      <div className="sidebar__health">
        <div className="sidebar__health-meta">
          {healthStatus.online && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Activity size={10} /> Latency
              </span>
              <span className="text-emerald-400">{healthStatus.pingMs}ms</span>
            </div>
          )}
          {healthStatus.version && (
            <div className="flex items-center justify-between">
              <span>Engine</span>
              <span className="text-cyan-400">{healthStatus.version}</span>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
