import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'emerald' | 'indigo' | 'amber' | 'purple';
  isAnalyzed?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  isAnalyzed = true,
}) => {
  const borderVariants = {
    default: 'border-slate-800 hover:border-slate-700',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 to-slate-900/40',
    indigo: 'border-indigo-500/20 hover:border-indigo-500/40 bg-gradient-to-br from-indigo-950/20 to-slate-900/40',
    amber: 'border-amber-500/20 hover:border-amber-500/40 bg-gradient-to-br from-amber-950/20 to-slate-900/40',
    purple: 'border-purple-500/20 hover:border-purple-500/40 bg-gradient-to-br from-purple-950/20 to-slate-900/40',
  }[variant];

  const iconBg = {
    default: 'bg-slate-800 text-slate-300',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  }[variant];

  return (
    <div className={`p-5 rounded-2xl glass-panel border transition-all duration-300 shadow-lg relative overflow-hidden group ${borderVariants}`}>
      {/* Subtle glow accent */}
      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-white/3 blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="space-y-1">
        {isAnalyzed ? (
          <div className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            {value}
          </div>
        ) : (
          <div className="text-sm font-medium text-slate-500 italic py-1">
            Not analyzed yet
          </div>
        )}

        {subtitle && (
          <p className="text-xs text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
