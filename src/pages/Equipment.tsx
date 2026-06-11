import { useMemo, useState } from 'react';
import { Card, Button, Space, Tag, Table, message, Row, Col } from 'antd';
import { Cpu, PlayCircle, PauseCircle, AlertTriangle, Zap, Clock, MapPin, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Equipment as EquipmentType, AnomalyAlert, EquipmentStatus } from '@/store/types';
import StatCard from '@/components/common/StatCard';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';

const statusCfg: Record<EquipmentStatus, { label: string; color: string; bg: string; pulse?: boolean }> = {
  running: { label: '运行中', color: '#52c41a', bg: '#f6ffed', pulse: true },
  idle: { label: '待机', color: '#8c8c8c', bg: '#fafafa' },
  maintenance: { label: '维护中', color: '#faad14', bg: '#fffbe6' },
  fault: { label: '故障', color: '#ff4d4f', bg: '#fff1f0', pulse: true },
  stopped: { label: '已停机', color: '#722ed1', bg: '#f9f0ff' },
};

const severityCfg: Record<string, { color: string; label: string }> = {
  critical: { color: '#ff4d4f', label: '严重' },
  error: { color: '#fa8c16', label: '错误' },
  warning: { color: '#faad14', label: '警告' },
  info: { color: '#1890ff', label: '提示' },
};

const typeMap: Record<string, string> = {
  equipment_fault: '设备故障', equipment_down: '设备停机', energy_abnormal: '能耗异常',
  frequent_start_stop: '频繁启停', performance_low: '性能下降', snow_depth_insufficient: '雪深不足',
  performance_degradation: '性能下降',
};

