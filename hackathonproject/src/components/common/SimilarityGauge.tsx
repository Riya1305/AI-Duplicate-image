import React from 'react';

interface SimilarityGaugeProps {
  score: number; // 0 to 100
  size?: number; // size in px
  strokeWidth?: number;
  showLabel?: boolean;
}

export const SimilarityGauge: React.FC<SimilarityGaugeProps> = ({
  score,
  size = 72,
  strokeWidth = 6,
  showLabel = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = '#6366f1'; // indigo
  let bgColor = 'rgba(99, 102, 241, 0.15)';
  let textColor = 'text-indigo-400';

  if (clampedScore >= 98) {
    strokeColor = '#10b981'; // emerald
    bgColor = 'rgba(16, 185, 129, 0.15)';
    textColor = 'text-emerald-400';
  } else if (clampedScore >= 88) {
    strokeColor = '#818cf8'; // indigo-400
    bgColor = 'rgba(129, 140, 248, 0.15)';
    textColor = 'text-indigo-300';
  } else if (clampedScore >= 70) {
    strokeColor = '#f59e0b'; // amber
    bgColor = 'rgba(245, 158, 11, 0.15)';
    textColor = 'text-amber-400';
  } else {
    strokeColor = '#94a3b8'; // slate
    bgColor = 'rgba(148, 163, 184, 0.15)';
    textColor = 'text-slate-400';
  }

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated fill stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xs font-bold leading-none ${textColor}`}>
            {clampedScore}%
          </span>
          <span className="text-[9px] text-slate-400 scale-90 uppercase tracking-tighter mt-0.5">
            Match
          </span>
        </div>
      )}
    </div>
  );
};
