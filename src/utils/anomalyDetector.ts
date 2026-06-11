import type {
  Equipment,
  SnowPiste,
  EnergyRecord,
  AnomalyAlert,
  AnomalyType,
  AnomalySeverity,
  Weather,
  PassengerFlow,
  SnowMakingRecord,
} from '@/store/types';
import { calculateRiskForPiste } from './riskCalculator';

function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function detectEquipmentDownAnomalies(
  equipment: Equipment[],
  pistes: SnowPiste[],
  weather: Weather[],
  passengerFlows: PassengerFlow[]
): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  const currentTime = new Date();
  const latestWeather = [...weather].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];

  if (!latestWeather) return alerts;

  for (const equip of equipment) {
    if (equip.status !== 'stopped' && equip.status !== 'fault') continue;

    const lastStatusChange = equip.lastStatusChange
      ? new Date(equip.lastStatusChange)
      : currentTime;
    const downtimeHours = (currentTime.getTime() - lastStatusChange.getTime()) / (1000 * 60 * 60);

    if (downtimeHours <= 4) continue;

    const assignedPiste = pistes.find((p) => p.id === equip.assignedPisteId);
    if (!assignedPiste) continue;

    const riskResult = calculateRiskForPiste(assignedPiste, latestWeather, passengerFlows);

    if (riskResult.riskScore > 70) {
      const timestamp = currentTime.toISOString();
      alerts.push({
        id: generateAlertId(),
        type: 'equipment_down',
        severity: 'critical',
        equipmentId: equip.id,
        equipmentName: equip.name,
        pisteId: assignedPiste.id,
        pisteName: assignedPiste.name,
        message: `设备 ${equip.name} 已停机 ${downtimeHours.toFixed(
          1
        )} 小时，负责雪道 ${assignedPiste.name} 风险评分 ${riskResult.riskScore.toFixed(
          1
        )} 分，需立即处理`,
        detectedAt: timestamp,
        timestamp,
        isResolved: false,
        details: {
          downtimeHours,
          riskScore: riskResult.riskScore,
          pisteRiskLevel: riskResult.riskLevel,
          equipmentStatus: equip.status,
        },
      });
    }
  }

  return alerts;
}

function detectEnergyAnomalies(
  equipment: Equipment[],
  energyRecords: EnergyRecord[]
): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];

  for (const equip of equipment) {
    const equipRecords = energyRecords
      .filter((r) => r.equipmentId === equip.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (equipRecords.length < 10) continue;

    const powerValues = equipRecords.map((r) => r.power).filter((p) => p > 0);
    if (powerValues.length < 5) continue;

    const meanPower = powerValues.reduce((sum, p) => sum + p, 0) / powerValues.length;
    const recentRecords = equipRecords.slice(-5);

    for (const record of recentRecords) {
      if (record.power <= 0) continue;

      const deviationPercent = ((record.power - meanPower) / meanPower) * 100;

      if (deviationPercent > 30) {
        const assignedPiste = record.equipmentId;
        const timestamp = record.timestamp;
        alerts.push({
          id: generateAlertId(),
          type: 'energy_abnormal',
          severity: 'warning',
          equipmentId: equip.id,
          equipmentName: equip.name,
          message: `设备 ${equip.name} 能耗异常，当前功率 ${record.power.toFixed(
            1
          )} kW，超出历史均值 ${meanPower.toFixed(1)} kW 的 ${deviationPercent.toFixed(1)}%`,
          detectedAt: timestamp,
          timestamp,
          isResolved: false,
          details: {
            currentPower: record.power,
            averagePower: meanPower,
            deviationPercent,
            voltage: record.voltage,
            current: record.current,
            pisteId: assignedPiste,
          },
        });
      }
    }
  }

  return alerts;
}

