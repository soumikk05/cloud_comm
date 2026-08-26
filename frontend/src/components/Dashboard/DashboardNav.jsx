import { motion } from 'motion/react';
import { Target, Activity, FileText, Zap, Sparkles, Database } from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview', icon: Target },
  { id: 'ocr', label: 'Extracted Data', icon: FileText },
  { id: 'validation', label: 'MRZ Validation', icon: Activity },
  { id: 'tampering', label: 'Tampering Forensics', icon: Zap },
  { id: 'face', label: 'Biometrics', icon: Sparkles },
  { id: 'timeline', label: 'Metrics', icon: Activity },
  { id: 'audit', label: 'Audit Trail', icon: Database },
];

export const DashboardNav = () => {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <motion.nav 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="hidden lg:flex flex-col gap-2 sticky top-24 h-fit bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-64"
    >
      <div className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 px-2">Navigation</div>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-mono text-slate-300 hover:text-cyan-400 hover:bg-cyan-950/30 transition-all text-left"
          >
            <Icon size={16} />
            {item.label}
          </button>
        );
      })}
    </motion.nav>
  );
};
