"use client";

import React from 'react';
import { cn } from '@/lib/utils';

type Props = {
  value: number; // 0..100
  className?: string;
  colorClass?: string; // e.g., text-red-500 (used for ring + number)
  size?: number; // px
  glow?: boolean;
  label?: string;
};

export function Gauge({ value, className, colorClass = 'text-green-500', size = 180, glow = true, label = 'Burnout Score' }: Props) {
  const v = Math.max(0, Math.min(100, value));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (v / 100) * circumference;

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg className="absolute inset-0" viewBox="0 0 120 120" aria-hidden>
        {glow && (
          <defs>
            <filter id="gauge-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        )}
        <circle cx="60" cy="60" r="58" fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
        <circle cx="60" cy="60" r="48" fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
        <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--primary) / 0.12)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          className={cn(colorClass)}
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          filter={glow ? 'url(#gauge-glow)' : undefined}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
        <span className={cn('text-5xl font-bold tabular-nums', colorClass)}>{Math.round(v)}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export default Gauge;
