import { create } from 'zustand';
import {
  AppStore,
  SnowPiste,
  Weather,
  PassengerFlow,
  GroomingRecord,
  Equipment,
  SnowMakingRecord,
  EnergyRecord,
  RiskCalculationResult,
  GroomingSuggestion,
  SnowMakingSuggestion,
  AnomalyAlert,
  RiskLevel,
  DataEntities,
  RISK_LEVEL_THRESHOLDS,
  PISTE_LEVEL_PRIORITY,
  PISTE_LEVEL_LABELS,
} from './types';
import { calculateRiskForPiste } from '@/utils/riskCalculator';

const STORAGE_KEY = 'ski-resort-app-state';

const getInitialState = (): Omit<AppStore, keyof {
  setData: never;
  calculateRisk: never;
  generateSuggestions: never;
  detectAnomalies: never;
  loadMockData: never;
  importCSV: never;
  exportReport: never;
  resetData: never;
  saveToLocalStorage: never;
  loadFromLocalStorage: never;
  resolveAlert: never;
}> => ({
  snowPistes: [],
  weatherRecords: [],
  passengerFlowRecords: [],
  groomingRecords: [],
  equipment: [],
  snowMakingRecords: [],
  energyRecords: [],
  riskCalculationResults: [],
  groomingSuggestions: [],
  snowMakingSuggestions: [],
  anomalyAlerts: [],
  lastCalculatedAt: null,
  isLoading: false,
  error: null,
});

