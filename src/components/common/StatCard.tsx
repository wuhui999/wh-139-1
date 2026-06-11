import React from 'react';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  trend?: number;
  gradientFrom?: string;
  gradientTo?: string;
}

export default function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  gradientFrom = '#3B82F6',
  gradientTo = '#06B6D4',
}: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="w-4 h-4 text-gray-400" />;
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendText = () => {
    if (trend === undefined) return null;
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend}%`;
  };

  return (
    <div
      className="
        relative p-6 rounded-2xl cursor-pointer
        transition-all duration-300 ease-out
        hover:scale-105 hover:shadow-2xl
        backdrop-blur-xl bg-white/60
      "
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          padding: '1px',
          background: `linear-gradient(135deg, ${gradientFrom}40, ${gradientTo}40)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-800">{value}</span>
            {unit && <span className="text-sm text-gray-400">{unit}</span>}
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-3">
              {getTrendIcon()}
              <span
                className={`text-sm font-medium ${
                  trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-400'
                }`}
              >
                {getTrendText()}
              </span>
              <span className="text-xs text-gray-400 ml-1">较昨日</span>
            </div>
          )}
        </div>

        <div
          className="p-4 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom}20, ${gradientTo}20)`,
          }}
        >
          <Icon
            className="w-8 h-8"
            style={{
              background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          />
        </div>
      </div>
    </div>
  );
}
