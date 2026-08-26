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
    <aside className="sidebar">
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
        <div className="sidebar__health-top">
          <div className="sidebar__health-status">
            <span
              className={`sidebar__health-dot ${
                healthStatus.online
                  ? 'sidebar__health-dot--online'
                  : 'sidebar__health-dot--offline'
              }`}
            />
            <span
              style={{
                color: healthStatus.online ? '#10B981' : '#F43F5E',
              }}
            >
              {healthStatus.loading
                ? 'CHECKING...'
                : healthStatus.online
                ? 'ONLINE'
                : 'OFFLINE'}
            </span>
          </div>

          <button
            onClick={checkServerHealth}
            className="text-slate-400 hover:text-cyan-400 transition-colors p-1"
            title="Refresh Health Status"
          >
            <RefreshCw size={12} className={healthStatus.loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="sidebar__health-meta">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Server size={10} /> API Host
            </span>
            <span className="text-slate-300">127.0.0.1:8000</span>
          </div>
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
    </aside>
  );
}
