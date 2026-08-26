import { motion } from 'motion/react';
import {
  Scan,
  AlertTriangle,
  Cpu,
  Layers,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { Card, Badge, ProgressBar, StatPill } from '../common';
import { scoreToHex } from '../../utils/helpers';

export function TamperingPanel({ tampering }) {
  if (!tampering) {
    return (
      <Card title="Tampering & Forgery Analysis" subtitle="No forensic data" icon={Scan}>
        <div className="empty-state">Tampering detection module did not run.</div>
      </Card>
    );
  }

  const {
    tampering_detected = false,
    score = 0,
    ela_score,
    noise_variance,
    copy_move_detected = false,
    details = {},
  } = tampering;

  const color = scoreToHex(score);

  return (
    <Card
      title="Tampering & Forensic Analysis"
      subtitle="ELA Compression, Copy-Move & Noise Variance"
      icon={Scan}
      action={
        <Badge
          label={tampering_detected ? 'TAMPERING DETECTED' : 'AUTHENTIC PIXELS'}
          variant={tampering_detected ? 'high' : 'pass'}
          icon={tampering_detected ? ShieldAlert : ShieldCheck}
        />
      }
    >
      {/* Forensic Score */}
      <div className="module-metric">
        <div className="module-metric__header">
          <span className="module-metric__label">Tampering Risk Index</span>
          <span className="module-metric__value" style={{ color }}>
            {score}/100
          </span>
        </div>
        <ProgressBar value={score} color={color} />
      </div>

      {/* Forensic metrics grid */}
      <div className="forensic-grid">
        {ela_score !== undefined && (
          <motion.div
            whileHover={{ y: -2, scale: 1.02 }}
            className="forensic-card"
          >
            <div className="forensic-card__header">
              <Cpu size={14} className="forensic-card__icon" />
              <span>Error Level Analysis (ELA)</span>
            </div>
            <div className="forensic-card__val">
              {typeof ela_score === 'number' ? `${(ela_score * 100).toFixed(1)}%` : ela_score}
            </div>
            <div className="forensic-card__desc">Compression anomaly rate across 90-85% recompression delta</div>
          </motion.div>
        )}

        {noise_variance !== undefined && (
          <motion.div
            whileHover={{ y: -2, scale: 1.02 }}
            className="forensic-card"
          >
            <div className="forensic-card__header">
              <Layers size={14} className="forensic-card__icon" />
              <span>Noise Variance Profile</span>
            </div>
            <div className="forensic-card__val">
              {typeof noise_variance === 'number' ? noise_variance.toFixed(2) : noise_variance}
            </div>
            <div className="forensic-card__desc">Sensor pattern noise uniformity consistency score</div>
          </motion.div>
        )}

        <motion.div
          whileHover={{ y: -2, scale: 1.02 }}
          className="forensic-card"
        >
          <div className="forensic-card__header">
            <Eye size={14} className="forensic-card__icon" />
            <span>Copy-Move Detection</span>
          </div>
          <div className="forensic-card__val" style={{ color: copy_move_detected ? 'var(--risk-high)' : 'var(--risk-low)' }}>
            {copy_move_detected ? 'Cloned Regions Found' : 'Clean (No Duplication)'}
          </div>
          <div className="forensic-card__desc">SIFT feature clustering for cloned or spliced text stamps</div>
        </motion.div>
      </div>

      {tampering_detected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="tampering-alert"
        >
          <Flame size={16} className="tampering-alert__icon" />
          <span>High probability of digital alteration or text block tampering detected in image matrix.</span>
        </motion.div>
      )}
    </Card>
  );
}
