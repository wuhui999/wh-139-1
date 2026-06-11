import type {
  SnowPiste,
  Weather,
  PassengerFlow,
  GroomingRecord,
  Equipment,
  SnowMakingRecord,
  EnergyRecord,
  MockData,
  PisteLevel,
  WeatherCondition,
} from '@/store/types';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

function formatDate(date: Date): string {
  return date.toISOString();
}

function generatePistes(): SnowPiste[] {
  const pisteConfigs: {
    name: string;
    level: PisteLevel;
    length: number;
    baseSnowDepth: number;
    positionX: number;
    positionY: number;
  }[] = [
    { name: '初级道A', level: 'beginner', length: 0.8, baseSnowDepth: 40, positionX: 10, positionY: 80 },
    { name: '初级道B', level: 'beginner', length: 1.0, baseSnowDepth: 40, positionX: 25, positionY: 75 },
    { name: '中级道A', level: 'intermediate', length: 1.2, baseSnowDepth: 50, positionX: 40, positionY: 65 },
    { name: '中级道B', level: 'intermediate', length: 1.5, baseSnowDepth: 50, positionX: 55, positionY: 55 },
    { name: '中级道C', level: 'intermediate', length: 1.3, baseSnowDepth: 50, positionX: 70, positionY: 50 },
    { name: '高级道A', level: 'advanced', length: 1.8, baseSnowDepth: 60, positionX: 50, positionY: 35 },
    { name: '高级道B', level: 'advanced', length: 2.0, baseSnowDepth: 60, positionX: 65, positionY: 25 },
    { name: '专家道', level: 'expert', length: 2.5, baseSnowDepth: 70, positionX: 80, positionY: 15 },
  ];

  const now = new Date();

  return pisteConfigs.map((config, index) => {
    const hoursSinceGroomed = randomInRange(2, 28);
    const lastGroomed = new Date(now.getTime() - hoursSinceGroomed * 60 * 60 * 1000);
    const snowDepthReduction = randomInRange(5, 25);

    return {
      id: `piste_${index + 1}`,
      name: config.name,
      level: config.level,
      length: config.length,
      baseSnowDepth: config.baseSnowDepth,
      currentSnowDepth: config.baseSnowDepth - snowDepthReduction,
      status: 'open',
      riskScore: 0,
      riskLevel: 'low' as const,
      lastGroomedAt: formatDate(lastGroomed),
      positionX: config.positionX,
      positionY: config.positionY,
    };
  });
}

function generateWeather(): Weather[] {
  const weatherData: Weather[] = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);

  const weatherConditions: WeatherCondition[] = ['sunny', 'cloudy', 'snowy', 'windy'];

  for (let i = 0; i < 24; i++) {
    const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    const hour = time.getHours();

    let baseTemp: number;
    if (hour >= 6 && hour < 12) {
      baseTemp = randomInRange(-8, -2);
    } else if (hour >= 12 && hour < 18) {
      baseTemp = randomInRange(-5, 1);
    } else if (hour >= 18 && hour < 24) {
      baseTemp = randomInRange(-10, -3);
    } else {
      baseTemp = randomInRange(-15, -8);
    }

    const isSnowy = Math.random() < 0.2;
    const condition: WeatherCondition = isSnowy
      ? 'snowy'
      : weatherConditions[randomInt(0, weatherConditions.length - 2)];

    weatherData.push({
      timestamp: formatDate(time),
      temperature: Math.round(baseTemp * 10) / 10,
      humidity: randomInt(40, 90),
      snowfall: isSnowy ? Math.round(randomInRange(1, 8) * 10) / 10 : 0,
      windSpeed: Math.round(randomInRange(0, 25) * 10) / 10,
      weatherCondition: condition,
    });
  }

  return weatherData;
}

function generatePassengerFlows(pistes: SnowPiste[]): PassengerFlow[] {
  const passengerFlows: PassengerFlow[] = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);

  for (let i = 0; i < 24; i++) {
    const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    const hour = time.getHours();

    let peakFactor: number;
    if (hour >= 9 && hour < 12) {
      peakFactor = randomInRange(0.7, 1.0);
    } else if (hour >= 13 && hour < 17) {
      peakFactor = randomInRange(0.8, 1.0);
    } else if (hour >= 18 && hour < 21) {
      peakFactor = randomInRange(0.4, 0.7);
    } else if (hour >= 6 && hour < 9) {
      peakFactor = randomInRange(0.2, 0.5);
    } else {
      peakFactor = randomInRange(0, 0.1);
    }

    for (const piste of pistes) {
      let maxCapacity: number;
      switch (piste.level) {
        case 'beginner':
          maxCapacity = 800;
          break;
        case 'intermediate':
          maxCapacity = 1200;
          break;
        case 'advanced':
          maxCapacity = 1500;
          break;
        case 'expert':
          maxCapacity = 2000;
          break;
        default:
          maxCapacity = 1000;
      }

      const passengerCount = Math.floor(maxCapacity * peakFactor * randomInRange(0.8, 1.2));
      const utilizationRate = Math.round((passengerCount / maxCapacity) * 100 * 100) / 100;

      passengerFlows.push({
        timestamp: formatDate(time),
        pisteId: piste.id,
        passengerCount,
        utilizationRate,
      });
    }
  }

  return passengerFlows;
}