const fmtDT = (s: string) => new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function EquipmentPage() {
  const { equipment, anomalyAlerts, energyRecords, snowPistes, detectAnomalies, resolveAlert } = useAppStore();
  const [tab, setTab] = useState<'status' | 'history'>('status');

  const stats = useMemo(() => ({
    total: equipment.length,
    running: equipment.filter((e) => e.status === 'running').length,
    idle: equipment.filter((e) => e.status === 'idle').length,
    fault: equipment.filter((e) => e.status === 'fault').length,
    energyAbnormal: anomalyAlerts.filter((a) => a.type === 'energy_abnormal' && !a.isResolved).length,
  }), [equipment, anomalyAlerts]);

  const energyBarData = useMemo(() =>
    equipment.map((e) => ({ name: e.name, value: e.energyConsumption, unit: 'kW' })),
  [equipment]);

  const energyTrendData = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => {
      const t = new Date(); t.setHours(i, 0, 0, 0);
      const records = energyRecords.filter((r) => new Date(r.timestamp).getHours() === i);
      const avg = records.length > 0 ? records.reduce((s, r) => s + r.power, 0) / records.length : 0;
      return { timestamp: t.toISOString(), temperature: avg, humidity: 0, snowfall: 0, windSpeed: 0, weatherCondition: 'sunny' as const };
    }),
  [energyRecords]);

  const getPisteName = (id: string) => snowPistes.find((p) => p.id === id)?.name || '未分配';
  const handleDetect = () => { detectAnomalies(); message.success('已重新检测异常'); };
  const handleResolve = (id: string) => { resolveAlert(id); message.success('告警已处理'); };

  const alertCols = [
    { title: '异常类型', dataIndex: 'type', key: 'type', width: 140,
      render: (t: string) => <Tag color="blue">{typeMap[t] || t}</Tag> },
    { title: '严重程度', dataIndex: 'severity', key: 'severity', width: 100,
      render: (s: string) => {
        const c = severityCfg[s] || severityCfg.warning;
        return <Tag color={c.color} className="font-medium">{c.label}</Tag>;
      }},
    { title: '设备', dataIndex: 'equipmentName', key: 'equipmentName', width: 120 },
    { title: '描述', dataIndex: 'message', key: 'message', ellipsis: true },
    { title: '时间', key: 'time', width: 140,
      render: (_: unknown, r: AnomalyAlert) => <span className="text-gray-500 text-sm">{fmtDT(r.detectedAt)}</span> },
    { title: '操作', key: 'action', width: 100,
      render: (_: unknown, r: AnomalyAlert) =>
        !r.isResolved ? <Button type="primary" size="small" onClick={() => handleResolve(r.id)}>处理</Button> : <Tag color="green">已处理</Tag> },
  ];

  const historyCols = [
    { title: '时间', dataIndex: 'lastMaintenance', key: 'time', render: (t: string) => fmtDT(t) },
    { title: '设备', dataIndex: 'name', key: 'name' },
    { title: '型号', dataIndex: 'model', key: 'model' },
    { title: '类型', key: 'type', render: () => <Tag color="purple">定期维护</Tag> },
    { title: '运行时长', dataIndex: 'runHours', key: 'runHours', render: (h: number) => `${h.toLocaleString()} 小时` },
  ];

  const lineOpts: any = {
    legend: { data: ['能耗功率'], textStyle: { color: '#595959' }, top: 0 },
    yAxis: [{ type: 'value' as const, name: '功率(kW)', axisLine: { lineStyle: { color: '#e6f7ff' } },
      axisLabel: { color: '#595959' }, splitLine: { lineStyle: { color: '#e6f7ff', type: 'dashed' as const } } }],
    series: [{ name: '能耗功率', type: 'line' as const, smooth: true, itemStyle: { color: '#1890ff' },
      areaStyle: { color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: 'rgba(24,144,255,0.3)' }, { offset: 1, color: 'rgba(24,144,255,0.05)' }] } } }],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">设备监控</h1>
        <Button icon={<RefreshCw />} onClick={handleDetect}>重新检测</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard title="设备总数" value={stats.total} unit="台" icon={Cpu} gradientFrom="#3B82F6" gradientTo="#60A5FA" />
        <StatCard title="运行中" value={stats.running} unit="台" icon={PlayCircle} gradientFrom="#10B981" gradientTo="#34D399" />
        <StatCard title="待机" value={stats.idle} unit="台" icon={PauseCircle} gradientFrom="#6B7280" gradientTo="#9CA3AF" />
        <StatCard title="故障" value={stats.fault} unit="台" icon={AlertTriangle} gradientFrom="#EF4444" gradientTo="#F87171" />
        <StatCard title="能耗异常" value={stats.energyAbnormal} unit="项" icon={Zap} gradientFrom="#F59E0B" gradientTo="#FBBF24" />
      </div>

      <Card title="设备状态" className="shadow-lg">
        <Row gutter={[16, 16]}>
          {equipment.map((item: EquipmentType) => {
            const cfg = statusCfg[item.status];
            return (
              <Col xs={24} sm={12} lg={6} key={item.id}>
                <div className="p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg"
                  style={{ borderColor: `${cfg.color}30`, backgroundColor: cfg.bg }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.model}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${cfg.pulse ? 'animate-pulse' : ''}`}
                        style={{ backgroundColor: cfg.color }} />
                      <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-gray-600">
                      <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>运行时长</span></div>
                      <span className="font-medium">{item.runHours.toLocaleString()}h</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                      <div className="flex items-center gap-1"><Zap className="w-4 h-4" /><span>今日能耗</span></div>
                      <span className="font-medium text-orange-600">{item.energyConsumption} kW</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                      <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /><span>负责雪道</span></div>
                      <span className="font-medium text-blue-600">{getPisteName(item.assignedPisteId)}</span>
                    </div>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={12}><Card title="能耗排行" className="shadow-lg h-96"><BarChart data={energyBarData} orientation="horizontal" unit="kW" /></Card></Col>
        <Col xs={24} lg={12}><Card title="24小时能耗趋势" className="shadow-lg h-96"><LineChart data={energyTrendData} options={lineOpts} /></Card></Col>
      </Row>

      <Card title="异常告警" className="shadow-lg" extra={
        <Space>
          <Button type={tab === 'status' ? 'primary' : 'default'} size="small" onClick={() => setTab('status')}>当前告警</Button>
          <Button type={tab === 'history' ? 'primary' : 'default'} size="small" onClick={() => setTab('history')}>维护记录</Button>
        </Space>
      }>
        {tab === 'status' ? (
          <Table columns={alertCols} dataSource={anomalyAlerts.filter((a) => !a.isResolved)} rowKey="id" pagination={false} size="middle" />
        ) : (
          <Table columns={historyCols} dataSource={equipment} rowKey="id" pagination={false} size="middle" />
        )}
      </Card>
    </div>
  );
}
