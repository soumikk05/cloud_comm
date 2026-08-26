import { motion } from 'motion/react';
import {
  ArrowLeft,
  Activity,
  BarChart3,
  FileText,
  ShieldCheck,
  Sparkles,
  Layers,
  Zap,
} from 'lucide-react';
import { Card, ProgressBar, Badge } from '../common';
import { RiskGauge } from './RiskGauge';
import { OcrResults } from './OcrResults';
import { ValidationPanel } from './ValidationPanel';
import { TamperingPanel } from './TamperingPanel';
import { FacePanel } from './FacePanel';
import { FlagsList } from './FlagsList';
import { DashboardNav } from './DashboardNav';
import { AuditPanel, TimelinePanel } from './OperationsPanels';
import { scoreToHex } from '../../utils/helpers';
import { AnimatedCounter } from '../common/AnimatedBg';
import './Dashboard.css';

export function Dashboard({ result, onBack }) {
  if (!result) return null;

  // Adapt data from either the old structure or the new backend structure
  const risk_score = result.risk_score ?? result.risk_summary?.risk_score ?? 0;
  const risk_label = result.risk_label ?? result.risk_summary?.risk_label ?? 'LOW';
  const flags = result.flags ?? result.risk_summary?.flags ?? [];
  
  // Backward compatibility with previous frontend payload vs new aggregate payload
  const ocr = result.module_outputs?.ocr || result.ocr || {};
  const validation = result.module_outputs?.validation || result.modules?.validation;
  const tampering = result.module_outputs?.tampering || result.modules?.tampering;
  const face = result.module_outputs?.face || result.modules?.face;
  const timeline = result.timeline || {};
  const audit = result.audit || {};

  const component_scores = result.component_scores || {
    validation: validation?.overall_valid ? 100 : 0,
    tampering: tampering?.tampering_score || 0,
    face: face?.match ? 100 : 0
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="dashboard container mx-auto px-4 max-w-7xl pb-24"
    >
      {/* Top action bar */}
      <div className="dashboard__header-row mb-8 flex justify-between items-center bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <motion.button
          whileHover={{ x: -4, scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 text-cyan-400 font-mono text-sm uppercase tracking-wider hover:text-cyan-300 transition-colors"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          <span>New Scan</span>
        </motion.button>

        <div className="dashboard__timestamp-pill flex items-center gap-2 text-slate-400 font-mono text-xs">
          <Activity size={14} className="text-emerald-400" />
          <span>Session: {new Date().toLocaleTimeString()} • Verified Stream</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <DashboardNav />
        
        <div className="flex-1 space-y-16 w-full">
          {/* Hero row: gauge + component scores + flags */}
          <div id="overview" className="scroll-mt-32">
            <div className="dashboard__hero-row">
              {/* Left: Risk Gauge & Component Breakdown */}
              <Card className="card--interactive" glowColor={scoreToHex(risk_score)}>
                <RiskGauge score={risk_score} label={risk_label} />

                {/* Component score breakdown */}
                <div className="component-scores mt-6">
                  {[
                    { key: 'validation', label: 'MRZ Validation', weight: '30%', icon: ShieldCheck },
                    { key: 'tampering', label: 'Tampering Forensics', weight: '40%', icon: Zap },
                    { key: 'face', label: 'Face Biometrics', weight: '30%', icon: Sparkles },
                  ].map(({ key, label, weight, icon: ScoreIcon }, idx) => {
                    const val = component_scores[key] ?? 0;
                    const color = scoreToHex(val);
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        whileHover={{ y: -3, scale: 1.02 }}
                        className="component-score"
                      >
                        <div className="component-score__header">
                          <ScoreIcon size={14} style={{ color }} />
                          <span className="component-score__label">{label}</span>
                          <span className="component-score__weight">{weight}</span>
                        </div>
                        <div className="component-score__val-row">
                          <span className="component-score__value" style={{ color }}>
                            <AnimatedCounter value={val} duration={1.5} />
                          </span>
                          <span className="component-score__max">/100</span>
                        </div>
                        <div className="component-score__bar">
                          <ProgressBar value={val} color={color} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </Card>

              {/* Right: Flags + summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                <FlagsList flags={flags} />

                {/* Quick summary card */}
                <Card
                  icon={BarChart3}
                  title="Screening Overview"
                  subtitle="Executive Risk Summary"
                  className="card--interactive"
                >
                  <div className="summary-stats-grid">
                    <div className="summary-stat">
                      <div className="summary-stat__label">Aggregated Risk</div>
                      <div className="summary-stat__val" style={{ color: scoreToHex(risk_score) }}>
                        <AnimatedCounter value={risk_score} duration={1.5} />
                        <span className="summary-stat__unit">/100</span>
                      </div>
                    </div>

                    <div className="summary-stat">
                      <div className="summary-stat__label">Verdict Classification</div>
                      <div className="summary-stat__val">
                        <Badge label={risk_label} variant={risk_label.toLowerCase()} />
                      </div>
                    </div>

                    <div className="summary-stat">
                      <div className="summary-stat__label">Document Format</div>
                      <div className="summary-stat__val mono text-xs">{ocr?.document_type || 'Unknown'}</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          <div id="ocr" className="scroll-mt-32">
            <OcrResults ocr={ocr} />
          </div>
          
          <div id="validation" className="scroll-mt-32">
            <ValidationPanel validation={validation} />
          </div>
          
          <div id="tampering" className="scroll-mt-32">
            <TamperingPanel tampering={tampering} />
          </div>
          
          <div id="face" className="scroll-mt-32">
            <FacePanel face={face} />
          </div>
          
          <TimelinePanel timeline={timeline} />
          <AuditPanel audit={audit} />

        </div>
      </div>
    </motion.div>
  );
}
