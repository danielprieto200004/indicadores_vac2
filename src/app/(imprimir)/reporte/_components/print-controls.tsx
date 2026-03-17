"use client";

export function PrintControls({ year }: { year: number }) {
  return (
    <div className="print:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-blue-700 px-6 py-3 text-white shadow-lg">
      <div className="flex items-center gap-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 text-xs font-extrabold">
          VAC
        </div>
        <div>
          <p className="text-sm font-semibold">Reporte de Indicadores · {year}</p>
          <p className="text-xs text-blue-200">Listo para imprimir</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-white/20 hover:bg-white/30 px-4 py-1.5 text-sm font-medium transition-colors"
        >
          Imprimir / Guardar PDF
        </button>
        <button
          onClick={() => window.close()}
          className="rounded-lg border border-white/30 hover:bg-white/10 px-4 py-1.5 text-sm font-medium transition-colors"
        >
          Cerrar pestaña
        </button>
      </div>
    </div>
  );
}
