"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { AuthGuard } from "@/features/auth/auth-guard";
import { SimulationForm } from "@/features/simulation/simulation-form";
import { SimulationResults } from "@/features/simulation/simulation-results";
import {
  createSimulationScenario,
  runSimulation,
  fetchSimulationScenarios,
} from "@/services/simulation";
import {
  CreateSimulationScenarioDto,
  SimulationResponse,
  SimulationScenario,
} from "@/types/simulation";
import { fetchDashboardDataset } from "@/services/dashboard";

export default function SimulationPage() {
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [selectedScenario, setSelectedScenario] =
    useState<SimulationScenario | null>(null);
  const [simulationResult, setSimulationResult] =
    useState<SimulationResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize hotel ID
  useEffect(() => {
    fetchDashboardDataset()
      .then((dataset) => setHotelId(dataset.hotelId))
      .catch((err: Error) => setError(err.message));
  }, []);

  // Load scenarios when hotel ID changes
  useEffect(() => {
    if (!hotelId) return;

    fetchSimulationScenarios(hotelId)
      .then(setScenarios)
      .catch(console.error);
  }, [hotelId]);

  const handleCreateScenario = async (dto: CreateSimulationScenarioDto) => {
    setIsCreating(true);
    try {
      const newScenario = await createSimulationScenario(dto);
      setScenarios((prev) => [newScenario, ...prev]);
      setSelectedScenario(newScenario);
      setSimulationResult(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRunSimulation = async () => {
    if (!selectedScenario) return;

    setIsRunning(true);
    try {
      const result = await runSimulation(selectedScenario.id);
      setSimulationResult(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  if (error && !hotelId) {
    return (
      <AuthGuard>
        <AppShell eyebrow="Simulation" title="What-if scenario analysis">
          <EmptyState
            title="Unable to load simulation"
            description={error}
          />
        </AppShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppShell eyebrow="Simulation" title="What-if scenario analysis">
        <div className="space-y-6">
          {/* Create New Scenario */}
          <div className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Create New Scenario
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Model different operational conditions and their impact on
              inventory recommendations.
            </p>
            {hotelId && (
              <div className="mt-5">
                <SimulationForm
                  hotelId={hotelId}
                  onSubmit={handleCreateScenario}
                  isLoading={isCreating}
                />
              </div>
            )}
          </div>

          {/* Scenarios List */}
          {scenarios.length > 0 && (
            <div className="rounded-[1.75rem] border border-[var(--line-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                Saved Scenarios
              </h3>
              <div className="mt-4 space-y-3">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    onClick={() => {
                      setSelectedScenario(scenario);
                      setSimulationResult(null);
                    }}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition ${
                      selectedScenario?.id === scenario.id
                        ? "border-[var(--accent)] bg-[var(--surface-1)]"
                        : "border-[var(--line-soft)] hover:bg-[var(--surface-1)]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">
                          {scenario.name}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {scenario.description}
                        </p>
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          Type: <strong>{scenario.scenarioType}</strong> · Created:{" "}
                          {new Date(scenario.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Run Simulation Button */}
          {selectedScenario && !simulationResult && (
            <button
              onClick={handleRunSimulation}
              disabled={isRunning}
              className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isRunning ? "Running simulation..." : "Run selected scenario"}
            </button>
          )}

          {/* Simulation Results */}
          {simulationResult && (
            <div>
              <button
                onClick={() => setSimulationResult(null)}
                className="mb-4 rounded-2xl border border-[var(--line-soft)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--surface-1)]"
              >
                ← Back to scenario
              </button>
              <SimulationResults
                results={simulationResult.results}
                scenarioName={simulationResult.scenarioName}
              />
            </div>
          )}

          {/* Empty State */}
          {scenarios.length === 0 && !selectedScenario && !error && (
            <EmptyState
              title="No scenarios yet"
              description="Create your first what-if scenario to analyze potential impacts on inventory recommendations."
            />
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
