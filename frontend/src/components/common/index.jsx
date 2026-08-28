import { motion } from 'motion/react';
import './common.css';

export { AnimatedBg } from './AnimatedBg';
export { AnimatedText } from './AnimatedBg';
export { CyberText } from './CyberText';
export { HeroIntro } from './HeroIntro';
export { FloatingElements } from './FloatingElements';
export { Skeleton } from './Skeleton';

/**
 * Glassmorphic interactive Card with Motion hover animations
 */
export function Card({
  title,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  action,
  children,
  className = '',
  delay = 0,
  glowColor = 'rgba(14, 165, 233, 0.25)',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        y: -4,
        boxShadow: `0 12px 30px -10px rgba(0, 0, 0, 0.7)`,
        borderColor: 'rgba(255, 255, 255, 0.2)',
      }}
      className={`card ${className}`}
    >
      {(title || Icon || action) && (
        <div className="card__header">
          {Icon && (
            <motion.div
              whileHover={{ rotate: 10, scale: 1.15 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="card__icon"
              style={{
                background: iconBg || 'rgba(14, 165, 233, 0.12)',
                color: iconColor || 'var(--accent)',
              }}
            >
              <Icon size={22} />
            </motion.div>
          )}
          <div style={{ flex: 1 }}>
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {action && <div className="card__action">{action}</div>}
        </div>
      )}
      <div className="card__body">{children}</div>
    </motion.div>
  );
}

/**
 * Animated neon Badge
 */
export function Badge({ label, variant = 'neutral', icon: Icon, className = '' }) {
  const getVariantClass = () => {
    switch (variant.toLowerCase()) {
      case 'low':
      case 'pass':
      case 'verified':
        return 'badge--low';
      case 'medium':
      case 'warning':
      case 'suspicious':
        return 'badge--medium';
      case 'high':
      case 'fail':
      case 'fraud':
        return 'badge--high';
      case 'info':
        return 'badge--info';
      default:
        return 'badge--neutral';
    }
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className={`badge ${getVariantClass()} ${className}`}
    >
      {Icon && <Icon size={12} className="badge__icon" />}
      {label}
    </motion.span>
  );
}

/**
 * Motion Animated Progress Bar
 */
export function ProgressBar({ value = 0, max = 100, color, showLabel = false, height = 8 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="progress-container">
      <div className="progress" style={{ height: `${height}px` }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="progress__fill"
          style={{
            background: color || 'linear-gradient(90deg, var(--accent), var(--accent-alt))',
            color: color || 'var(--accent)',
          }}
        />
      </div>
      {showLabel && (
        <div className="progress__label">
          <span>{Math.round(pct)}%</span>
        </div>
      )}
    </div>
  );
}

/**
 * Motion Spinner with dual glowing rings
 */
export function Spinner({ size = 'md', color = 'var(--accent)' }) {
  const sizeMap = { sm: 20, md: 36, lg: 60 };
  const dim = sizeMap[size] || 36;

  return (
    <div className={`spinner spinner--${size}`} style={{ width: dim, height: dim }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="spinner__ring"
        style={{ width: dim, height: dim, borderTopColor: color }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        className="spinner__outer-ring"
        style={{ width: dim + 10, height: dim + 10 }}
      />
    </div>
  );
}

/**
 * Interactive Check Item with Motion and Lucide Icons
 */
export function CheckItem({ name, passed = true, reason, icon: CustomIcon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ x: 6, backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
      className={`check-item ${passed ? 'check-item--passed' : 'check-item--failed'}`}
    >
      <motion.div
        whileHover={{ scale: 1.2, rotate: passed ? 10 : -10 }}
        transition={{ type: 'spring', stiffness: 400 }}
        className={`check-item__icon check-item__icon--${passed ? 'pass' : 'fail'}`}
      >
        {CustomIcon ? (
          <CustomIcon size={14} />
        ) : passed ? (
          <span>✓</span>
        ) : (
          <span>✕</span>
        )}
      </motion.div>
      <div className="check-item__content">
        <div className="check-item__name">{name}</div>
        {reason && <div className="check-item__reason">{reason}</div>}
      </div>
    </motion.div>
  );
}

/**
 * Stat Pill with hover animation
 */
export function StatPill({ label, value, color, icon: Icon }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className="stat-pill"
    >
      {Icon && <Icon size={14} style={{ color: color || 'var(--text-muted)' }} />}
      <span className="stat-pill__label">{label}:</span>
      <span className="stat-pill__value" style={{ color: color || 'var(--text-primary)' }}>
        {value}
      </span>
    </motion.div>
  );
}
