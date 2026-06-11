import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { Weather } from '@/store/types';

interface LineChartProps {
  data: Weather[];
  options?: Partial<EChartsOption>;
}

const ICE_COLORS = {
  temperature: '#1890ff',
  humidity: '#13c2c2',
  snowfall: '#5cdbd3',
  grid: '#e6f7ff',
  text: '#595959',
};

export default function LineChart({ data, options }: LineChartProps) {
  const times = data.map((d) => d.timestamp.slice(11, 16));
  const temperatures = data.map((d) => d.temperature);
  const humidities = data.map((d) => d.humidity);
  const snowfalls = data.map((d) => d.snowfall);

  const chartOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#1890ff',
      textStyle: { color: ICE_COLORS.text },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`;
        params.forEach((item: any) => {
          const unit = item.seriesName === '气温' ? '°C' : item.seriesName === '湿度' ? '%' : 'cm';
          result += `${item.marker}${item.seriesName}: ${item.value}${unit}<br/>`;
        });
        return result;
      },
    },
    legend: {
      data: ['气温', '湿度', '降雪量'],
      textStyle: { color: ICE_COLORS.text },
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: times,
      axisLine: { lineStyle: { color: ICE_COLORS.grid } },
      axisLabel: { color: ICE_COLORS.text },
    },
    yAxis: [
      {
        type: 'value',
        name: '气温(°C) / 湿度(%)',
        axisLine: { lineStyle: { color: ICE_COLORS.grid } },
        axisLabel: { color: ICE_COLORS.text },
        splitLine: { lineStyle: { color: ICE_COLORS.grid, type: 'dashed' } },
      },
      {
        type: 'value',
        name: '降雪量(cm)',
        axisLine: { lineStyle: { color: ICE_COLORS.grid } },
        axisLabel: { color: ICE_COLORS.text },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '气温',
        type: 'line',
        smooth: true,
        data: temperatures,
        itemStyle: { color: ICE_COLORS.temperature },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
            ],
          },
        },
      },
      {
        name: '湿度',
        type: 'line',
        smooth: true,
        data: humidities,
        itemStyle: { color: ICE_COLORS.humidity },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(19, 194, 194, 0.3)' },
              { offset: 1, color: 'rgba(19, 194, 194, 0.05)' },
            ],
          },
        },
      },
      {
        name: '降雪量',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: snowfalls,
        itemStyle: { color: ICE_COLORS.snowfall },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(92, 219, 211, 0.3)' },
              { offset: 1, color: 'rgba(92, 219, 211, 0.05)' },
            ],
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
