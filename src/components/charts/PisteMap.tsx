import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { SnowPiste } from '@/store/types';

interface PisteMapProps {
  data: SnowPiste[];
  options?: Partial<EChartsOption>;
}

const getRiskColor = (riskLevel: string) => {
  const colors: Record<string, string> = {
    low: '#52c41a',
    medium: '#faad14',
    high: '#ff4d4f',
  };
  return colors[riskLevel] || '#1890ff';
};

const getPisteLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    beginner: '初级道',
    intermediate: '中级道',
    advanced: '高级道',
    expert: '专家道',
  };
  return labels[level] || level;
};

export default function PisteMap({ data, options }: PisteMapProps) {
  const maxLength = Math.max(...data.map((d) => d.length), 1);

  const scatterData = data.map((piste) => ({
    value: [piste.positionX, piste.positionY, piste.length],
    symbolSize: Math.max(20, (piste.length / maxLength) * 60),
    itemStyle: {
      color: getRiskColor(piste.riskLevel),
      opacity: 0.8,
      borderColor: '#fff',
      borderWidth: 2,
    },
    piste,
  }));

  const chartOption: EChartsOption = {
    backgroundColor: {
      type: 'linear',
      x: 0, y: 0, x2: 1, y2: 1,
      colorStops: [
        { offset: 0, color: '#f0f5ff' },
        { offset: 1, color: '#e6f7ff' },
      ],
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#1890ff',
      textStyle: { color: '#595959' },
      formatter: (params: any) => {
        const piste = params.data.piste;
        const statusLabels: Record<string, string> = {
          open: '开放',
          closed: '关闭',
          maintenance: '维护中',
        };
        return `
          <strong>${piste.name}</strong><br/>
          等级: ${getPisteLevelLabel(piste.level)}<br/>
          长度: ${piste.length}m<br/>
          基雪深度: ${piste.baseSnowDepth}cm<br/>
          当前雪深: ${piste.currentSnowDepth}cm<br/>
          状态: ${statusLabels[piste.status]}<br/>
          风险等级: ${piste.riskLevel === 'low' ? '低' : piste.riskLevel === 'medium' ? '中' : '高'}<br/>
          风险评分: ${piste.riskScore}
        `;
      },
    },
    legend: {
      data: [
        { name: '低风险', itemStyle: { color: '#52c41a' } },
        { name: '中风险', itemStyle: { color: '#faad14' } },
        { name: '高风险', itemStyle: { color: '#ff4d4f' } },
      ],
      textStyle: { color: '#595959' },
      top: 0,
      right: 0,
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: 'X坐标',
      min: 0,
      max: 100,
      axisLabel: { color: '#595959' },
      axisLine: { lineStyle: { color: '#1890ff' } },
      splitLine: { lineStyle: { color: '#e6f7ff', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      name: 'Y坐标',
      min: 0,
      max: 100,
      axisLabel: { color: '#595959' },
      axisLine: { lineStyle: { color: '#1890ff' } },
      splitLine: { lineStyle: { color: '#e6f7ff', type: 'dashed' } },
    },
    series: [
      {
        name: '低风险',
        type: 'scatter',
        data: scatterData.filter((d) => d.piste.riskLevel === 'low'),
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(82, 196, 26, 0.5)',
          },
        },
      },
      {
        name: '中风险',
        type: 'scatter',
        data: scatterData.filter((d) => d.piste.riskLevel === 'medium'),
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(250, 173, 20, 0.5)',
          },
        },
      },
      {
        name: '高风险',
        type: 'scatter',
        data: scatterData.filter((d) => d.piste.riskLevel === 'high'),
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(255, 77, 79, 0.5)',
          },
        },
      },
    ],
    ...options,
  };

  return (
    <ReactECharts
      option={chartOption}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
