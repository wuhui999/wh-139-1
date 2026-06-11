import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { GroomingSuggestion, SnowMakingSuggestion } from '@/store/types';

interface GanttTask {
  id: string;
  name: string;
  type: 'grooming' | 'snowmaking';
  startTime: string;
  endTime: string;
  status?: 'pending' | 'in-progress' | 'completed';
  pisteName?: string;
}

interface GanttChartProps {
  data: GanttTask[];
  options?: Partial<EChartsOption>;
}

const GANTT_COLORS = {
  grooming: '#1890ff',
  snowmaking: '#13c2c2',
  pending: '#d9d9d9',
  'in-progress': '#52c41a',
  completed: '#8c8c8c',
};

export default function GanttChart({ data, options }: GanttChartProps) {
  const hours = Array.from({ length: 25 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  const taskNames = [...new Set(data.map((d) => d.name))].reverse();

  const timeToMinutes = (time: string) => {
    const [h, m] = time.slice(11, 16).split(':').map(Number);
    return h * 60 + m;
  };

  const ganttData: any[] = [];
  data.forEach((task) => {
    const yIdx = taskNames.indexOf(task.name);
    const start = timeToMinutes(task.startTime);
    const end = timeToMinutes(task.endTime);
    const duration = end - start;
    ganttData.push({
      value: [yIdx, start, duration, task.id],
      itemStyle: {
        color: GANTT_COLORS[task.type],
        opacity: task.status === 'completed' ? 0.5 : 1,
      },
      task,
    });
  });

  const chartOption: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#1890ff',
      textStyle: { color: '#595959' },
      formatter: (params: any) => {
        const task = params.data.task;
        const duration = params.data.value[2];
        const typeLabel = task.type === 'grooming' ? '压雪' : '造雪';
        const statusLabel = task.status === 'in-progress' ? '进行中' : task.status === 'completed' ? '已完成' : '待执行';
        return `
          <strong>${task.name}</strong><br/>
          类型: ${typeLabel}<br/>
          ${task.pisteName ? `雪道: ${task.pisteName}<br/>` : ''}
          开始: ${task.startTime.slice(11, 16)}<br/>
          结束: ${task.endTime.slice(11, 16)}<br/>
          持续: ${Math.floor(duration / 60)}小时${duration % 60}分钟<br/>
          状态: ${statusLabel}
        `;
      },
    },
    legend: {
      data: [
        { name: '压雪', itemStyle: { color: GANTT_COLORS.grooming } },
        { name: '造雪', itemStyle: { color: GANTT_COLORS.snowmaking } },
      ],
      textStyle: { color: '#595959' },
      top: 0,
    },
    grid: {
      left: '20%',
      right: '5%',
      bottom: '5%',
      top: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 24 * 60,
      interval: 60,
      axisLabel: {
        color: '#595959',
        formatter: (value: number) => hours[Math.floor(value / 60)],
      },
      axisLine: { lineStyle: { color: '#e6f7ff' } },
      splitLine: { lineStyle: { color: '#e6f7ff', type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: taskNames,
      axisLabel: { color: '#595959' },
      axisLine: { lineStyle: { color: '#e6f7ff' } },
      splitLine: { show: true, lineStyle: { color: '#e6f7ff' } },
    },
    series: [
      {
        name: '压雪',
        type: 'bar',
        stack: 'total',
        data: ganttData.filter((d) => d.task.type === 'grooming'),
        barWidth: '60%',
        itemStyle: { borderRadius: [4, 4, 4, 4] },
        label: {
          show: true,
          position: 'right',
          color: '#595959',
          fontSize: 11,
          formatter: (params: any) => {
            const d = params.data.value[2];
            return `${Math.floor(d / 60)}h${d % 60}m`;
          },
        },
      },
      {
        name: '造雪',
        type: 'bar',
        stack: 'total',
        data: ganttData.filter((d) => d.task.type === 'snowmaking'),
        barWidth: '60%',
        itemStyle: { borderRadius: [4, 4, 4, 4] },
        label: {
          show: true,
          position: 'right',
          color: '#595959',
          fontSize: 11,
          formatter: (params: any) => {
            const d = params.data.value[2];
            return `${Math.floor(d / 60)}h${d % 60}m`;
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
