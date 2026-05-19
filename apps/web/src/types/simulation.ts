export type ScenarioType = 'occupancy_change' | 'lead_time_change' | 'seasonal_shift' | 'supplier_delay' | 'demand_spike';

export type ScenarioParameters = Record<string, number | string | boolean>;

export interface SimulationScenario {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  scenarioType: ScenarioType;
  parameters: ScenarioParameters;
  baselineWindow: {
    start: string;
    end: string;
  };
  projectionWindow: {
    start: string;
    end: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SimulationResult {
  scenarioId: string;
  skuId: string;
  skuCode: string;
  skuName: string;
  baselineMetrics: {
    averageDailyDemand: number;
    recommendedQuantity: number;
    eoqValue: number;
    estimatedDaysOfCover: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  projectedMetrics: {
    averageDailyDemand: number;
    recommendedQuantity: number;
    eoqValue: number;
    estimatedDaysOfCover: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  variance: {
    demandChange: number;
    quantityChange: number;
    eoqChange: number;
    daysOfCoverChange: number;
    riskUpgrade: boolean;
  };
}

export interface SimulationResponse {
  scenarioId: string;
  hotelId: string;
  scenarioName: string;
  projectionStart: string;
  projectionEnd: string;
  skusAffected: number;
  results: SimulationResult[];
}

export interface CreateSimulationScenarioDto {
  name: string;
  description: string;
  scenarioType: ScenarioType;
  parameters: ScenarioParameters;
  hotelId: string;
  daysWindow?: number;
}
