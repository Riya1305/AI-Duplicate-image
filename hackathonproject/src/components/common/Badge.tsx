import React from 'react';
import { DuplicateClassification } from '../../types/image';
import { CheckCircle2, Sparkles, Layers, Star } from 'lucide-react';

interface BadgeProps {
  type: DuplicateClassification | 'keeper' | 'custom';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, label, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs font-medium gap-1.5',
    lg: 'px-3 py-1.5 text-sm font-medium gap-2',
  }[size];

  switch (type) {
    case 'exact':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs ${sizeClasses} ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          {label || 'Exact Duplicate'}
        </span>
      );
    case 'near':
      return (
        <span className={`inline-flex items-center rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-xs ${sizeClasses} ${className}`}>
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          {label || 'Near Duplicate'}
        </span>
      );
    case 'similar':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-xs ${sizeClasses} ${className}`}>
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          {label || 'Similar Image'}
        </span>
      );
    case 'keeper':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 font-semibold shadow-xs ${sizeClasses} ${className}`}>
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          {label || 'Recommended to Keep'}
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses} ${className}`}>
          {label || 'Unique'}
        </span>
      );
  }
};
