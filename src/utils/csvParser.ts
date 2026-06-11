import type {
  SnowPiste,
  Weather,
  PassengerFlow,
  GroomingRecord,
  Equipment,
  SnowMakingRecord,
  PisteLevel,
  PisteStatus,
  EquipmentStatus,
  WeatherCondition,
  RiskLevel,
} from '@/store/types';

const FIELD_MAPPINGS: Record<string, Record<string, string[]>> = {
  pistes: {
    id: ['id', 'pisteId', 'piste_id', '雪道ID'],
    name: ['name', 'pisteName', 'piste_name', '雪道名称', '雪道名'],
    level: ['level', 'pisteLevel', 'piste_level', 'difficulty', '等级', '难度', '雪道等级'],
    length: ['length', 'pisteLength', 'piste_length', '长度', '雪道长度'],
    baseSnowDepth: [
      'baseSnowDepth',
      'base_snow_depth',
      'baseDepth',
      'base_depth',
      '基准雪深',
      '基础雪深',
    ],
    currentSnowDepth: [
      'currentSnowDepth',
      'current_snow_depth',
      'currentDepth',
      'current_depth',
      '当前雪深',
      '现有雪深',
    ],
    status: ['status', 'pisteStatus', 'piste_status', '状态', '雪道状态'],
    riskScore: ['riskScore', 'risk_score', '风险评分', '风险值'],
    riskLevel: ['riskLevel', 'risk_level', '风险等级'],
    lastGroomedAt: [
      'lastGroomedAt',
      'last_groomed_at',
      'lastGroomed',
      'last_groomed',
      '上次压雪时间',
      '最后压雪时间',
      '最后压雪',
    ],
    positionX: ['positionX', 'position_x', 'posX', 'pos_x', 'x坐标', '横坐标', 'X坐标'],
    positionY: ['positionY', 'position_y', 'posY', 'pos_y', 'y坐标', '纵坐标', 'Y坐标'],
  },
  weather: {
    timestamp: ['timestamp', 'time', 'date', '时间', '日期', '时间戳'],
    temperature: ['temperature', 'temp', '气温', '温度'],
    humidity: ['humidity', 'hum', '湿度'],
    snowfall: ['snowfall', 'snow', '降雪量', '降雪'],
    windSpeed: ['windSpeed', 'wind_speed', 'wind', '风速', '风力'],
    weatherCondition: [
      'weatherCondition',
      'weather_condition',
      'condition',
      '天气',
      '天气状况',
      '天气情况',
    ],
  },
  passengerFlows: {
    timestamp: ['timestamp', 'time', 'date', '时间', '日期', '时间戳'],
    pisteId: ['pisteId', 'piste_id', 'pisteID', '雪道ID'],
    passengerCount: [
      'passengerCount',
      'passenger_count',
      'count',
      'passengers',
      '客流量',
      '乘客数',
      '人数',
    ],
    utilizationRate: [
      'utilizationRate',
      'utilization_rate',
      'utilization',
      '利用率',
      '使用率',
    ],
  },
  groomingRecords: {
    id: ['id', 'recordId', 'record_id', 'groomingId', 'grooming_id', '记录ID', '压雪记录ID'],
    pisteId: ['pisteId', 'piste_id', 'pisteID', '雪道ID'],
    startTime: [
      'startTime',
      'start_time',
      'start',
      '开始时间',
      '压雪开始时间',
    ],
    endTime: [
      'endTime',
      'end_time',
      'end',
      '结束时间',
      '压雪结束时间',
    ],
    operator: ['operator', 'operatorName', '操作员', '操作人员', '压雪员'],
    qualityScore: [
      'qualityScore',
      'quality_score',
      'quality',
      '质量评分',
      '压雪质量',
      '质量',
    ],
  },
  equipment: {
    id: ['id', 'equipmentId', 'equipment_id', '设备ID', '造雪机ID'],
    name: ['name', 'equipmentName', 'equipment_name', '设备名称', '设备名', '造雪机名称'],
    model: ['model', 'equipmentModel', 'equipment_model', '型号', '设备型号', '机型'],
    status: ['status', 'equipmentStatus', 'equipment_status', '设备状态', '状态'],
    runHours: [
      'runHours',
      'run_hours',
      'operatingHours',
      'operating_hours',
      '运行时长',
      '运行时间',
      '工作时长',
    ],
    lastMaintenance: [
      'lastMaintenance',
      'last_maintenance',
      '上次维护时间',
      '最后维护时间',
      '上次保养',
    ],
    energyConsumption: [
      'energyConsumption',
      'energy_consumption',
      'powerConsumption',
      'power_consumption',
      '能耗',
      '耗电量',
      '功率消耗',
    ],
    assignedPisteId: [
      'assignedPisteId',
      'assigned_piste_id',
      'assignedPiste',
      'assigned_piste',
      '分配雪道ID',
      '负责雪道ID',
    ],
    lastStatusChange: [
      'lastStatusChange',
      'last_status_change',
      '上次状态变更时间',
      '最后状态变更',
    ],
  },
  snowMakingRecords: {
    id: ['id', 'recordId', 'record_id', 'snowMakingId', 'snow_making_id', '记录ID', '造雪记录ID'],
    equipmentId: [
      'equipmentId',
      'equipment_id',
      '造雪机ID',
      '设备ID',
    ],
    pisteId: ['pisteId', 'piste_id', 'pisteID', '雪道ID'],
    startTime: [
      'startTime',
      'start_time',
      'start',
      '开始时间',
      '造雪开始时间',
    ],
    endTime: [
      'endTime',
      'end_time',
      'end',
      '结束时间',
      '造雪结束时间',
    ],
    snowOutput: [
      'snowOutput',
      'snow_output',
      'output',
      '造雪量',
      '出雪量',
      '产雪量',
    ],
    energyUsed: [
      'energyUsed',
      'energy_used',
      'powerUsed',
      'power_used',
      '能耗',
      '耗电量',
      '用电量',
    ],
  },
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function parseCSVContent(content: string): string[][] {
  const lines = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim() !== '');

  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: string[][] = [headers];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      rows.push(values);
    }
  }

  return rows;
}

