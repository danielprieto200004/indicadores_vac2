
type TrafficLight = "verde" | "naranja" | "rojo";

export type MacroCardWithDetails = {
  id: string;
  reto: string;
  indicador: string;
  meta_1_value: number | null;
  meta_1_desc: string | null;
  meta_2_value: number | null;
  meta_2_desc: string | null;
  contributions_count: number;
  contributing_areas_count: number;
  missing_areas_count: number;
  contributions_completed_count: number;
  macro_percent_strict: number | null;
  macro_traffic_light: TrafficLight | null;
};

function TinyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-input bg-muted/20 px-3 py-2">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}


export function MacroCardsWithDialog({
  macroCardsWithDetails,
}: {
  macroCardsWithDetails: MacroCardWithDetails[];
}) {
  return (
    <div className="max-h-[480px] overflow-y-auto pr-2">
      <div className="grid gap-3">
        {macroCardsWithDetails.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-input bg-background p-4"
            >
              <div className="grid gap-4 lg:grid-cols-12 lg:items-start">

                {/* ── Lado izquierdo: texto ── */}
                <div className="min-w-0 space-y-3 lg:col-span-7">

                  {/* Título */}
                  <div>
                    <h3 className="text-sm font-semibold leading-snug text-foreground">
                      {m.reto}
                    </h3>
                  </div>

                  {/* Indicador */}
                  {m.indicador ? (
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Indicador
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                        {m.indicador}
                      </p>
                    </div>
                  ) : null}

                  {/* Metas */}
                  {(m.meta_1_value !== null || m.meta_1_desc) ? (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Metas
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(m.meta_1_value !== null || m.meta_1_desc) ? (
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-foreground">
                            <span className="mr-1 text-[10px] font-semibold text-muted-foreground">M1</span>
                            {m.meta_1_value ?? "—"}
                            {m.meta_1_desc ? ` — ${m.meta_1_desc}` : ""}
                          </span>
                        ) : null}
                        {(m.meta_2_value !== null || m.meta_2_desc) ? (
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-foreground">
                            <span className="mr-1 text-[10px] font-semibold text-muted-foreground">M2</span>
                            {m.meta_2_value ?? "—"}
                            {m.meta_2_desc ? ` — ${m.meta_2_desc}` : ""}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* ── Lado derecho: stats ── */}
                <div className="grid min-w-0 gap-2 lg:col-span-5">
                  <div className="grid grid-cols-2 gap-2">
                    <TinyStat label="Áreas que aportan" value={`${m.contributing_areas_count}`} />
                    <TinyStat label="Sin aporte" value={`${m.missing_areas_count}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <TinyStat label="Retos del área" value={`${m.contributions_count}`} />
                    <TinyStat
                      label="Completos"
                      value={`${m.contributions_completed_count}/${m.contributions_count}`}
                    />
                  </div>
                  <TinyStat
                    label="Avance (estricto)"
                    value={
                      typeof m.macro_percent_strict === "number"
                        ? `${Math.round(m.macro_percent_strict)}%`
                        : "—"
                    }
                  />
                </div>

              </div>
            </div>
        ))}
      </div>
    </div>
  );
}
