import {
  SimulationScenario,
  SimulationResponse,
  CreateSimulationScenarioDto,
} from "@/types/simulation";
import { apiRequest } from "./api-client";

export function createSimulationScenario(
  dto: CreateSimulationScenarioDto
): Promise<SimulationScenario> {
  return apiRequest<SimulationScenario>("/simulation/scenarios", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function fetchSimulationScenarios(
  hotelId?: string
): Promise<SimulationScenario[]> {
  const params = new URLSearchParams();
  if (hotelId) {
    params.set("hotelId", hotelId);
  }

  const query = params.toString();
  return apiRequest<SimulationScenario[]>(
    `/simulation/scenarios${query ? `?${query}` : ""}`
  );
}

export function fetchSimulationScenario(
  scenarioId: string
): Promise<SimulationScenario> {
  return apiRequest<SimulationScenario>(`/simulation/scenarios/${scenarioId}`);
}

export function runSimulation(
  scenarioId: string
): Promise<SimulationResponse> {
  return apiRequest<SimulationResponse>(
    `/simulation/scenarios/${scenarioId}/run`,
    { method: "POST" }
  );
}

export function deleteSimulationScenario(scenarioId: string): Promise<void> {
  return apiRequest<void>(`/simulation/scenarios/${scenarioId}`, {
    method: "DELETE",
  });
}
