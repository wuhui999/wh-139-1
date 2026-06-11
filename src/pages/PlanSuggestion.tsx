import { useMemo } from 'react';
import { Card, Table, Button, Space, Tag, message } from 'antd';
import { Snowflake, Clock, MapPin, CheckCircle, RefreshCw, Download, GripVertical } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GroomingSuggestion, SnowMakingSuggestion } from '@/store/types';
import RiskBadge from '@/components/common/RiskBadge';
import StatCard from '@/components/common/StatCard';
import GanttChart from '@/components/charts/GanttChart';

const fmtTime = (s: string) => new Date(s).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
const fmtDuration = (s: string, e: string) => {
  const d = new Date(e).getTime() - new Date(s).getTime();
  return `${Math.floor(d / 3600000)}h${Math.floor((d % 3600000) / 60000)}m`;
};

export default function PlanSuggestion() {
  const { groomingSuggestions, snowMakingSuggestions, generateSuggestions, exportReport } = useAppStore();

  const stats = useMemo(() => {
    const pendingPistes = groomingSuggestions.length;
    const snowMakingSlots = snowMakingSuggestions.length;
    const totalGroomingTime = groomingSuggestions.reduce((acc, s) => {
      return acc + (new Date(s.suggestedEndTime).getTime() - new Date(s.suggestedStartTime).getTime()) / 3600000;
    }, 0);
    return { pendingPistes, snowMakingSlots, totalGroomingTime: totalGroomingTime.toFixed(1) };
  }, [groomingSuggestions, snowMakingSuggestions]);

  const ganttData = useMemo(() => {
    const data: any[] = [];
    groomingSuggestions.forEach((s: GroomingSuggestion) => data.push({
      id: s.id, name: `压雪 - ${s.pisteName}`, type: 'grooming' as const,
      startTime: s.suggestedStartTime, endTime: s.suggestedEndTime, status: 'pending' as const, pisteName: s.pisteName,
    }));
    snowMakingSuggestions.forEach((s: SnowMakingSuggestion) => data.push({
      id: s.id, name: `造雪 - ${s.pisteName}`, type: 'snowmaking' as const,
      startTime: s.suggestedStartTime, endTime: s.suggestedEndTime, status: 'pending' as const, pisteName: s.pisteName,
    }));
    return data;
  }, [groomingSuggestions, snowMakingSuggestions]);

  const handleConfirm = () => message.success('计划已确认，将通知相关操作员');
  const handleRecalculate = () => { generateSuggestions(); message.success('已重新计算建议'); };
  const handleExport = () => { exportReport(); message.success('报告已导出'); };

  const groomingColumns = [
    { title: '排名', dataIndex: 'priority', key: 'priority', width: 80,
      render: (p: number) => (
        <div className="flex items-center justify-center">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
            p <= 2 ? 'bg-red-500' : p <= 4 ? 'bg-orange-500' : 'bg-blue-500'}`}>{p}</span>
        </div>
      )},
    { title: '雪道', dataIndex: 'pisteName', key: 'pisteName',
      render: (n: string) => (
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
          <MapPin className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{n}</span>
        </div>
      )},
    { title: '风险评分', dataIndex: 'riskScore', key: 'riskScore', width: 120,
      render: (s: number, r: GroomingSuggestion) => <RiskBadge riskLevel={r.riskLevel} riskScore={s} /> },
    { title: '预估耗时', key: 'duration', width: 100,
      render: (_: unknown, r: GroomingSuggestion) => (
        <div className="flex items-center gap-1 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{fmtDuration(r.suggestedStartTime, r.suggestedEndTime)}</span>
        </div>
      )},
    { title: '建议时段', key: 'time',
      render: (_: unknown, r: GroomingSuggestion) => (
        <span className="text-gray-600">{fmtTime(r.suggestedStartTime)} - {fmtTime(r.suggestedEndTime)}</span>
      )},
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true,
      render: (r: string) => <Tag color="blue" className="whitespace-nowrap">{r}</Tag> },
    { title: '操作', key: 'action', width: 120,
      render: () => (
        <Space>
          <Button type="link" size="small">调整</Button>
          <Button type="link" size="small" danger>移除</Button>
        </Space>
      )},
  ];

  const snowMakingColumns = [
    { title: '推荐时段', key: 'time',
      render: (_: unknown, r: SnowMakingSuggestion) => (
        <span className="font-medium">{fmtTime(r.suggestedStartTime)} - {fmtTime(r.suggestedEndTime)}</span>
      )},
    { title: '雪道', dataIndex: 'pisteName', key: 'pisteName' },
    { title: '设备', dataIndex: 'equipmentName', key: 'equipmentName' },
    { title: '预计造雪量', key: 'output',
      render: (_: unknown, r: SnowMakingSuggestion) => {
        const e = (r as any).expectedSnowOutput;
        return e ? <span className="font-medium text-cyan-600">{e.toLocaleString()} m³</span> : <span className="text-gray-400">-</span>;
      }},
    { title: '效率预估', key: 'efficiency',
      render: (_: unknown, r: SnowMakingSuggestion) => {
        const e = (r as any).expectedEfficiency;
        return e ? <Tag color={e > 70 ? 'green' : e > 50 ? 'orange' : 'red'}>{e}%</Tag> : <span className="text-gray-400">-</span>;
      }},
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">计划建议</h1>
        <Space>
          <Button icon={<CheckCircle />} type="primary" onClick={handleConfirm}>
            确认计划
          </Button>
          <Button icon={<RefreshCw />} onClick={handleRecalculate}>
            重新计算
          </Button>
          <Button icon={<Download />} onClick={handleExport}>
            导出计划
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="待压雪道数"
          value={stats.pendingPistes}
          unit="条"
          icon={MapPin}
          gradientFrom="#3B82F6"
          gradientTo="#60A5FA"
        />
        <StatCard
          title="建议造雪时段数"
          value={stats.snowMakingSlots}
          unit="个"
          icon={Snowflake}
          gradientFrom="#06B6D4"
          gradientTo="#22D3EE"
        />
        <StatCard
          title="预估总耗时"
          value={stats.totalGroomingTime}
          unit="小时"
          icon={Clock}
          gradientFrom="#8B5CF6"
          gradientTo="#A78BFA"
        />
      </div>

      <Card title="压雪优先级列表" className="shadow-lg">
        <Table
          columns={groomingColumns}
          dataSource={groomingSuggestions}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>

      <Card title="造雪时段建议" className="shadow-lg">
        <Table
          columns={snowMakingColumns}
          dataSource={snowMakingSuggestions}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>

      <Card title="计划甘特图" className="shadow-lg">
        <div className="h-80">
          <GanttChart data={ganttData} />
        </div>
      </Card>
    </div>
  );
}
