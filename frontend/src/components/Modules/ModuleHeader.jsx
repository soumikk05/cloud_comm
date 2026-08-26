import { motion } from 'motion/react';
import { CyberText } from '../common';

export function ModuleHeader({
  badge = "MODULE",
  title,
  subtitle,
  icon: Icon,
  endpoint,
  actions
}) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
      <div className="flex items-start gap-4">
        {Icon && (
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] shrink-0"
          >
            <Icon size={24} />
          </motion.div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              {badge}
            </span>
            {endpoint && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/5 border border-white/5">
                {endpoint}
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-mono text-white tracking-wide">
            <CyberText text={title} />
          </h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
