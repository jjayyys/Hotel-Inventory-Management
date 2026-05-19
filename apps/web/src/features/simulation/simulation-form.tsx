"use client";

import { useState } from "react";
import {
  CreateSimulationScenarioDto,
  ScenarioType,
  ScenarioParameters,
} from "@/types/simulation";

export interface SimulationFormProps {
  hotelId: string;
  onSubmit: (dto: CreateSimulationScenarioDto) => Promise<void>;
  isLoading?: boolean;
}

const SCENARIO_TEMPLATES: Record<
  ScenarioType,
  { label: string; description: string; defaultParameters: ScenarioParameters }
> = {
  occupancy_change: {
    label: "Occupancy Change",
    description: "Simulate demand change due to occupancy shift",
    defaultParameters: { occupancyPercentageChange: 20 },
  },
  lead_time_change: {
    label: "Lead Time Change",
    description: "Simulate supplier lead time increase",
    defaultParameters: { leadTimeDaysChange: 3 },
  },
  seasonal_shift: {
    label: "Seasonal Shift",
    description: "Simulate seasonal demand pattern",
    defaultParameters: { seasonalityFactor: 1.3 },
  },
  supplier_delay: {
    label: "Supplier Delay",
    description: "Simulate unexpected supplier delay",
    defaultParameters: { delayDays: 7 },
  },
  demand_spike: {
    label: "Demand Spike",
    description: "Simulate sudden demand surge",
    defaultParameters: { demandSpikePercentage: 50 },
  },
};

export function SimulationForm({
  hotelId,
  onSubmit,
  isLoading = false,
}: SimulationFormProps) {
  const [scenarioType, setScenarioType] = useState<ScenarioType>(
    "occupancy_change"
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState(
    SCENARIO_TEMPLATES.occupancy_change.defaultParameters
  );

  const template = SCENARIO_TEMPLATES[scenarioType];

  const handleScenarioTypeChange = (newType: ScenarioType) => {
    setScenarioType(newType);
    setParameters(SCENARIO_TEMPLATES[newType].defaultParameters);
  };

  const handleParameterChange = (
    key: string,
    value: number | string | boolean
  ) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dto: CreateSimulationScenarioDto = {
      name: name || template.label,
      description: description || template.description,
      scenarioType,
      parameters,
      hotelId,
    };

    await onSubmit(dto);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Scenario Type Selection */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-[var(--foreground)]">
          Scenario Type
        </legend>
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.entries(SCENARIO_TEMPLATES) as [ScenarioType, typeof template][]).map(
            ([type, info]) => (
              <label
                key={type}
                className={`cursor-pointer rounded-2xl border-2 p-4 transition ${
                  scenarioType === type
                    ? "border-[var(--accent)] bg-[var(--surface-1)]"
                    : "border-[var(--line-soft)] hover:bg-[var(--surface-1)]"
                }`}
              >
                <input
                  type="radio"
                  name="scenarioType"
                  value={type}
                  checked={scenarioType === type}
                  onChange={() => handleScenarioTypeChange(type)}
                  className="mr-3"
                />
                <span className="font-medium">{info.label}</span>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {info.description}
                </p>
              </label>
            )
          )}
        </div>
      </fieldset>

      {/* Name Field */}
      <div>
        <label className="block text-sm font-semibold text-[var(--foreground)]">
          Scenario Name (optional)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={template.label}
          className="mt-2 w-full rounded-2xl border border-[var(--line-soft)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Description Field */}
      <div>
        <label className="block text-sm font-semibold text-[var(--foreground)]">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={template.description}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-[var(--line-soft)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
        />
      </div>

      {/* Dynamic Parameters */}
      <fieldset className="space-y-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-1)] p-4">
        <legend className="text-sm font-semibold text-[var(--foreground)]">
          Scenario Parameters
        </legend>

        {Object.entries(parameters).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              {key.replace(/([A-Z])/g, " $1").toLowerCase()}
            </label>
            {typeof value === "number" ? (
              <input
                type="number"
                value={value}
                onChange={(e) =>
                  handleParameterChange(key, Number(e.target.value))
                }
                step="0.1"
                className="mt-1 w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
            ) : (
              <input
                type="text"
                value={String(value)}
                onChange={(e) => handleParameterChange(key, e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
            )}
          </div>
        ))}
      </fieldset>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Creating scenario..." : "Create simulation scenario"}
      </button>
    </form>
  );
}
