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
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
        <div className="text-5xl mb-3 opacity-30">🗺️</div>
        <p>暂无雪道位置数据</p>
      </div>
    );
  }

  const processedData = data.map((piste, index) => {
    const hasPosition = piste.positionX !== undefined && piste.positionY !== null &&
                        piste.positionY !== undefined && piste.positionY !== null;
    return {
      ...piste,
      positionX: hasPosition ? piste.positionX! : (index + 1) * 100,
      positionY: hasPosition ? piste.positionY! : (index + 1) * 80,
    };
  });

  const maxLength = Math.max(...processedData.map((d) => d.length), 1);
  const xValues = processedData.map((d) => d.positionX);
  const yValues = processedData.map((d) => d.positionY);
  const xMin = Math.min(...xValues, 0);
  const xMax = Math.max(...xValues, 100) * 1.2;
  const yMin = Math.min(...yValues, 0);
  const yMax = Math.max(...yValues, 100) * 1.2;

  const scatterData = processedData.map((piste) => ({
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
      min: xMin,
      max: xMax,
      axisLabel: { color: '#595959' },
      axisLine: { lineStyle: { color: '#1890ff' } },
      splitLine: { lineStyle: { color: '#e6f7ff', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      name: 'Y坐标',
      min: yMin,
      max: yMax,
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
