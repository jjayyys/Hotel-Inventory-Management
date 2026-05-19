import * as simulationService from './simulation';
import { CreateSimulationScenarioDto, SimulationScenario } from '@/types/simulation';

// Mock the apiRequest function
jest.mock('./api-client', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from './api-client';

describe('Simulation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSimulationScenario', () => {
    it('should call apiRequest with correct parameters', async () => {
      const dto: CreateSimulationScenarioDto = {
        name: 'Test Scenario',
        description: 'Test Description',
        scenarioType: 'occupancy_change',
        parameters: { occupancyPercentageChange: 20 },
        hotelId: 'hotel-123',
      };

      const mockResponse = {
        id: 'scenario-123',
        hotelId: dto.hotelId,
        name: dto.name,
        description: dto.description,
        scenarioType: dto.scenarioType,
        parameters: dto.parameters,
        baselineWindow: { start: '2026-04-17', end: '2026-05-17' },
        projectionWindow: { start: '2026-05-17', end: '2026-06-16' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (apiRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await simulationService.createSimulationScenario(dto);

      expect(apiRequest).toHaveBeenCalledWith('/simulation/scenarios', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('fetchSimulationScenarios', () => {
    it('should fetch all scenarios for a hotel', async () => {
      const hotelId = 'hotel-123';
      const mockScenarios = [
        {
          id: 'scenario-1',
          hotelId,
          name: 'Scenario 1',
          description: 'Desc 1',
          scenarioType: 'occupancy_change' as const,
          parameters: {},
          baselineWindow: { start: '2026-04-17', end: '2026-05-17' },
          projectionWindow: { start: '2026-05-17', end: '2026-06-16' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      (apiRequest as jest.Mock).mockResolvedValue(mockScenarios);

      const result = await simulationService.fetchSimulationScenarios(hotelId);

      expect(apiRequest).toHaveBeenCalledWith(
        `/simulation/scenarios?hotelId=${hotelId}`
      );
      expect(result).toEqual(mockScenarios);
    });

    it('should fetch scenarios without filter if no hotelId provided', async () => {
      const mockScenarios: SimulationScenario[] = [];

      (apiRequest as jest.Mock).mockResolvedValue(mockScenarios);

      const result = await simulationService.fetchSimulationScenarios();

      expect(apiRequest).toHaveBeenCalledWith('/simulation/scenarios');
      expect(result).toEqual(mockScenarios);
    });
  });

  describe('runSimulation', () => {
    it('should run a simulation', async () => {
      const scenarioId = 'scenario-123';
      const mockResponse = {
        scenarioId,
        hotelId: 'hotel-123',
        scenarioName: 'Test Scenario',
        projectionStart: '2026-04-17',
        projectionEnd: '2026-06-16',
        skusAffected: 5,
        results: [],
      };

      (apiRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await simulationService.runSimulation(scenarioId);

      expect(apiRequest).toHaveBeenCalledWith(
        `/simulation/scenarios/${scenarioId}/run`,
        { method: 'POST' }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteSimulationScenario', () => {
    it('should delete a scenario', async () => {
      const scenarioId = 'scenario-123';

      (apiRequest as jest.Mock).mockResolvedValue(undefined);

      await simulationService.deleteSimulationScenario(scenarioId);

      expect(apiRequest).toHaveBeenCalledWith(
        `/simulation/scenarios/${scenarioId}`,
        { method: 'DELETE' }
      );
    });
  });
});