function mapRowToObject<T extends Record<string, unknown>>(
  headers: string[],
  values: string[],
  fieldMapping: Record<string, string[]>
): T {
  const obj: Record<string, unknown> = {};

  for (const [targetField, possibleNames] of Object.entries(fieldMapping)) {
    for (const possibleName of possibleNames) {
      const headerIndex = headers.findIndex(
        (h) => h.toLowerCase().trim() === possibleName.toLowerCase().trim()
      );
      if (headerIndex !== -1 && headerIndex < values.length) {
        const value = values[headerIndex];
        obj[targetField] = parseValue(value, targetField);
        break;
      }
    }
  }

  return obj as T;
}

function parseValue(value: string, fieldName: string): unknown {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const lowerField = fieldName.toLowerCase();
  const lowerValue = value.toLowerCase().trim();

  if (lowerValue === 'true' || lowerValue === 'false') {
    return lowerValue === 'true';
  }

  if (
    lowerField.includes('id') ||
    lowerField.includes('name') ||
    lowerField.includes('time') ||
    lowerField.includes('date') ||
    lowerField.includes('timestamp') ||
    lowerField.includes('operator') ||
    lowerField.includes('condition') ||
    lowerField.includes('status') ||
    lowerField.includes('level') ||
    lowerField.includes('model')
  ) {
    return value.trim();
  }

  const numValue = parseFloat(value);
  if (!isNaN(numValue) && value.trim() !== '') {
    return numValue;
  }

  return value.trim();
}

