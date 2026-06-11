export type RiskLevel = 'low' | 'medium' | 'high';

export type PisteLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type PisteStatus = 'open' | 'closed' | 'maintenance';

export type EquipmentStatus = 'running' | 'stopped' | 'idle' | 'maintenance' | 'fault';

export type WeatherCondition = 'sunny' | 'cloudy' | 'snowy' | 'windy' | 'foggy';

export type AnomalySeverity = 'critical' | 'warning' | 'info' | 'error';

export type AnomalyType = 'equipment_down' | 'energy_abnormal' | 'frequent_start_stop' | 'performance_low' | 'equipment_fault' | 'performance_degradation' | 'snow_depth_insufficient';

export interface SnowPiste {
  id: string;
  name: string;
  level: PisteLevel;
  length: number;
  baseSnowDepth: number;
  currentSnowDepth: number;
  status: PisteStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  lastGroomedAt: string;
  positionX: number;
  positionY: number;
}

export interface Weather {
  timestamp: string;
  temperature: number;
  humidity: number;
  snowfall: number;
  windSpeed: number;
  weatherCondition: WeatherCondition;
}

export interface PassengerFlow {
  timestamp: string;
  pisteId: string;
  passengerCount: number;
  utilizationRate: number;
}

export interface GroomingRecord {
  id: string;
  pisteId: string;
  startTime: string;
  endTime: string;
  operator: string;
  qualityScore: number;
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  status: EquipmentStatus;
  runHours: number;
  lastMaintenance: string;
  energyConsumption: number;
  assignedPisteId: string;
  lastStatusChange?: string;
  startStopHistory?: { timestamp: string; action: 'start' | 'stop' }[];
}

export interface SnowMakingRecord {
  id: string;
  equipmentId: string;
  pisteId: string;
  startTime: string;
  endTime: string;
  snowOutput: number;
  energyUsed: number;
}

export interface EnergyRecord {
  id: string;
  equipmentId: string;
  timestamp: string;
  power: number;
  voltage: number;
  current: number;
}

export interface RiskFactorBreakdown {
  temperatureFactor: number;
  passengerFlowFactor: number;
  groomingIntervalFactor: number;
  snowDepthFactor: number;
}

export interface RiskCalculationResult {
  pisteId: string;
  pisteName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: RiskFactorBreakdown;
  calculationDetails: {
    temperature: number;
    currentPassengerCount: number;
    maxPassengerCapacity: number;
    groomingIntervalHours: number;
    baseSnowDepth: number;
    currentSnowDepth: number;
  };
  temperatureFactor: number;
  passengerFlowFactor: number;
  groomingIntervalFactor: number;
  snowDepthFactor: number;
  calculatedAt: string;
}

export interface GroomingSuggestion {
  id: string;
  pisteId: string;
  pisteName: string;
  priority: number;
  suggestedStartTime: string;
  suggestedEndTime: string;
  reason: string;
  riskScore: number;
  riskLevel: RiskLevel;
}

export interface SnowMakingSuggestion {
  id: string;
  pisteId: string;
  pisteName: string;
  equipmentId: string;
  equipmentName: string;
  priority: number;
  suggestedStartTime: string;
  suggestedEndTime: string;
  expectedSnowOutput: number;
  estimatedEnergyCost: number;
  expectedEfficiency: number;
  reason: string;
}

export interface AnomalyAlert {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  equipmentId?: string;
  equipmentName?: string;
  pisteId?: string;
  pisteName?: string;
  message: string;
  detectedAt: string;
  timestamp: string;
  isResolved: boolean;
  details: Record<string, unknown>;
}

export interface DataEntities {
  snowPistes: SnowPiste[];
  weatherRecords: Weather[];
  passengerFlowRecords: PassengerFlow[];
  groomingRecords: GroomingRecord[];
  equipment: Equipment[];
  snowMakingRecords: SnowMakingRecord[];
  energyRecords: EnergyRecord[];
}

export interface AppState extends DataEntities {
  riskCalculationResults: RiskCalculationResult[];
  groomingSuggestions: GroomingSuggestion[];
  snowMakingSuggestions: SnowMakingSuggestion[];
  anomalyAlerts: AnomalyAlert[];
  lastCalculatedAt: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AppActions {
  setData: (data: Partial<DataEntities>) => void;
  calculateRisk: () => RiskCalculationResult[];
  generateSuggestions: () => {
    groomingSuggestions: GroomingSuggestion[];
    snowMakingSuggestions: SnowMakingSuggestion[];
  };
  detectAnomalies: () => AnomalyAlert[];
  loadMockData: () => void;
  importCSV: (file: File) => Promise<boolean>;
  exportReport: () => string;
  resetData: () => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  resolveAlert: (alertId: string) => void;
}

export type AppStore = AppState & AppActions;

export const RISK_LEVEL_THRESHOLDS = {
  low: 40,
  medium: 70,
  high: 100,
} as const;

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: '#52c41a',
  medium: '#faad14',
  high: '#ff4d4f',
};

export const PISTE_LEVEL_LABELS: Record<PisteLevel, string> = {
  beginner: '初级道',
  intermediate: '中级道',
  advanced: '高级道',
  expert: '专家道',
};

export const PISTE_LEVEL_PRIORITY: Record<PisteLevel, number> = {
  expert: 4,
  advanced: 3,
  intermediate: 2,
  beginner: 1,
};

export interface MockData {
  pistes: SnowPiste[];
  weather: Weather[];
  passengerFlows: PassengerFlow[];
  groomingRecords: GroomingRecord[];
  equipment: Equipment[];
  snowMakingRecords: SnowMakingRecord[];
  energyRecords: EnergyRecord[];
}
