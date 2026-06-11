import React from 'react';
import { Tag } from 'antd';
import { RiskLevel } from '@/store/types';

interface RiskBadgeProps {
  riskLevel: RiskLevel;
  riskScore: number;
  showScore?: boolean;
}

const colorMap: Record<RiskLevel, string> = {
  low: '#00B42A',
  medium: '#FF7D00',
  high: '#F53F3F',
};

const textMap: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

export default function RiskBadge({ riskLevel, riskScore, showScore = true }: RiskBadgeProps) {
  const isHigh = riskLevel === 'high';

  return (
    <Tag
      color={colorMap[riskLevel]}
      className={`
        inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
        ${isHigh ? 'animate-pulse' : ''}
      `}
      style={{
        backgroundColor: `${colorMap[riskLevel]}15`,
        borderColor: colorMap[riskLevel],
        color: colorMap[riskLevel],
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: colorMap[riskLevel] }}
      />
      {textMap[riskLevel]}
      {showScore && (
        <span className="ml-1 font-semibold">{Math.round(riskScore)}</span>
      )}
    </Tag>
  );
}
