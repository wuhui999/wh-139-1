import React, { useMemo } from 'react';
import { Card, Skeleton } from 'antd';
import { Mountain, AlertTriangle, Thermometer, Users, Snowflake, Clock } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { PISTE_LEVEL_LABELS, RISK_LEVEL_COLORS } from '@/store/types';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/common/StatCard';
import RiskBadge from '@/components/common/RiskBadge';
import LineChart from '@/components/charts/LineChart';
import HeatmapChart from '@/components/charts/HeatmapChart';
import PisteMap from '@/components/charts/PisteMap';

export default function Overview() {
  const { snowPistes, weatherRecords, passengerFlowRecords, isLoading } = useAppStore();

  const stats = useMemo(() => {
    const totalPistes = snowPistes.length;
    const highRiskCount = snowPistes.filter(p => p.riskLevel === 'high').length;
    const avgRiskScore = totalPistes > 0
      ? Math.round(snowPistes.reduce((sum, p) => sum + p.riskScore, 0) / totalPistes)
      : 0;
    const todayPassengers = passengerFlowRecords.reduce((sum, r) => sum + r.passengerCount, 0);

    return { totalPistes, highRiskCount, avgRiskScore, todayPassengers };
  }, [snowPistes, passengerFlowRecords]);

  const latestWeather = useMemo(() => {
    return weatherRecords[weatherRecords.length - 1];
  }, [weatherRecords]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return `${Math.floor(diffMs / (1000 * 60))}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    return `${Math.floor(diffHours / 24)}天前`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton active paragraph={{ rows: 4 }} />
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">雪道总览</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="雪道总数"
            value={stats.totalPistes}
            unit="条"
            icon={Mountain}
            gradientFrom="#3B82F6"
            gradientTo="#06B6D4"
          />
          <StatCard
            title="高风险雪道"
            value={stats.highRiskCount}
            unit="条"
            icon={AlertTriangle}
            gradientFrom="#F59E0B"
            gradientTo="#EF4444"
          />
          <StatCard
            title="平均风险评分"
            value={stats.avgRiskScore}
            unit="分"
            icon={Thermometer}
            gradientFrom="#8B5CF6"
            gradientTo="#EC4899"
          />
          <StatCard
            title="今日客流"
            value={stats.todayPassengers}
            unit="人"
            icon={Users}
            gradientFrom="#10B981"
            gradientTo="#3B82F6"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {snowPistes.map((piste) => (
            <Card
              key={piste.id}
              className={`
                group cursor-pointer transition-all duration-300 ease-out
                hover:scale-105 hover:shadow-2xl backdrop-blur-xl
                ${piste.riskLevel === 'high' ? 'animate-pulse' : ''}
              `}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
                border: 'none',
                borderRadius: '16px',
              }}
              bodyStyle={{ padding: '20px' }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{piste.name}</h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {PISTE_LEVEL_LABELS[piste.level]}
                    </span>
                  </div>
                  <RiskBadge
                    riskLevel={piste.riskLevel}
                    riskScore={piste.riskScore}
                    showScore
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Snowflake className="w-4 h-4 text-cyan-500" />
                    <span className="text-sm text-gray-600">
                      {piste.currentSnowDepth}cm
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-600">
                      {latestWeather?.temperature.toFixed(1) || '--'}°C
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">
                      {passengerFlowRecords.filter(f => f.pisteId === piste.id).reduce((s, r) => s + r.passengerCount, 0)}人
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-600">
                      {formatTime(piste.lastGroomedAt)}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>雪深进度</span>
                    <span>{Math.round((piste.currentSnowDepth / piste.baseSnowDepth) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (piste.currentSnowDepth / piste.baseSnowDepth) * 100)}%`,
                        backgroundColor: RISK_LEVEL_COLORS[piste.riskLevel],
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            title="24小时气象趋势"
            className="backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
              border: 'none',
              borderRadius: '16px',
            }}
            bodyStyle={{ padding: '20px', height: '380px' }}
          >
            <LineChart data={weatherRecords} />
          </Card>

          <Card
            title="客流热力图"
            className="backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
              border: 'none',
              borderRadius: '16px',
            }}
            bodyStyle={{ padding: '20px', height: '380px' }}
          >
            <HeatmapChart data={passengerFlowRecords} pistes={snowPistes} />
          </Card>
        </div>

        <Card
          title="雪道位置分布图"
          className="backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            border: 'none',
            borderRadius: '16px',
          }}
          bodyStyle={{ padding: '20px', height: '400px' }}
        >
          <PisteMap data={snowPistes} />
        </Card>
      </div>
    </Layout>
  );
}
