import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

interface BarDataItem {
  name: string;
  value: number;
  unit?: string;
}

interface BarChartProps {
  data: BarDataItem[];
  orientation?: 'horizontal' | 'vertical';
  title?: string;
  unit?: string;
  options?: Partial<EChartsOption>;
}

const BAR_GRADIENT = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
  { offset: 0, color: '#1890ff' },
  { offset: 1, color: '#5cdbd3' },
]);

export default function BarChart({
  data,
  orientation = 'vertical',
  title,
  unit = '',
  options,
}: BarChartProps) {
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const names = sortedData.map((d) => d.name);
  const values = sortedData.map((d) => d.value);

  const isHorizontal = orientation === 'horizontal';

  const chartOption: EChartsOption = {
    backgroundColor: 'transparent',
    title: title
      ? {
          text: title,
          textStyle: { color: '#595959', fontSize: 14 },
          left: 'center',
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: isHorizontal ? 'shadow' : 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#1890ff',
      textStyle: { color: '#595959' },
      formatter: (params: any) => {
        const item = params[0];
        const dataItem = sortedData[item.dataIndex];
        return `${item.name}<br/>${item.marker}数值: ${item.value}${dataItem.unit || unit}`;
      },
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: title ? '15%' : '5%',
      containLabel: true,
    },
    xAxis: isHorizontal
      ? {
          type: 'value',
          axisLine: { lineStyle: { color: '#e6f7ff' } },
          axisLabel: { color: '#595959' },
          splitLine: { lineStyle: { color: '#e6f7ff', type: 'dashed' } },
        }
      : {
          type: 'category',
          data: names,
          axisLine: { lineStyle: { color: '#e6f7ff' } },
          axisLabel: { color: '#595959', rotate: names.length > 5 ? 30 : 0 },
        },
    yAxis: isHorizontal
      ? {
          type: 'category',
          data: names,
          axisLine: { lineStyle: { color: '#e6f7ff' } },
          axisLabel: { color: '#595959' },
        }
      : {
          type: 'value',
          axisLine: { lineStyle: { color: '#e6f7ff' } },
          axisLabel: { color: '#595959' },
          splitLine: { lineStyle: { color: '#e6f7ff', type: 'dashed' } },
        },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: '50%',
        itemStyle: {
          color: BAR_GRADIENT,
          borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: isHorizontal ? 'right' : 'top',
          color: '#595959',
          formatter: (params: any) => `${params.value}${sortedData[params.dataIndex].unit || unit}`,
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