function generateGroomingRecords(pistes: SnowPiste[]): GroomingRecord[] {
  const groomingRecords: GroomingRecord[] = [];
  const now = new Date();
  const operators = ['张师傅', '李师傅', '王师傅', '赵师傅', '刘师傅'];

  for (const piste of pistes) {
    const recordCount = randomInt(2, 4);
    for (let i = 0; i < recordCount; i++) {
      const hoursAgo = randomInRange(2 + i * 12, 20 + i * 12);
      const startTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
      const durationMinutes = Math.round(piste.length * 15) + randomInt(-5, 10);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

      groomingRecords.push({
        id: generateId('grooming'),
        pisteId: piste.id,
        startTime: formatDate(startTime),
        endTime: formatDate(endTime),
        operator: operators[randomInt(0, operators.length - 1)],
        qualityScore: randomInt(70, 95),
      });
    }
  }

  return groomingRecords.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

function generateEquipment(pistes: SnowPiste[]): Equipment[] {
  const equipmentConfigs: {
    name: string;
    model: string;
  }[] = [
    { name: '造雪机-01', model: 'SnowMax Pro 2024' },
    { name: '造雪机-02', model: 'SnowMax Pro 2024' },
    { name: '造雪机-03', model: 'ArcticMaster X3' },
    { name: '造雪机-04', model: 'ArcticMaster X3' },
    { name: '造雪机-05', model: 'SnowMax Pro 2024' },
    { name: '造雪机-06', model: 'FrostKing S1' },
  ];

  const now = new Date();

  return equipmentConfigs.map((config, index) => {
    const isStopped = index === 2;
    const status = isStopped ? 'stopped' : 'running';
    const hoursSinceStatusChange = isStopped ? randomInRange(5, 10) : randomInRange(1, 24);
    const statusChangeTime = new Date(
      now.getTime() - hoursSinceStatusChange * 60 * 60 * 1000
    );

    const hoursSinceMaintenance = randomInRange(24 * 5, 24 * 15);
    const lastMaintenance = new Date(
      now.getTime() - hoursSinceMaintenance * 60 * 60 * 1000
    );

    const startStopHistory = [];
    for (let i = 0; i < randomInt(0, 6); i++) {
      const hoursAgo = randomInRange(0, 2);
      startStopHistory.push({
        timestamp: formatDate(new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)),
        action: i % 2 === 0 ? ('start' as const) : ('stop' as const),
      });
    }

    return {
      id: `equip_${index + 1}`,
      name: config.name,
      model: config.model,
      status,
      runHours: Math.round(randomInRange(100, 800) * 10) / 10,
      lastMaintenance: formatDate(lastMaintenance),
      energyConsumption: Math.round(randomInRange(15, 35) * 10) / 10,
      assignedPisteId: pistes[index % pistes.length].id,
      lastStatusChange: formatDate(statusChangeTime),
      startStopHistory,
    };
  });
}

function generateSnowMakingRecords(
  equipment: Equipment[],
  pistes: SnowPiste[]
): SnowMakingRecord[] {
  const snowMakingRecords: SnowMakingRecord[] = [];
  const now = new Date();

  for (const equip of equipment) {
    const recordCount = randomInt(3, 6);
    for (let i = 0; i < recordCount; i++) {
      const hoursAgo = randomInRange(4 + i * 24, 20 + i * 24);
      const startTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
      const durationHours = randomInRange(2, 6);
      const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

      const isPerformingPoorly = equip.id === 'equip_4';
      const baseOutputPerHour = isPerformingPoorly
        ? randomInRange(10, 20)
        : randomInRange(30, 50);
      const snowOutput = Math.round(baseOutputPerHour * durationHours * 10) / 10;
      const energyUsed = Math.round(snowOutput * randomInRange(8, 12) * 10) / 10;

      snowMakingRecords.push({
        id: generateId('snowmaking'),
        equipmentId: equip.id,
        pisteId: equip.assignedPisteId || pistes[randomInt(0, pistes.length - 1)].id,
        startTime: formatDate(startTime),
        endTime: formatDate(endTime),
        snowOutput,
        energyUsed,
      });
    }
  }

  return snowMakingRecords.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

function generateEnergyRecords(equipment: Equipment[]): EnergyRecord[] {
  const energyRecords: EnergyRecord[] = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);

  for (const equip of equipment) {
    const basePower = equip.energyConsumption || 25;
    const isAbnormal = equip.id === 'equip_3';

    for (let i = 0; i < 48; i++) {
      const time = new Date(now.getTime() - (47 - i) * 30 * 60 * 1000);

      let power: number;
      if (equip.status === 'stopped') {
        power = randomInRange(0, 2);
      } else if (isAbnormal && i > 40) {
        power = basePower * randomInRange(1.4, 1.8);
      } else {
        power = basePower * randomInRange(0.9, 1.1);
      }

      energyRecords.push({
        id: generateId('energy'),
        equipmentId: equip.id,
        timestamp: formatDate(time),
        power: Math.round(power * 10) / 10,
        voltage: Math.round(randomInRange(370, 390) * 10) / 10,
        current: Math.round((power / 380) * 1000 * 10) / 10,
      });
    }
  }

  return energyRecords;
}

export function generateMockData(): MockData {
  const pistes = generatePistes();
  const weather = generateWeather();
  const passengerFlows = generatePassengerFlows(pistes);
  const groomingRecords = generateGroomingRecords(pistes);
  const equipment = generateEquipment(pistes);
  const snowMakingRecords = generateSnowMakingRecords(equipment, pistes);
  const energyRecords = generateEnergyRecords(equipment);

  return {
    pistes,
    weather,
    passengerFlows,
    groomingRecords,
    equipment,
    snowMakingRecords,
    energyRecords,
  };
}

export {
  generatePistes,
  generateWeather,
  generatePassengerFlows,
  generateGroomingRecords,
  generateEquipment,
  generateSnowMakingRecords,
  generateEnergyRecords,
};
