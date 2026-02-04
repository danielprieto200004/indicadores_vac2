"use client";

import { useState } from "react";
import { Target } from "lucide-react";

import { MacroContributionsDialog } from "@/app/app/admin/_components/macro-contributions-dialog";
import type { ContributionDetail } from "@/app/app/admin/_components/macro-contributions-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type MacroRollupRow = {
  macro_id: string;
  year: number;
  reto: string;
  indicador: string;
  meta_1_value: number | null;
  meta_1_desc: string | null;
  meta_2_value: number | null;
  meta_2_desc: string | null;
  contributions_count: number;
  macro_percent_avg: number | null;
  contributions_with_updates: number;
};

function rowKey(m: MacroRollupRow) {
  return `${m.macro_id}_${m.year}`;
}

export function MacrosConsolidatedTable({
  macros,
  contributionsByMacro,
}: {
  macros: MacroRollupRow[];
  contributionsByMacro: Record<string, ContributionDetail[]>;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const selectedMacro = openKey ? macros.find((m) => rowKey(m) === openKey) : null;
  const selectedContributions = openKey ? (contributionsByMacro[openKey] ?? []) : [];

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Año</TableHead>
            <TableHead>Reto macro</TableHead>
            <TableHead>Indicador</TableHead>
            <TableHead>Metas</TableHead>
            <TableHead>Aportes</TableHead>
            <TableHead>Con avance</TableHead>
            <TableHead>Avance</TableHead>
            <TableHead className="w-[140px]">Quién aporta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {macros.map((m) => (
            <TableRow key={m.macro_id}>
              <TableCell className="font-medium">{m.year}</TableCell>
              <TableCell className="max-w-[320px]">{m.reto}</TableCell>
              <TableCell className="max-w-[320px]">{m.indicador}</TableCell>
              <TableCell className="space-y-1">
                <div className="text-sm">
                  {m.meta_1_value ?? "—"}{" "}
                  {m.meta_1_desc ? (
                    <span className="text-xs text-muted-foreground">— {m.meta_1_desc}</span>
                  ) : null}
                </div>
                {m.meta_2_value !== null || m.meta_2_desc ? (
                  <div className="text-sm">
                    {m.meta_2_value ?? "—"}{" "}
                    {m.meta_2_desc ? (
                      <span className="text-xs text-muted-foreground">— {m.meta_2_desc}</span>
                    ) : null}
                  </div>
                ) : null}
              </TableCell>
              <TableCell>{m.contributions_count}</TableCell>
              <TableCell>{m.contributions_with_updates}</TableCell>
              <TableCell>
                {typeof m.macro_percent_avg === "number" ? (
                  <Badge variant="secondary">{m.macro_percent_avg.toFixed(2)}%</Badge>
                ) : (
                  <Badge variant="outline">—</Badge>
                )}
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setOpenKey(rowKey(m))}
                >
                  <Target className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                  Ver quién aporta
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <MacroContributionsDialog
        open={!!openKey}
        onOpenChange={(open) => !open && setOpenKey(null)}
        reto={selectedMacro?.reto ?? ""}
        indicador={selectedMacro?.indicador ?? ""}
        contributionsDetail={selectedContributions}
      />
    </>
  );
}