const calculateRiskLevel = (score: number): RiskLevel => {
  if (score <= RISK_LEVEL_THRESHOLDS.low) return 'low';
  if (score <= RISK_LEVEL_THRESHOLDS.medium) return 'medium';
  return 'high';
};

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useAppStore = create<AppStore>((set, get) => ({
  ...getInitialState(),

  setData: (data: Partial<DataEntities>) => {
    set((state) => ({ ...state, ...data }));
    get().saveToLocalStorage();
  },

  calculateRisk: (): RiskCalculationResult[] => {
    const { snowPistes, weatherRecords, passengerFlowRecords } = get();
    const now = new Date();

    const latestWeather = weatherRecords[weatherRecords.length - 1];
    if (!latestWeather) {
      return [];
    }

    const results: RiskCalculationResult[] = snowPistes.map((piste) => {
      return calculateRiskForPiste(piste, latestWeather, passengerFlowRecords);
    });

    const updatedPistes = snowPistes.map((piste) => {
      const result = results.find((r) => r.pisteId === piste.id);
      return result
        ? { ...piste, riskScore: result.riskScore, riskLevel: result.riskLevel }
        : piste;
    });

    set({
      riskCalculationResults: results,
      snowPistes: updatedPistes,
      lastCalculatedAt: now.toISOString(),
    });
    get().saveToLocalStorage();

    return results;
  },

  generateSuggestions: () => {
    const { snowPistes, passengerFlowRecords, equipment, weatherRecords } = get();
    const now = new Date();

    const groomingSuggestions: GroomingSuggestion[] = snowPistes
      .map((piste) => {
        const pisteFlows = passengerFlowRecords.filter((p) => p.pisteId === piste.id);
        const avgUtilization = pisteFlows.length > 0
          ? pisteFlows.reduce((sum, p) => sum + p.utilizationRate, 0) / pisteFlows.length
          : 0;

        const lastGroomed = new Date(piste.lastGroomedAt);
        const hoursSinceGroomed = (now.getTime() - lastGroomed.getTime()) / (1000 * 60 * 60);

        const priorityScore =
          piste.riskScore * 2 +
          PISTE_LEVEL_PRIORITY[piste.level] * 10 +
          avgUtilization * 50 +
          (hoursSinceGroomed > 12 ? 20 : 0);

        const suggestedStart = new Date(now);
        suggestedStart.setHours(22, 0, 0, 0);
        if (suggestedStart <= now) {
          suggestedStart.setDate(suggestedStart.getDate() + 1);
        }
        const suggestedEnd = new Date(suggestedStart);
        suggestedEnd.setHours(suggestedStart.getHours() + 2);

        const reasons: string[] = [];
        if (piste.riskScore > 70) reasons.push('高风险需优先处理');
        if (piste.level === 'advanced' || piste.level === 'expert') reasons.push(`${PISTE_LEVEL_LABELS[piste.level]}优先`);
        if (avgUtilization > 0.7) reasons.push('客流量大');
        if (hoursSinceGroomed > 12) reasons.push('压雪间隔超过12小时');

        return {
          id: generateId(),
          pisteId: piste.id,
          pisteName: piste.name,
          priority: Math.round(priorityScore),
          suggestedStartTime: suggestedStart.toISOString(),
          suggestedEndTime: suggestedEnd.toISOString(),
          reason: reasons.join('、') || '常规维护',
          riskScore: piste.riskScore,
          riskLevel: piste.riskLevel,
        };
      })
      .sort((a, b) => b.priority - a.priority)
      .map((item, index) => ({ ...item, priority: index + 1 }));

    const latestWeather = weatherRecords[weatherRecords.length - 1];
    const temperature = latestWeather?.temperature ?? 0;
    const humidity = latestWeather?.humidity ?? 0;

    const availableEquipment = equipment.filter((e) => ['running', 'stopped', 'idle', 'maintenance'].includes(e.status));
    const snowDeficitPistes = snowPistes.filter((p) => (p.baseSnowDepth - p.currentSnowDepth) > 2 || p.riskScore > 10);

    let snowMakingSuggestions: SnowMakingSuggestion[] = snowDeficitPistes
      .map((piste, index) => {
        const equipmentItem = availableEquipment[index % Math.max(availableEquipment.length, 1)];

        const suggestedStart = new Date(now);
        const currentHour = suggestedStart.getHours();
        if (currentHour >= 9 && currentHour < 17) {
          suggestedStart.setHours(17, 0, 0, 0);
        } else {
          suggestedStart.setHours(currentHour + 1, 0, 0, 0);
        }
        const suggestedEnd = new Date(suggestedStart);
        suggestedEnd.setHours(suggestedStart.getHours() + 4);

        const snowDeficit = piste.baseSnowDepth - piste.currentSnowDepth;
        const expectedSnowOutput = Math.max(0, snowDeficit * piste.length * 10);
        const estimatedEnergyCost = expectedSnowOutput * 0.5;

        const isTempOk = temperature < -2;
        const isHumidityOk = humidity < 80;
        let efficiency = 0.8;
        if (!isTempOk) efficiency *= 0.5;
        if (!isHumidityOk) efficiency *= 0.7;

        const reasons: string[] = [];
        if (isTempOk) reasons.push('气温适宜造雪');
        else reasons.push(`气温偏高(${temperature.toFixed(1)}°C)，建议等降温`);
        if (isHumidityOk) reasons.push('湿度条件良好');
        else reasons.push(`湿度偏高(${humidity.toFixed(0)}%)，效率降低`);
        if (piste.riskScore > 70) reasons.push('高风险雪道');
        if (snowDeficit > 10) reasons.push('雪深不足');

        return {
          id: generateId(),
          pisteId: piste.id,
          pisteName: piste.name,
          equipmentId: equipmentItem?.id ?? '',
          equipmentName: equipmentItem?.name ?? '未分配',
          priority: index + 1,
          suggestedStartTime: suggestedStart.toISOString(),
          suggestedEndTime: suggestedEnd.toISOString(),
          expectedSnowOutput: Math.round(expectedSnowOutput),
          estimatedEnergyCost: Math.round(estimatedEnergyCost),
          expectedEfficiency: Math.round(efficiency * 100) / 100,
          reason: reasons.join('、'),
        };
      });

    if (snowMakingSuggestions.length === 0 && snowPistes.length > 0) {
      const fallbackPistes = snowPistes.slice(0, Math.min(2, snowPistes.length));
      snowMakingSuggestions = fallbackPistes.map((piste, index) => {
        const equipmentItem = equipment[index % Math.max(equipment.length, 1)];

        const suggestedStart = new Date(now);
        suggestedStart.setHours(22, 0, 0, 0);
        if (suggestedStart <= now) {
          suggestedStart.setDate(suggestedStart.getDate() + 1);
        }
        const suggestedEnd = new Date(suggestedStart);
        suggestedEnd.setHours(suggestedStart.getHours() + 4);

        return {
          id: generateId(),
          pisteId: piste.id,
          pisteName: piste.name,
          equipmentId: equipmentItem?.id ?? '',
          equipmentName: equipmentItem?.name ?? '造雪机-01',
          priority: index + 1,
          suggestedStartTime: suggestedStart.toISOString(),
          suggestedEndTime: suggestedEnd.toISOString(),
          expectedSnowOutput: Math.round(piste.length * 80),
          estimatedEnergyCost: Math.round(piste.length * 40),
          expectedEfficiency: 0.75,
          reason: '常规雪层维护建议',
        };
      });
    }

    set({ groomingSuggestions, snowMakingSuggestions });
    get().saveToLocalStorage();

    return { groomingSuggestions, snowMakingSuggestions };
  },

  detectAnomalies: (): AnomalyAlert[] => {
    const { equipment, energyRecords, snowPistes, snowMakingRecords } = get();
    const now = new Date();
    const alerts: AnomalyAlert[] = [];

    equipment.forEach((equip) => {
      const piste = snowPistes.find((p) => p.id === equip.assignedPisteId);

      if (equip.status === 'fault' && piste && piste.riskScore > 70) {
        alerts.push({
          id: generateId(),
          type: 'equipment_fault',
          severity: 'critical',
          equipmentId: equip.id,
          equipmentName: equip.name,
          pisteId: piste.id,
          pisteName: piste.name,
          message: `设备 ${equip.name} 故障停机，负责的高风险雪道 ${piste.name} 需要紧急处理`,
          detectedAt: now.toISOString(),
          timestamp: now.toISOString(),
          isResolved: false,
          details: {},
        });
      }

      const equipEnergyRecords = energyRecords.filter((e) => e.equipmentId === equip.id);
      if (equipEnergyRecords.length >= 10) {
        const recentRecords = equipEnergyRecords.slice(-10);
        const avgPower = recentRecords.reduce((sum, r) => sum + r.power, 0) / recentRecords.length;
        const historicalRecords = equipEnergyRecords.slice(0, -10);
        const historicalAvg = historicalRecords.length > 0
          ? historicalRecords.reduce((sum, r) => sum + r.power, 0) / historicalRecords.length
          : avgPower;

        if (avgPower > historicalAvg * 1.3 && historicalAvg > 0) {
          alerts.push({
            id: generateId(),
            type: 'energy_abnormal',
            severity: 'error',
            equipmentId: equip.id,
            equipmentName: equip.name,
            message: `设备 ${equip.name} 能耗异常，近期平均功耗超出历史均值 ${Math.round(((avgPower / historicalAvg) - 1) * 100)}%`,
            detectedAt: now.toISOString(),
            timestamp: now.toISOString(),
            isResolved: false,
            details: {},
          });
        }
      }

      const equipSnowMakingRecords = snowMakingRecords.filter((r) => r.equipmentId === equip.id);
      if (equipSnowMakingRecords.length >= 5) {
        const avgOutput = equipSnowMakingRecords.reduce((sum, r) => sum + r.snowOutput, 0) / equipSnowMakingRecords.length;
        const otherEquipment = equipment.filter((e) => e.id !== equip.id && e.model === equip.model);
        const otherRecords = otherEquipment.flatMap((e) =>
          snowMakingRecords.filter((r) => r.equipmentId === e.id)
        );
        const otherAvg = otherRecords.length > 0
          ? otherRecords.reduce((sum, r) => sum + r.snowOutput, 0) / otherRecords.length
          : avgOutput;

        if (avgOutput < otherAvg * 0.7 && otherAvg > 0) {
          alerts.push({
            id: generateId(),
            type: 'performance_degradation',
            severity: 'warning',
            equipmentId: equip.id,
            equipmentName: equip.name,
            message: `设备 ${equip.name} 造雪性能下降，平均造雪量低于同类型设备 ${Math.round((1 - avgOutput / otherAvg) * 100)}%`,
            detectedAt: now.toISOString(),
            timestamp: now.toISOString(),
            isResolved: false,
            details: {},
          });
        }
      }
    });

    snowPistes.forEach((piste) => {
      if (piste.currentSnowDepth < piste.baseSnowDepth * 0.5) {
        alerts.push({
          id: generateId(),
          type: 'snow_depth_insufficient',
          severity: 'error',
          pisteId: piste.id,
          pisteName: piste.name,
          message: `雪道 ${piste.name} 雪深严重不足，当前 ${piste.currentSnowDepth}cm，基准 ${piste.baseSnowDepth}cm`,
          detectedAt: now.toISOString(),
          timestamp: now.toISOString(),
          isResolved: false,
          details: {},
        });
      }
    });

    set({ anomalyAlerts: alerts });
    get().saveToLocalStorage();

    return alerts;
  },

  loadMockData: () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const snowPistes: SnowPiste[] = [
      {
        id: 'piste-1',
        name: '初级道 A1',
        level: 'beginner',
        length: 500,
        baseSnowDepth: 50,
        currentSnowDepth: 45,
        status: 'open',
        riskScore: 25,
        riskLevel: 'low',
        lastGroomedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        positionX: 100,
        positionY: 100,
      },
      {
        id: 'piste-2',
        name: '中级道 B2',
        level: 'intermediate',
        length: 800,
        baseSnowDepth: 60,
        currentSnowDepth: 48,
        status: 'open',
        riskScore: 55,
        riskLevel: 'medium',
        lastGroomedAt: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString(),
        positionX: 200,
        positionY: 150,
      },
      {
        id: 'piste-3',
        name: '高级道 C3',
        level: 'advanced',
        length: 1200,
        baseSnowDepth: 70,
        currentSnowDepth: 42,
        status: 'open',
        riskScore: 78,
        riskLevel: 'high',
        lastGroomedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
        positionX: 300,
        positionY: 200,
      },
      {
        id: 'piste-4',
        name: '专家道 D4',
        level: 'expert',
        length: 1500,
        baseSnowDepth: 80,
        currentSnowDepth: 35,
        status: 'maintenance',
        riskScore: 88,
        riskLevel: 'high',
        lastGroomedAt: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(),
        positionX: 400,
        positionY: 250,
      },
    ];

    const weatherRecords: Weather[] = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString(),
      temperature: -8 + Math.random() * 6,
      humidity: 60 + Math.random() * 30,
      snowfall: Math.random() * 5,
      windSpeed: 5 + Math.random() * 15,
      weatherCondition: ['sunny', 'cloudy', 'snowy'][Math.floor(Math.random() * 3)] as Weather['weatherCondition'],
    }));

    const passengerFlowRecords: PassengerFlow[] = snowPistes.flatMap((piste) =>
      Array.from({ length: 12 }, (_, i) => ({
        timestamp: new Date(now.getTime() - (11 - i) * 2 * 60 * 60 * 1000).toISOString(),
        pisteId: piste.id,
        passengerCount: Math.floor(100 + Math.random() * 400),
        utilizationRate: 0.3 + Math.random() * 0.6,
      }))
    );

    const groomingRecords: GroomingRecord[] = snowPistes.map((piste, index) => ({
      id: `grooming-${index + 1}`,
      pisteId: piste.id,
      startTime: new Date(now.getTime() - (index + 1) * 6 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() - (index + 1) * 4 * 60 * 60 * 1000).toISOString(),
      operator: `操作员 ${index + 1}`,
      qualityScore: 80 + Math.random() * 20,
    }));

    const equipmentList: Equipment[] = [
      {
        id: 'equip-1',
        name: '压雪车 01',
        model: 'Prinoth BR400',
        status: 'running',
        runHours: 1250,
        lastMaintenance: yesterday.toISOString(),
        energyConsumption: 45,
        assignedPisteId: 'piste-1',
      },
      {
        id: 'equip-2',
        name: '造雪机 01',
        model: 'TechnoAlpin T40',
        status: 'idle',
        runHours: 890,
        lastMaintenance: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        energyConsumption: 120,
        assignedPisteId: 'piste-3',
      },
      {
        id: 'equip-3',
        name: '造雪机 02',
        model: 'TechnoAlpin T40',
        status: 'fault',
        runHours: 1100,
        lastMaintenance: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        energyConsumption: 125,
        assignedPisteId: 'piste-4',
      },
      {
        id: 'equip-4',
        name: '压雪车 02',
        model: 'Prinoth BR400',
        status: 'maintenance',
        runHours: 1350,
        lastMaintenance: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        energyConsumption: 48,
        assignedPisteId: 'piste-2',
      },
    ];

    const snowMakingRecords: SnowMakingRecord[] = Array.from({ length: 20 }, (_, i) => {
      const equip = equipmentList[Math.floor(Math.random() * equipmentList.length)];
      const piste = snowPistes[Math.floor(Math.random() * snowPistes.length)];
      return {
        id: `snow-making-${i + 1}`,
        equipmentId: equip.id,
        pisteId: piste.id,
        startTime: new Date(now.getTime() - (i + 1) * 12 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now.getTime() - (i + 1) * 8 * 60 * 60 * 1000).toISOString(),
        snowOutput: 50 + Math.random() * 100,
        energyUsed: 80 + Math.random() * 120,
      };
    });

    const energyRecords: EnergyRecord[] = equipmentList.flatMap((equip) =>
      Array.from({ length: 24 }, (_, i) => ({
        id: `energy-${equip.id}-${i + 1}`,
        equipmentId: equip.id,
        timestamp: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString(),
        power: equip.energyConsumption * (0.8 + Math.random() * 0.4),
        voltage: 380 + Math.random() * 20,
        current: equip.energyConsumption / 380 * (0.9 + Math.random() * 0.2),
      }))
    );

    set({
      snowPistes,
      weatherRecords,
      passengerFlowRecords,
      groomingRecords,
      equipment: equipmentList,
      snowMakingRecords,
      energyRecords,
    });

    const store = get();
    store.calculateRisk();
    store.generateSuggestions();
    store.detectAnomalies();
  },

  importCSV: async (file: File): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const dataType = headers.join(',');
      const parsedData: Partial<DataEntities> = {};

      if (dataType.includes('id') && dataType.includes('name') && dataType.includes('level')) {
        parsedData.snowPistes = lines.slice(1).map((line, index) => {
          const values = line.split(',');
          return {
            id: values[headers.indexOf('id')] || `piste-csv-${index}`,
            name: values[headers.indexOf('name')] || '',
            level: values[headers.indexOf('level')] as SnowPiste['level'] || 'beginner',
            length: parseFloat(values[headers.indexOf('length')]) || 0,
            baseSnowDepth: parseFloat(values[headers.indexOf('basesnowdepth')]) || 50,
            currentSnowDepth: parseFloat(values[headers.indexOf('currentsnowdepth')]) || 45,
            status: values[headers.indexOf('status')] as SnowPiste['status'] || 'open',
            riskScore: parseFloat(values[headers.indexOf('riskscore')]) || 0,
            riskLevel: values[headers.indexOf('risklevel')] as RiskLevel || 'low',
            lastGroomedAt: values[headers.indexOf('lastgroomedat')] || new Date().toISOString(),
            positionX: parseFloat(values[headers.indexOf('positionx')]) || index * 100,
            positionY: parseFloat(values[headers.indexOf('positiony')]) || index * 50,
          };
        });
      } else if (dataType.includes('temperature') && dataType.includes('humidity')) {
        parsedData.weatherRecords = lines.slice(1).map((line, index) => {
          const values = line.split(',');
          return {
            timestamp: values[headers.indexOf('timestamp')] || new Date(Date.now() - index * 3600000).toISOString(),
            temperature: parseFloat(values[headers.indexOf('temperature')]) || -5,
            humidity: parseFloat(values[headers.indexOf('humidity')]) || 70,
            snowfall: parseFloat(values[headers.indexOf('snowfall')]) || 0,
            windSpeed: parseFloat(values[headers.indexOf('windspeed')]) || 10,
            weatherCondition: values[headers.indexOf('weathercondition')] as Weather['weatherCondition'] || 'sunny',
          };
        });
      } else if (dataType.includes('passengercount') && dataType.includes('utilizationrate')) {
        parsedData.passengerFlowRecords = lines.slice(1).map((line, index) => {
          const values = line.split(',');
          return {
            timestamp: values[headers.indexOf('timestamp')] || new Date(Date.now() - index * 7200000).toISOString(),
            pisteId: values[headers.indexOf('pisteid')] || '',
            passengerCount: parseInt(values[headers.indexOf('passengercount')]) || 0,
            utilizationRate: parseFloat(values[headers.indexOf('utilizationrate')]) || 0,
          };
        });
      } else {
        throw new Error('无法识别的 CSV 格式');
      }

      set((state) => ({ ...state, ...parsedData, isLoading: false }));
      get().saveToLocalStorage();

      return true;
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : '导入失败' });
      return false;
    }
  },

  exportReport: (): string => {
    const state = get();
    const now = new Date();

    const report = `
滑雪场运营分析报告
生成时间: ${now.toLocaleString('zh-CN')}

================================================================================
一、雪道状态概览
================================================================================
${state.snowPistes.map((piste) => `
雪道名称: ${piste.name}
雪道等级: ${PISTE_LEVEL_LABELS[piste.level]}
雪道长度: ${piste.length}m
基准雪深: ${piste.baseSnowDepth}cm
当前雪深: ${piste.currentSnowDepth}cm
雪道状态: ${piste.status === 'open' ? '开放' : piste.status === 'closed' ? '关闭' : '维护中'}
风险评分: ${piste.riskScore}分 (${piste.riskLevel === 'low' ? '低风险' : piste.riskLevel === 'medium' ? '中风险' : '高风险'})
上次压雪: ${new Date(piste.lastGroomedAt).toLocaleString('zh-CN')}
`).join('\n')}

================================================================================
二、风险计算结果
================================================================================
${state.riskCalculationResults.map((result) => `
雪道: ${result.pisteName}
风险评分: ${result.riskScore}分
风险等级: ${result.riskLevel === 'low' ? '低风险' : result.riskLevel === 'medium' ? '中风险' : '高风险'}
温度因子: ${result.temperatureFactor}%
客流因子: ${result.passengerFlowFactor}%
压雪间隔因子: ${result.groomingIntervalFactor}%
雪深因子: ${result.snowDepthFactor}%
计算时间: ${new Date(result.calculatedAt).toLocaleString('zh-CN')}
`).join('\n')}

================================================================================
三、压雪建议
================================================================================
${state.groomingSuggestions.map((suggestion) => `
优先级 #${suggestion.priority}: ${suggestion.pisteName}
建议时间: ${new Date(suggestion.suggestedStartTime).toLocaleString('zh-CN')} - ${new Date(suggestion.suggestedEndTime).toLocaleString('zh-CN')}
风险评分: ${suggestion.riskScore}分
原因: ${suggestion.reason}
`).join('\n')}

================================================================================
四、造雪建议
================================================================================
${state.snowMakingSuggestions.length > 0 ? state.snowMakingSuggestions.map((suggestion) => `
优先级 #${suggestion.priority}: ${suggestion.pisteName}
使用设备: ${suggestion.equipmentName}
建议时间: ${new Date(suggestion.suggestedStartTime).toLocaleString('zh-CN')} - ${new Date(suggestion.suggestedEndTime).toLocaleString('zh-CN')}
预计造雪量: ${suggestion.expectedSnowOutput}m³
预计能耗: ${suggestion.estimatedEnergyCost}kWh
原因: ${suggestion.reason}
`).join('\n') : '当前条件不适宜造雪'}

================================================================================
五、异常告警
================================================================================
${state.anomalyAlerts.filter((a) => !a.isResolved).map((alert) => `
[${alert.severity === 'critical' ? '严重' : alert.severity === 'error' ? '错误' : '警告'}] ${alert.message}
检测时间: ${new Date(alert.detectedAt).toLocaleString('zh-CN')}
`).join('\n') || '暂无异常告警'}

================================================================================
六、设备状态
================================================================================
${state.equipment.map((equip) => `
设备名称: ${equip.name}
设备型号: ${equip.model}
运行状态: ${equip.status === 'running' ? '运行中' : equip.status === 'idle' ? '空闲' : equip.status === 'maintenance' ? '维护中' : '故障'}
运行时长: ${equip.runHours}小时
上次维护: ${new Date(equip.lastMaintenance).toLocaleString('zh-CN')}
能耗功率: ${equip.energyConsumption}kW
负责雪道: ${state.snowPistes.find((p) => p.id === equip.assignedPisteId)?.name || '未分配'}
`).join('\n')}

================================================================================
报告结束
================================================================================
    `.trim();

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `滑雪场运营报告_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return report;
  },

  resetData: () => {
    set(getInitialState());
    localStorage.removeItem(STORAGE_KEY);
  },

  saveToLocalStorage: () => {
    try {
      const state = get();
      const dataToPersist: DataEntities & {
        riskCalculationResults: RiskCalculationResult[];
        groomingSuggestions: GroomingSuggestion[];
        snowMakingSuggestions: SnowMakingSuggestion[];
        anomalyAlerts: AnomalyAlert[];
        lastCalculatedAt: string | null;
      } = {
        snowPistes: state.snowPistes,
        weatherRecords: state.weatherRecords,
        passengerFlowRecords: state.passengerFlowRecords,
        groomingRecords: state.groomingRecords,
        equipment: state.equipment,
        snowMakingRecords: state.snowMakingRecords,
        energyRecords: state.energyRecords,
        riskCalculationResults: state.riskCalculationResults,
        groomingSuggestions: state.groomingSuggestions,
        snowMakingSuggestions: state.snowMakingSuggestions,
        anomalyAlerts: state.anomalyAlerts,
        lastCalculatedAt: state.lastCalculatedAt,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToPersist));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  loadFromLocalStorage: (): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set((state) => ({ ...state, ...parsed }));
        return true;
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return false;
  },

  resolveAlert: (alertId: string) => {
    set((state) => ({
      anomalyAlerts: state.anomalyAlerts.map((alert) =>
        alert.id === alertId ? { ...alert, isResolved: true } : alert
      ),
    }));
    get().saveToLocalStorage();
  },
}));

export default useAppStore;