function detectDataType(headers: string[]): 'pistes' | 'weather' | 'passengerFlows' | 'groomingRecords' | 'equipment' | 'snowMakingRecords' | null {
  const headerSet = new Set(headers.map((h) => h.toLowerCase().trim()));

  const typeScores: Record<string, number> = {};

  for (const [dataType, mapping] of Object.entries(FIELD_MAPPINGS)) {
    let score = 0;
    for (const possibleNames of Object.values(mapping)) {
      for (const name of possibleNames) {
        if (headerSet.has(name.toLowerCase().trim())) {
          score++;
          break;
        }
      }
    }
    typeScores[dataType] = score;
  }

  let bestType: 'pistes' | 'weather' | 'passengerFlows' | 'groomingRecords' | 'equipment' | 'snowMakingRecords' | null = null;
  let bestScore = 0;

  const validTypes = ['pistes', 'weather', 'passengerFlows', 'groomingRecords', 'equipment', 'snowMakingRecords'] as const;

  for (const [type, score] of Object.entries(typeScores)) {
    if (score > bestScore && validTypes.includes(type as typeof validTypes[number])) {
      bestScore = score;
      bestType = type as typeof validTypes[number];
    }
  }

  return bestScore >= 2 ? bestType : null;
}

function normalizePisteLevel(level: unknown): PisteLevel {
  if (typeof level !== 'string') return 'intermediate';

  const l = level.toLowerCase();
  if (l.includes('beginner') || l.includes('初级') || l === '1' || l === 'easy') return 'beginner';
  if (l.includes('intermediate') || l.includes('中级') || l === '2' || l === 'normal')
    return 'intermediate';
  if (l.includes('advanced') || l.includes('高级') || l === '3' || l === 'hard') return 'advanced';
  if (l.includes('expert') || l.includes('专家') || l === '4' || l.includes('extreme'))
    return 'expert';

  return 'intermediate';
}

function normalizePisteStatus(status: unknown): PisteStatus {
  if (typeof status !== 'string') return 'open';

  const s = status.toLowerCase();
  if (s.includes('open') || s.includes('开放') || s === '1') return 'open';
  if (s.includes('closed') || s.includes('关闭') || s === '0') return 'closed';
  if (s.includes('maintenance') || s.includes('维护') || s.includes('维修')) return 'maintenance';

  return 'open';
}

function normalizeEquipmentStatus(status: unknown): EquipmentStatus {
  if (typeof status !== 'string') return 'running';

  const s = status.toLowerCase();
  if (s.includes('run') || s.includes('运行') || s.includes('工作') || s === '1') return 'running';
  if (s.includes('stop') || s.includes('停机') || s.includes('停止') || s === '0') return 'stopped';
  if (s.includes('maintenance') || s.includes('维护') || s.includes('保养')) return 'maintenance';
  if (s.includes('fault') || s.includes('故障') || s.includes('error')) return 'fault';

  return 'running';
}

function normalizeWeatherCondition(condition: unknown): WeatherCondition {
  if (typeof condition !== 'string') return 'sunny';

  const c = condition.toLowerCase();
  if (c.includes('sun') || c.includes('晴')) return 'sunny';
  if (c.includes('cloud') || c.includes('多云') || c.includes('阴')) return 'cloudy';
  if (c.includes('snow') || c.includes('雪')) return 'snowy';
  if (c.includes('wind') || c.includes('风')) return 'windy';
  if (c.includes('fog') || c.includes('雾')) return 'foggy';

  return 'sunny';
}

