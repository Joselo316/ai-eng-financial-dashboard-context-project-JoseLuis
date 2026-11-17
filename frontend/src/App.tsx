import { useEffect, useState, Suspense, lazy } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KPIRow } from "@/components/dashboard/kpi-row";
import {
  type FinancialMovement,
  type KPIMetrics,
  type MonthlyDataPoint,
} from "@/lib/financial-types";
import { computeKPIs, computeMonthlyData } from "@/lib/financial-utils";

// Lazy load chart components (heavy dependencies: recharts)
// Performance optimization: Code splitting for below-the-fold content
const IncomeOutcomeChart = lazy(() =>
  import("@/components/dashboard/income-outcome-chart").then((m) => ({
    default: m.IncomeOutcomeChart,
  }))
);
const ProfitPercentChart = lazy(() =>
  import("@/components/dashboard/profit-percent-chart").then((m) => ({
    default: m.ProfitPercentChart,
  }))
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function fetchFinancialData(): Promise<FinancialMovement[]> {
  const response = await fetch(`${API_BASE_URL}/api/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch financial data: ${response.status}`);
  }
  return response.json();
}

function App() {
  const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const period = monthlyData.length
    ? `${monthlyData[0].month} — ${monthlyData[monthlyData.length - 1].month}`
    : "Financial period";

  useEffect(() => {
    (async () => {
      try {
        const movements = await fetchFinancialData();
        const [metrics, monthlyData] = await Promise.all([
          Promise.resolve(computeKPIs(movements)),
          Promise.resolve(computeMonthlyData(movements))
        ]);
        setMetrics(metrics);
        setMonthlyData(monthlyData);
      } catch {
        setError(
          "No se pudo cargar la informacion financiera. Revisa la API de backend.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <DashboardHeader period={period} />

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground">
              {error}
            </div>
          ) : null}

          <section aria-label="Key performance indicators">
            <KPIRow metrics={metrics} loading={loading} />
          </section>

          <Suspense fallback={<div className="text-muted-foreground">Cargando gráficos...</div>}>
            <section
              aria-label="Financial charts"
              className="grid grid-cols-1 gap-4 xl:grid-cols-2"
            >
              <IncomeOutcomeChart data={monthlyData} loading={loading} />
              <ProfitPercentChart data={monthlyData} loading={loading} />
            </section>
          </Suspense>
        </div>
      </div>
    </main>
  );
}

export default App;
