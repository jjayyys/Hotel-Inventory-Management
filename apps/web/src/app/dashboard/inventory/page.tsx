"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar, FilterInput } from "@/components/ui/filter-bar";
import { AuthGuard } from "@/features/auth/auth-guard";
import {
  fetchDashboardDataset,
  filterInventoryBatches,
} from "@/services/dashboard";
import { DashboardDataset } from "@/types/dashboard";

export default function InventoryPage() {
  const [dataset, setDataset] = useState<DashboardDataset | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDashboardDataset().then(setDataset).catch(console.error);
  }, []);

  const visibleBatches = dataset
    ? filterInventoryBatches(dataset.inventoryBatches, search)
    : [];

  return (
    <AuthGuard>
      <AppShell eyebrow="Inventory" title="Batch-level stock visibility">
        <div className="space-y-6">
          <FilterBar>
            <FilterInput
              value={search}
              placeholder="Filter by SKU name or code"
              onChange={setSearch}
            />
          </FilterBar>

          {!dataset ? (
            <EmptyState
              title="Loading inventory"
              description="Pulling inventory batches and stock relationships from the API."
            />
          ) : (
            <DataTable
              emptyMessage="No inventory batches match the current filter."
              rows={visibleBatches}
              columns={[
                {
                  key: "sku",
                  label: "SKU",
                  render: (row) => (
                    <Link
                      href={`/skus/${row.sku_id}`}
                      className="font-semibold text-[var(--foreground)] underline-offset-4 hover:underline"
                    >
                      {row.sku?.name ?? "Unknown SKU"}
                    </Link>
                  ),
                },
                {
                  key: "code",
                  label: "Code",
                  render: (row) => row.sku?.sku_code ?? "—",
                },
                {
                  key: "remaining",
                  label: "Remaining",
                  align: "right",
                  render: (row) =>
                    `${row.remaining_quantity} ${row.sku?.unit ?? ""}`.trim(),
                },
                {
                  key: "received",
                  label: "Received",
                  align: "right",
                  render: (row) =>
                    `${row.received_quantity} ${row.sku?.unit ?? ""}`.trim(),
                },
                {
                  key: "receivedDate",
                  label: "Received date",
                  render: (row) => row.received_date.slice(0, 10),
                },
                {
                  key: "expiry",
                  label: "Expiry date",
                  render: (row) => row.expiry_date.slice(0, 10),
                },
              ]}
            />
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