function normalizeISODate(value: unknown): string {
  if (typeof value !== 'string') {
    return new Date().toISOString();
  }

  let date: Date;

  if (value.includes('T') || value.includes('Z')) {
    date = new Date(value);
  } else if (value.includes('-') || value.includes('/')) {
    const parts = value.split(/[/-]/);
    if (parts.length === 3) {
      const year = parts[0].length === 4 ? parseInt(parts[0]) : 2000 + parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      date = new Date(year, month, day);
    } else {
      date = new Date(value);
    }
  } else {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 946656000000) {
      date = new Date(numValue);
    } else {
      date = new Date(value);
    }
  }

  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function parseCSV(content: string): {
  pistes: SnowPiste[];
  weather: Weather[];
  passengerFlows: PassengerFlow[];
  groomingRecords: GroomingRecord[];
  equipment: Equipment[];
  snowMakingRecords: SnowMakingRecord[];
} {
  const result = {
    pistes: [] as SnowPiste[],
    weather: [] as Weather[],
    passengerFlows: [] as PassengerFlow[],
    groomingRecords: [] as GroomingRecord[],
    equipment: [] as Equipment[],
    snowMakingRecords: [] as SnowMakingRecord[],
  };

  const sections = content.split(/\n\s*\n/);

  for (const section of sections) {
    const rows = parseCSVContent(section);
    if (rows.length < 2) continue;

    const headers = rows[0];
    const dataType = detectDataType(headers);

    if (!dataType) continue;

    const mapping = FIELD_MAPPINGS[dataType] as Record<string, string[]>;

    for (let i = 1; i < rows.length; i++) {
      const rawObj = mapRowToObject<Record<string, unknown>>(headers, rows[i], mapping);

      switch (dataType) {
        case 'pistes':
          result.pistes.push({
            id: String(rawObj.id || `piste_${i}`),
            name: String(rawObj.name || `雪道${i}`),
            level: normalizePisteLevel(rawObj.level),
            length: Number(rawObj.length) || 1,
            baseSnowDepth: Number(rawObj.baseSnowDepth) || 50,
            currentSnowDepth: Number(rawObj.currentSnowDepth) || 40,
            status: normalizePisteStatus(rawObj.status),
            riskScore: Number(rawObj.riskScore) || 0,
            riskLevel: (rawObj.riskLevel as RiskLevel) || 'low',
            lastGroomedAt: normalizeISODate(rawObj.lastGroomedAt),
            positionX: Number(rawObj.positionX) || 0,
            positionY: Number(rawObj.positionY) || 0,
          });
          break;

        case 'weather':
          result.weather.push({
            timestamp: normalizeISODate(rawObj.timestamp),
            temperature: Number(rawObj.temperature) || 0,
            humidity: Number(rawObj.humidity) || 50,
            snowfall: Number(rawObj.snowfall) || 0,
            windSpeed: Number(rawObj.windSpeed) || 0,
            weatherCondition: normalizeWeatherCondition(rawObj.weatherCondition),
          });
          break;

        case 'passengerFlows':
          result.passengerFlows.push({
            timestamp: normalizeISODate(rawObj.timestamp),
            pisteId: String(rawObj.pisteId || ''),
            passengerCount: Number(rawObj.passengerCount) || 0,
            utilizationRate: Number(rawObj.utilizationRate) || 0,
          });
          break;

        case 'groomingRecords':
          result.groomingRecords.push({
            id: String(rawObj.id || `grooming_${i}`),
            pisteId: String(rawObj.pisteId || ''),
            startTime: normalizeISODate(rawObj.startTime),
            endTime: normalizeISODate(rawObj.endTime),
            operator: String(rawObj.operator || ''),
            qualityScore: Number(rawObj.qualityScore) || 0,
          });
          break;

        case 'equipment': {
          const equip: Equipment = {
            id: String(rawObj.id || `equipment_${i}`),
            name: String(rawObj.name || `造雪机${i}`),
            model: String(rawObj.model || '标准型'),
            status: normalizeEquipmentStatus(rawObj.status),
            runHours: Number(rawObj.runHours) || 0,
            lastMaintenance: normalizeISODate(rawObj.lastMaintenance),
            energyConsumption: Number(rawObj.energyConsumption) || 0,
            assignedPisteId: String(rawObj.assignedPisteId || ''),
          };
          if (rawObj.lastStatusChange) {
            equip.lastStatusChange = normalizeISODate(rawObj.lastStatusChange);
          }
          result.equipment.push(equip);
          break;
        }

        case 'snowMakingRecords':
          result.snowMakingRecords.push({
            id: String(rawObj.id || `snowmaking_${i}`),
            equipmentId: String(rawObj.equipmentId || ''),
            pisteId: String(rawObj.pisteId || ''),
            startTime: normalizeISODate(rawObj.startTime),
            endTime: normalizeISODate(rawObj.endTime),
            snowOutput: Number(rawObj.snowOutput) || 0,
            energyUsed: Number(rawObj.energyUsed) || 0,
          });
          break;
      }
    }
  }

  return result;
}

export {
  FIELD_MAPPINGS,
  parseCSVLine,
  parseCSVContent,
  mapRowToObject,
  detectDataType,
  normalizePisteLevel,
  normalizePisteStatus,
  normalizeEquipmentStatus,
  normalizeWeatherCondition,
  normalizeISODate,
};
