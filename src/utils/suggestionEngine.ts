import type {
  SnowPiste,
  Weather,
  Equipment,
  GroomingSuggestion,
  SnowMakingSuggestion,
  PisteLevel,
  PassengerFlow,
} from '@/store/types';
import { calculateRiskForPiste } from './riskCalculator';

const PISTE_LEVEL_PRIORITY: Record<PisteLevel, number> = {
  expert: 4,
  advanced: 3,
  intermediate: 2,
  beginner: 1,
};

export function generateGroomingSuggestions(
  pistes: SnowPiste[],
  weather: Weather[],
  passengerFlows: PassengerFlow[]
): GroomingSuggestion[] {
  const latestWeather = [...weather].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];

  if (!latestWeather) {
    return [];
  }

  const currentTime = new Date();

  const pisteWithRisk = pistes.map((piste) => {
    const riskResult = calculateRiskForPiste(piste, latestWeather, passengerFlows);
    const lastGroomedTime = new Date(piste.lastGroomedAt);
    const groomingIntervalHours =
      (currentTime.getTime() - lastGroomedTime.getTime()) / (1000 * 60 * 60);

    const latestPisteFlow = passengerFlows
      .filter((pf) => pf.pisteId === piste.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return {
      piste,
      riskResult,
      groomingIntervalHours,
      passengerCount: latestPisteFlow?.passengerCount ?? 0,
    };
  });

  const sortedPistes = pisteWithRisk.sort((a, b) => {
    if (b.riskResult.riskScore !== a.riskResult.riskScore) {
      return b.riskResult.riskScore - a.riskResult.riskScore;
    }

    const levelPriorityA = PISTE_LEVEL_PRIORITY[a.piste.level];
    const levelPriorityB = PISTE_LEVEL_PRIORITY[b.piste.level];
    if (levelPriorityB !== levelPriorityA) {
      return levelPriorityB - levelPriorityA;
    }

    if (b.passengerCount !== a.passengerCount) {
      return b.passengerCount - a.passengerCount;
    }

    const aOver12h = a.groomingIntervalHours > 12 ? 1 : 0;
    const bOver12h = b.groomingIntervalHours > 12 ? 1 : 0;
    return bOver12h - aOver12h;
  });

  return sortedPistes.map((item, index) => {
    const reasons: string[] = [];
    reasons.push(`风险评分 ${item.riskResult.riskScore.toFixed(1)} 分`);

    if (item.groomingIntervalHours > 12) {
      reasons.push(`压雪间隔 ${item.groomingIntervalHours.toFixed(1)} 小时，超过12小时`);
    }

    const levelNames: Record<PisteLevel, string> = {
      beginner: '初级',
      intermediate: '中级',
      advanced: '高级',
      expert: '专家',
    };
    reasons.push(`${levelNames[item.piste.level]}道`);

    const now = new Date();
    const suggestedStartTime = new Date(now.getTime() + index * 30 * 60 * 1000);
    const suggestedEndTime = new Date(suggestedStartTime.getTime() + item.piste.length * 15 * 60 * 1000);

    return {
      id: `grooming_${Date.now()}_${index}`,
      pisteId: item.piste.id,
      pisteName: item.piste.name,
      pisteLevel: item.piste.level,
      riskScore: item.riskResult.riskScore,
      riskLevel: item.riskResult.riskLevel,
      priority: index + 1,
      suggestedStartTime: suggestedStartTime.toISOString(),
      suggestedEndTime: suggestedEndTime.toISOString(),
      estimatedDurationMinutes: Math.round(item.piste.length * 15),
      reason: reasons.join('，'),
      groomingIntervalHours: Math.round(item.groomingIntervalHours * 100) / 100,
      passengerCount: item.passengerCount,
    };
  });
}

export function generateSnowMakingSuggestions(
  pistes: SnowPiste[],
  equipment: Equipment[],
  weather: Weather[],
  passengerFlows: PassengerFlow[]
): SnowMakingSuggestion[] {
  const latestWeather = [...weather].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];

  if (!latestWeather) {
    return [];
  }

  const availableEquipment = equipment.filter((e) => e.status === 'running' || e.status === 'stopped');

  if (availableEquipment.length === 0) {
    return [];
  }

  const pisteWithRisk = pistes.map((piste) => ({
    piste,
    riskResult: calculateRiskForPiste(piste, latestWeather, passengerFlows),
  }));

  const sortedPistes = [...pisteWithRisk].sort(
    (a, b) => b.riskResult.riskScore - a.riskResult.riskScore
  );

  const suggestions: SnowMakingSuggestion[] = [];
  let equipmentIndex = 0;

  for (const item of sortedPistes) {
    const suitableWeather = weather.filter((w) => {
      const hour = new Date(w.timestamp).getHours();
      const isOffPeak = hour < 9 || hour >= 17;
      const isColdEnough = w.temperature < -2;
      return isOffPeak && isColdEnough;
    });

    if (suitableWeather.length === 0) {
      continue;
    }

    const bestWeather = suitableWeather.sort((a, b) => {
      const aEfficiency = (1 - a.humidity / 100) * 100;
      const bEfficiency = (1 - b.humidity / 100) * 100;
      return bEfficiency - aEfficiency;
    })[0];

    const efficiency = Math.round((1 - bestWeather.humidity / 100) * 100);

    const assignedEquipment = availableEquipment[equipmentIndex % availableEquipment.length];
    equipmentIndex++;

    const startTime = new Date(bestWeather.timestamp);
    startTime.setMinutes(0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 4);

    const reasons: string[] = [];
    reasons.push(`气温 ${bestWeather.temperature.toFixed(1)}°C，低于 -2°C`);
    reasons.push(`湿度 ${bestWeather.humidity}%，造雪效率约 ${efficiency}%`);
    reasons.push(`避开客流高峰时段 (9:00-17:00)`);

    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const expectedSnowOutput = 10 * durationHours;
    const estimatedEnergyCost = 50 * durationHours;
    const index = suggestions.length;

    suggestions.push({
      id: `snowmaking_${Date.now()}_${index}`,
      pisteId: item.piste.id,
      pisteName: item.piste.name,
      equipmentId: assignedEquipment.id,
      equipmentName: assignedEquipment.name,
      suggestedStartTime: startTime.toISOString(),
      suggestedEndTime: endTime.toISOString(),
      expectedSnowOutput,
      estimatedEnergyCost,
      priority: suggestions.length + 1,
      reason: reasons.join('，'),
      expectedEfficiency: efficiency,
    });
  }

  return suggestions;
}

export { PISTE_LEVEL_PRIORITY };
