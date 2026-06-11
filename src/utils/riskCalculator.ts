import type { SnowPiste, Weather, PassengerFlow, RiskCalculationResult, RiskLevel, PisteLevel } from '@/store/types';

const MAX_PASSENGER_CAPACITY: Record<PisteLevel, number> = {
  beginner: 800,
  intermediate: 1200,
  advanced: 1500,
  expert: 2000,
};

function getRiskLevel(score: number): RiskLevel {
  if (score < 40) return 'low';
  if (score < 70) return 'medium';
  return 'high';
}

export function calculateRiskForPiste(
  piste: SnowPiste,
  weather: Weather,
  passengerFlow: PassengerFlow[]
): RiskCalculationResult {
  const currentTime = new Date();
  const lastGroomedTime = new Date(piste.lastGroomedAt);

  const groomingIntervalHours = (currentTime.getTime() - lastGroomedTime.getTime()) / (1000 * 60 * 60);

  const currentPassengerFlow = passengerFlow
    .filter((pf) => pf.pisteId === piste.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  const currentPassengerCount = currentPassengerFlow?.passengerCount ?? 0;
  const maxPassengerCapacity = MAX_PASSENGER_CAPACITY[piste.level];

  const temperatureFactor = Math.max(0, ((weather.temperature + 5) / 15) * 100);

  const passengerFlowFactor = (currentPassengerCount / maxPassengerCapacity) * 100;

  const groomingIntervalFactor = Math.min(100, (groomingIntervalHours / 24) * 100);

  const snowDepthFactor = Math.max(
    0,
    ((piste.baseSnowDepth - piste.currentSnowDepth) / piste.baseSnowDepth) * 100
  );

  const riskScore =
    temperatureFactor * 0.3 +
    passengerFlowFactor * 0.25 +
    groomingIntervalFactor * 0.25 +
    snowDepthFactor * 0.2;

  const clampedRiskScore = Math.max(0, Math.min(100, riskScore));

  return {
    pisteId: piste.id,
    pisteName: piste.name,
    riskScore: Math.round(clampedRiskScore * 100) / 100,
    riskLevel: getRiskLevel(clampedRiskScore),
    factors: {
      temperatureFactor: Math.round(temperatureFactor * 100) / 100,
      passengerFlowFactor: Math.round(passengerFlowFactor * 100) / 100,
      groomingIntervalFactor: Math.round(groomingIntervalFactor * 100) / 100,
      snowDepthFactor: Math.round(snowDepthFactor * 100) / 100,
    },
    calculationDetails: {
      temperature: weather.temperature,
      currentPassengerCount,
      maxPassengerCapacity,
      groomingIntervalHours: Math.round(groomingIntervalHours * 100) / 100,
      baseSnowDepth: piste.baseSnowDepth,
      currentSnowDepth: piste.currentSnowDepth,
    },
    temperatureFactor: Math.round(temperatureFactor * 100) / 100,
    passengerFlowFactor: Math.round(passengerFlowFactor * 100) / 100,
    groomingIntervalFactor: Math.round(groomingIntervalFactor * 100) / 100,
    snowDepthFactor: Math.round(snowDepthFactor * 100) / 100,
    calculatedAt: new Date().toISOString(),
  };
}

export { MAX_PASSENGER_CAPACITY, getRiskLevel };
