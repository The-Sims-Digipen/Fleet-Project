import { useMemo } from "react";

import { createProjectDocument } from "../domain/projectDocument";
import { simulate } from "../Simulation/engine";
import { useFleetStore } from "../state/fleetStore";
import { usePresetStore } from "../state/presetStore";
import { useProjectStore } from "../state/projectStore";

export function SimulationPreview() {
    // Read the current project inputs from their stores.
    const vehicles = useFleetStore(
        (state) => state.vehicles,
    );

    const analysis = useFleetStore(
        (state) => state.analysis,
    );

    const presets = usePresetStore(
        (state) => state.presets,
    );

    const scenarios = useProjectStore(
        (state) => state.scenarios,
    );

    const activeScenarioId = useProjectStore(
        (state) => state.activeScenarioId,
    );

    // Find the currently selected scenario.
    const activeScenario = scenarios.find(
        (scenario) =>
            scenario.id === activeScenarioId,
    ) ?? scenarios[0];

    // Recalculate whenever a simulation input changes.
    const simulation = useMemo(() => {
        if (!activeScenario) {
            return {
                result: null,
                error: "No active scenario.",
            };
        }

        try {
            const project = createProjectDocument(
                presets,
                vehicles,
                analysis,
            );

            const result = simulate({
                project,
                scenario: activeScenario.document,
            });

            return {
                result,
                error: null,
            };
        } catch (error) {
            return {
                result: null,
                error:
                    error instanceof Error
                        ? error.message
                        : "Simulation failed.",
            };
        }
    }, [
        activeScenario,
        analysis,
        presets,
        vehicles,
    ]);

    const currency = new Intl.NumberFormat(
        "en-SG",
        {
            style: "currency",
            currency: analysis.currency,
            maximumFractionDigits: 0,
        },
    );

    if (simulation.error) {
        return (
            <section className="rounded-lg border border-red-700 bg-red-950/40 p-4">
                <p className="text-xs font-bold uppercase text-red-300">
                    Simulation error
                </p>

                <p className="mt-1 text-sm text-red-200">
                    {simulation.error}
                </p>
            </section>
        );
    }

    if (!simulation.result) {
        return null;
    }

    const result = simulation.result;

    return (
        <section className="rounded-lg border border-line-strong bg-panel p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                Live simulation engine
            </p>

            <h2 className="mt-1 text-lg font-semibold text-primary">
                {activeScenario?.name}
            </h2>

            <div className="mt-3 grid grid-cols-2 gap-3">
                <ResultValue
                    label="Baseline TCO"
                    value={currency.format(
                        result.baseline.tco,
                    )}
                />

                <ResultValue
                    label="Scenario TCO"
                    value={currency.format(
                        result.scenario.tco,
                    )}
                />

                <ResultValue
                    label="Savings"
                    value={currency.format(
                        result.savings,
                    )}
                />

                <ResultValue
                    label="Payback"
                    value={
                        result.payback.status ===
                            "not-reached"
                            ? "Not reached"
                            : String(result.payback.year)
                    }
                />
            </div>

            <p className="mt-3 text-xs text-secondary">
                Calculated by model{" "}
                {result.modelVersion} across{" "}
                {result.annual.length} years.
            </p>
        </section>
    );
}

function ResultValue({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded border border-line bg-control p-3">
            <p className="text-[10px] font-bold uppercase text-secondary">
                {label}
            </p>

            <p className="mt-1 font-mono text-sm font-semibold text-primary">
                {value}
            </p>
        </div>
    );
}