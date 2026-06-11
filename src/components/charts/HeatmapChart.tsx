import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { PassengerFlow, SnowPiste } from '@/store/types';

interface HeatmapChartProps {
  data: PassengerFlow[];
  pistes: SnowPiste[];
  options?: Partial<EChartsOption>;
}

const HEATMAP_COLORS = ['#1890ff', '#13c2c2', '#5cdbd3', '#faad14', '#ff4d4f'];

export default function HeatmapChart({ data, pistes, options }: HeatmapChartProps) {
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  const pisteNames = pistes.map((p) => p.name);

  const heatmapData: [number, number, number][] = [];
  const maxCount = Math.max(...data.map((d) => d.passengerCount), 1);

  pistes.forEach((piste, yIdx) => {
    for (let h = 0; h < 24; h++) {
      const hourStr = h.toString().padStart(2, '0');
      const records = data.filter(
        (d) => d.pisteId === piste.id && d.timestamp.slice(11, 13) === hourStr
      );
      const count = records.reduce((sum, r) => sum + r.passengerCount, 0);
      if (count > 0) {
        heatmapData.push([h, yIdx, count]);
      }
    }
  });

  const chartOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#1890ff',
      textStyle: { color: '#595959' },
      formatter: (params: any) => {
        const [x, y, value] = params.data;
        return `
          <strong>${pisteNames[y]}<br/>
          时段: ${hours[x]}<br/>
          客流: ${value}人<br/>
          饱和度: ${((value / maxCount) * 100).toFixed(1)}%
        `;
      },
    },
    grid: {
      left: '15%',
      right: '10%',
      bottom: '10%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: { show: true },
      axisLabel: { color: '#595959', fontSize: 10 },
      axisLine: { lineStyle: { color: '#e6f7ff' } },
    },
    yAxis: {
      type: 'category',
      data: pisteNames,
      splitArea: { show: true },
      axisLabel: { color: '#595959' },
      axisLine: { lineStyle: { color: '#e6f7ff' } },
    },
    visualMap: {
      min: 0,
      max: maxCount,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: HEATMAP_COLORS,
      },
      textStyle: { color: '#595959' },
    },
    series: [
      {
        name: '客流热力',
        type: 'heatmap',
        data: heatmapData,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
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
