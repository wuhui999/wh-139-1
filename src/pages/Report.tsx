import React, { useMemo, useRef } from 'react';
import { Card, Collapse, Table, Button, Space, message, Row, Col } from 'antd';
import { FileText, Download, Printer, Calendar, Clock, Database, AlertTriangle, Cpu, Snowflake, MapPin, TrendingUp, CheckCircle } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useAppStore } from '@/store/useAppStore';
import { RISK_LEVEL_COLORS, PISTE_LEVEL_LABELS, GroomingSuggestion, SnowMakingSuggestion, SnowPiste } from '@/store/types';
import StatCard from '@/components/common/StatCard';
import RiskBadge from '@/components/common/RiskBadge';
import BarChart from '@/components/charts/BarChart';

const { Panel } = Collapse;

const fmtDate = (d: Date) => d.toLocaleDateString('zh-CN');
const fmtTime = (d: Date) => d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('zh-CN');

export default function Report() {
  const reportRef = useRef<HTMLDivElement>(null);
  const {
    snowPistes,
    riskCalculationResults,
    groomingSuggestions,
    snowMakingSuggestions,
    anomalyAlerts,
    equipment,
    lastCalculatedAt,
    calculateRisk,
    generateSuggestions,
    detectAnomalies,
  } = useAppStore();

  const now = new Date();

  const stats = useMemo(() => {
    const totalPistes = snowPistes.length;
    const highRiskCount = snowPistes.filter(p => p.riskLevel === 'high').length;
    const mediumRiskCount = snowPistes.filter(p => p.riskLevel === 'medium').length;
    const lowRiskCount = snowPistes.filter(p => p.riskLevel === 'low').length;
    const anomalyCount = anomalyAlerts.filter(a => !a.isResolved).length;
    const equipmentFaultCount = equipment.filter(e => e.status === 'fault').length;

    return {
      totalPistes,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      anomalyCount,
      equipmentFaultCount,
    };
  }, [snowPistes, anomalyAlerts, equipment]);

  const riskDistributionData = useMemo(() => [
    { name: '低风险', value: stats.lowRiskCount, itemStyle: { color: RISK_LEVEL_COLORS.low } },
    { name: '中风险', value: stats.mediumRiskCount, itemStyle: { color: RISK_LEVEL_COLORS.medium } },
    { name: '高风险', value: stats.highRiskCount, itemStyle: { color: RISK_LEVEL_COLORS.high } },
  ], [stats]);

  const barChartData = useMemo(() => [
    { name: '低风险', value: stats.lowRiskCount, unit: '条' },
    { name: '中风险', value: stats.mediumRiskCount, unit: '条' },
    { name: '高风险', value: stats.highRiskCount, unit: '条' },
  ], [stats]);

  const pieChartOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}条 ({d}%)',
    },
    legend: {
      bottom: '5%',
      left: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}\n{c}条',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        data: riskDistributionData,
      },
    ],
  };

  const groomingColumns = [
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80,
      render: (p: number) => <span className="font-bold text-blue-600">#{p}</span> },
    { title: '雪道', dataIndex: 'pisteName', key: 'pisteName',
      render: (n: string) => (
        <Space>
          <MapPin className="w-4 h-4 text-blue-500" />
          <span>{n}</span>
        </Space>
      )},
    { title: '风险等级', key: 'risk', width: 120,
      render: (_: unknown, r: GroomingSuggestion) => <RiskBadge riskLevel={r.riskLevel} riskScore={r.riskScore} /> },
    { title: '建议时段', key: 'time',
      render: (_: unknown, r: GroomingSuggestion) => (
        <span>{fmtTime(new Date(r.suggestedStartTime))} - {fmtTime(new Date(r.suggestedEndTime))}</span>
      )},
    { title: '原因', dataIndex: 'reason', key: 'reason' },
  ];

  const snowMakingColumns = [
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80,
      render: (p: number) => <span className="font-bold text-cyan-600">#{p}</span> },
    { title: '雪道', dataIndex: 'pisteName', key: 'pisteName' },
    { title: '设备', dataIndex: 'equipmentName', key: 'equipmentName' },
    { title: '建议时段', key: 'time',
      render: (_: unknown, r: SnowMakingSuggestion) => (
        <span>{fmtTime(new Date(r.suggestedStartTime))} - {fmtTime(new Date(r.suggestedEndTime))}</span>
      )},
    { title: '预计造雪量', dataIndex: 'expectedSnowOutput', key: 'output',
      render: (v: number) => v ? `${v.toLocaleString()} m³` : '-' },
    { title: '预计能耗', dataIndex: 'estimatedEnergyCost', key: 'cost',
      render: (v: number) => v ? `${v} kWh` : '-' },
  ];

  const handleExportPDF = () => {
    message.info('PDF 生成中，请稍候...');
    setTimeout(() => {
      window.print();
      message.success('PDF 已生成');
    }, 500);
  };

  const handleExportCSV = () => {
    const headers = ['雪道名称', '风险等级', '风险评分', '温度因子', '客流因子', '压雪间隔因子', '雪深因子', '计算时间'];
    const rows = riskCalculationResults.map(r => [
      r.pisteName,
      r.riskLevel === 'low' ? '低风险' : r.riskLevel === 'medium' ? '中风险' : '高风险',
      r.riskScore,
      r.temperatureFactor + '%',
      r.passengerFlowFactor + '%',
      r.groomingIntervalFactor + '%',
      r.snowDepthFactor + '%',
      fmtDateTime(r.calculatedAt),
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `风险分析报告_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('CSV 数据已导出');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRecalculate = () => {
    calculateRisk();
    generateSuggestions();
    detectAnomalies();
    message.success('数据已重新计算');
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-500" />
            报告导出
          </h1>
          <Space>
            <Button icon={<TrendingUp />} onClick={handleRecalculate}>
              重新计算
            </Button>
            <Button
              icon={<Download />}
              onClick={handleExportPDF}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-none transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              生成PDF报告
            </Button>
            <Button
              icon={<Download />}
              onClick={handleExportCSV}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-none transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              导出CSV数据
            </Button>
            <Button
              icon={<Printer />}
              onClick={handlePrint}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              打印
            </Button>
          </Space>
        </div>

        <div ref={reportRef} className="print:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="报告日期"
              value={fmtDate(now)}
              icon={Calendar}
              gradientFrom="#3B82F6"
              gradientTo="#60A5FA"
            />
            <StatCard
              title="生成时间"
              value={fmtTime(now)}
              icon={Clock}
              gradientFrom="#8B5CF6"
              gradientTo="#A78BFA"
            />
            <StatCard
              title="数据来源"
              value="实时系统"
              icon={Database}
              gradientFrom="#10B981"
              gradientTo="#34D399"
            />
            <StatCard
              title="风险雪道数"
              value={stats.highRiskCount + stats.mediumRiskCount}
              unit="条"
              icon={AlertTriangle}
              gradientFrom="#F59E0B"
              gradientTo="#EF4444"
            />
            <StatCard
              title="设备异常数"
              value={stats.equipmentFaultCount}
              unit="台"
              icon={Cpu}
              gradientFrom="#EF4444"
              gradientTo="#F97316"
            />
          </div>

          <Card title="日计划汇总" className="shadow-sm">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <div className="flex items-center gap-2 mb-4">
                  <Snowflake className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold">压雪计划表</h3>
                </div>
                <Table
                  columns={groomingColumns}
                  dataSource={groomingSuggestions}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Col>
              <Col xs={24} lg={12}>
                <div className="flex items-center gap-2 mb-4">
                  <Snowflake className="w-5 h-5 text-cyan-500" />
                  <h3 className="text-lg font-semibold">造雪计划表</h3>
                </div>
                <Table
                  columns={snowMakingColumns}
                  dataSource={snowMakingSuggestions}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Col>
            </Row>
          </Card>

          <Card title="建议依据说明" className="shadow-sm">
            <Collapse defaultActiveKey={['1']}>
              {riskCalculationResults.map((result) => (
                <Panel
                  key={result.pisteId}
                  header={
                    <div className="flex items-center justify-between w-full pr-4">
                      <Space>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium">{result.pisteName}</span>
                        <RiskBadge riskLevel={result.riskLevel} riskScore={result.riskScore} />
                      </Space>
                    </div>
                  }
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500">{result.temperatureFactor}%</div>
                      <div className="text-sm text-gray-500">温度因子</div>
                      <div className="text-xs text-gray-400 mt-1">权重 30%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{result.passengerFlowFactor}%</div>
                      <div className="text-sm text-gray-500">客流因子</div>
                      <div className="text-xs text-gray-400 mt-1">权重 25%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">{result.groomingIntervalFactor}%</div>
                      <div className="text-sm text-gray-500">压雪间隔因子</div>
                      <div className="text-xs text-gray-400 mt-1">权重 25%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-500">{result.snowDepthFactor}%</div>
                      <div className="text-sm text-gray-500">雪深因子</div>
                      <div className="text-xs text-gray-400 mt-1">权重 20%</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <strong>计算公式：</strong>
                      风险评分 = 温度因子 × 0.3 + 客流因子 × 0.25 + 压雪间隔因子 × 0.25 + 雪深因子 × 0.2
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      <strong>计算结果：</strong>
                      {result.temperatureFactor} × 0.3 + {result.passengerFlowFactor} × 0.25 + {result.groomingIntervalFactor} × 0.25 + {result.snowDepthFactor} × 0.2 = <strong className="text-blue-600">{result.riskScore}</strong> 分
                    </div>
                  </div>
                </Panel>
              ))}
            </Collapse>
          </Card>

          <Card title="风险分布统计" className="shadow-sm">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <div className="h-80">
                  <ReactECharts option={pieChartOption} style={{ height: '100%', width: '100%' }} />
                </div>
              </Col>
              <Col xs={24} lg={12}>
                <div className="h-80">
                  <BarChart data={barChartData} title="各风险等级雪道数量" unit="条" />
                </div>
              </Col>
            </Row>
          </Card>

          <Card title="报告预览" className="shadow-sm print:shadow-none print:border-none">
            <div className="space-y-6 p-4 bg-white rounded-lg border border-gray-200">
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">滑雪场运营分析报告</h2>
                <p className="text-gray-500 mt-2">报告编号: SKI-{now.getFullYear()}{String(now.getMonth() + 1).padStart(2, '0')}{String(now.getDate()).padStart(2, '0')}</p>
                <p className="text-gray-500">生成时间: {fmtDateTime(now.toISOString())}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-blue-500 rounded"></span>
                  一、雪道状态概览
                </h3>
                <Table
                  dataSource={snowPistes}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '雪道名称', dataIndex: 'name', key: 'name' },
                    { title: '等级', dataIndex: 'level', key: 'level', render: (l: string) => PISTE_LEVEL_LABELS[l as keyof typeof PISTE_LEVEL_LABELS] },
                    { title: '当前雪深', dataIndex: 'currentSnowDepth', key: 'depth', render: (v: number) => `${v}cm` },
                    { title: '基准雪深', dataIndex: 'baseSnowDepth', key: 'base', render: (v: number) => `${v}cm` },
                    { title: '风险评分', key: 'risk', render: (_: unknown, r: SnowPiste) => <RiskBadge riskLevel={r.riskLevel} riskScore={r.riskScore} showScore={false} /> },
                  ]}
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-orange-500 rounded"></span>
                  二、风险计算详情
                </h3>
                <Table
                  dataSource={riskCalculationResults}
                  rowKey="pisteId"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '雪道', dataIndex: 'pisteName', key: 'name' },
                    { title: '风险评分', dataIndex: 'riskScore', key: 'score' },
                    { title: '温度因子', dataIndex: 'temperatureFactor', key: 'temp', render: (v: number) => `${v}%` },
                    { title: '客流因子', dataIndex: 'passengerFlowFactor', key: 'flow', render: (v: number) => `${v}%` },
                    { title: '压雪间隔', dataIndex: 'groomingIntervalFactor', key: 'interval', render: (v: number) => `${v}%` },
                    { title: '雪深因子', dataIndex: 'snowDepthFactor', key: 'depth', render: (v: number) => `${v}%` },
                  ]}
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-green-500 rounded"></span>
                  三、压雪计划
                </h3>
                <Table
                  dataSource={groomingSuggestions.slice(0, 5)}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '优先级', dataIndex: 'priority', key: 'priority' },
                    { title: '雪道', dataIndex: 'pisteName', key: 'name' },
                    { title: '建议时段', key: 'time', render: (_: unknown, r: GroomingSuggestion) => `${fmtTime(new Date(r.suggestedStartTime))}-${fmtTime(new Date(r.suggestedEndTime))}` },
                    { title: '原因', dataIndex: 'reason', key: 'reason' },
                  ]}
                />
              </div>

              <div className="text-center text-gray-400 text-sm pt-4 border-t">
                <p>报告生成系统版本 v1.0.0</p>
                <p>最后计算时间: {lastCalculatedAt ? fmtDateTime(lastCalculatedAt) : '-'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
  );
}