function detectFrequentStartStopAnomalies(equipment: Equipment[]): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  const currentTime = new Date();

  for (const equip of equipment) {
    const history = equip.startStopHistory;
    if (!history || history.length < 4) continue;

    const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);
    const recentEvents = history.filter(
      (e) => new Date(e.timestamp).getTime() >= oneHourAgo.getTime()
    );

    const startCount = recentEvents.filter((e) => e.action === 'start').length;

    if (startCount > 3) {
      const timestamp = currentTime.toISOString();
      alerts.push({
        id: generateAlertId(),
        type: 'frequent_start_stop',
        severity: 'warning',
        equipmentId: equip.id,
        equipmentName: equip.name,
        message: `设备 ${equip.name} 1小时内启停 ${startCount} 次，疑似故障预警`,
        detectedAt: timestamp,
        timestamp,
        isResolved: false,
        details: {
          startCountInLastHour: startCount,
          totalEventsInLastHour: recentEvents.length,
          recentEvents,
        },
      });
    }
  }

  return alerts;
}

function detectPerformanceAnomalies(
  equipment: Equipment[],
  snowMakingRecords: SnowMakingRecord[]
): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];

  const modelGroups: Record<string, SnowMakingRecord[]> = {};
  for (const record of snowMakingRecords) {
    const equip = equipment.find((e) => e.id === record.equipmentId);
    if (!equip) continue;

    const durationHours =
      (new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) /
      (1000 * 60 * 60);
    if (durationHours <= 0) continue;

    if (!modelGroups[equip.model]) {
      modelGroups[equip.model] = [];
    }
    modelGroups[equip.model].push(record);
  }

  const modelAvgOutput: Record<string, number> = {};
  for (const [model, records] of Object.entries(modelGroups)) {
    if (records.length < 3) continue;

    const outputsPerHour = records.map((r) => {
      const durationHours =
        (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) /
        (1000 * 60 * 60);
      return r.snowOutput / durationHours;
    });

    modelAvgOutput[model] =
      outputsPerHour.reduce((sum, o) => sum + o, 0) / outputsPerHour.length;
  }

  for (const equip of equipment) {
    const avgOutput = modelAvgOutput[equip.model];
    if (!avgOutput) continue;

    const equipRecords = snowMakingRecords
      .filter((r) => r.equipmentId === equip.id)
      .sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )
      .slice(0, 3);

    if (equipRecords.length === 0) continue;

    for (const record of equipRecords) {
      const durationHours =
        (new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) /
        (1000 * 60 * 60);
      if (durationHours <= 0) continue;

      const outputPerHour = record.snowOutput / durationHours;
      const performanceRatio = outputPerHour / avgOutput;

      if (performanceRatio < 0.6) {
        const timestamp = record.endTime;
        alerts.push({
          id: generateAlertId(),
          type: 'performance_low',
          severity: 'warning',
          equipmentId: equip.id,
          equipmentName: equip.name,
          message: `设备 ${equip.name} 造雪性能异常，当前效率 ${outputPerHour.toFixed(
            1
          )} m³/h，仅为同型号设备均值 ${avgOutput.toFixed(1)} m³/h 的 ${(
            performanceRatio * 100
          ).toFixed(1)}%`,
          detectedAt: timestamp,
          timestamp,
          isResolved: false,
          details: {
            currentOutputPerHour: outputPerHour,
            modelAverageOutputPerHour: avgOutput,
            performanceRatio,
            model: equip.model,
            snowOutput: record.snowOutput,
            durationHours,
          },
        });
      }
    }
  }

  return alerts;
}

export function detectEquipmentAnomalies(
  equipment: Equipment[],
  pistes: SnowPiste[],
  energyRecords: EnergyRecord[],
  weather: Weather[],
  passengerFlows: PassengerFlow[],
  snowMakingRecords: SnowMakingRecord[]
): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];

  alerts.push(...detectEquipmentDownAnomalies(equipment, pistes, weather, passengerFlows));
  alerts.push(...detectEnergyAnomalies(equipment, energyRecords));
  alerts.push(...detectFrequentStartStopAnomalies(equipment));
  alerts.push(...detectPerformanceAnomalies(equipment, snowMakingRecords));

  const severityOrder: Record<AnomalySeverity, number> = {
    critical: 0,
    error: 1,
    warning: 2,
    info: 3,
  };

  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export type { AnomalyType, AnomalySeverity };
