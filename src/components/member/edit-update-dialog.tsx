"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ProgressUpdateForm,
  type ProgressEditData,
} from "./progress-update-form";
import {
  OwnProgressUpdateForm,
  type OwnEditData,
} from "./own-progress-update-form";

type TrafficLight = "verde" | "naranja" | "rojo";

interface ProgressUpdateRow {
  id: string;
  period_end: string;
  current_value: number | null;
  percent: number;
  traffic_light: TrafficLight;
  comment: string;
  evidence_path: string | null;
  evidence_link: string | null;
}

export function EditProgressUpdateButton({
  updateData,
  contributionId,
  areaId,
  metaArea,
  metaDesc,
}: {
  updateData: ProgressUpdateRow;
  contributionId: string;
  areaId: string;
  metaArea: number | null;
  metaDesc: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const editData: ProgressEditData = {
    id: updateData.id,
    report_date: updateData.period_end,
    current_value: updateData.current_value,
    percent: updateData.percent,
    traffic_light: updateData.traffic_light,
    comment: updateData.comment ?? "",
    evidence_path: updateData.evidence_path,
    evidence_link: updateData.evidence_link,
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        title="Editar avance"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar avance</DialogTitle>
            <DialogDescription>
              Modifica los datos del avance reportado. Puedes cambiar valores,
              evidencia y observaciones.
            </DialogDescription>
          </DialogHeader>
          {open && (
            <ProgressUpdateForm
              contributionId={contributionId}
              areaId={areaId}
              metaArea={metaArea}
              metaDesc={metaDesc}
              editData={editData}
              compact
              onSuccess={() => {
                setOpen(false);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface OwnUpdateRow {
  id: string;
  report_date: string;
  current_value: number | null;
  percent: number;
  traffic_light: TrafficLight;
  comment: string;
  evidence_path: string | null;
  evidence_link: string | null;
}

export function EditOwnUpdateButton({
  updateData,
  indicatorId,
  areaId,
  metaValue,
  metaDesc,
}: {
  updateData: OwnUpdateRow;
  indicatorId: string;
  areaId: string;
  metaValue: number | null;
  metaDesc: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const editData: OwnEditData = {
    id: updateData.id,
    report_date: updateData.report_date,
    current_value: updateData.current_value,
    percent: updateData.percent,
    traffic_light: updateData.traffic_light,
    comment: updateData.comment ?? "",
    evidence_path: updateData.evidence_path,
    evidence_link: updateData.evidence_link,
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        title="Editar avance"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar avance</DialogTitle>
            <DialogDescription>
              Modifica los datos del avance reportado. Puedes cambiar valores,
              evidencia y observaciones.
            </DialogDescription>
          </DialogHeader>
          {open && (
            <OwnProgressUpdateForm
              indicatorId={indicatorId}
              areaId={areaId}
              metaValue={metaValue}
              metaDesc={metaDesc}
              editData={editData}
              compact
              onSuccess={() => {
                setOpen(false);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
