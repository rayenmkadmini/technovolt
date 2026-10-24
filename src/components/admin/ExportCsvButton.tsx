"use client";

import { exportToCsv } from "@/lib/exportCsv";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

interface ExportCsvButtonProps {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  label?: string;
}

export function ExportCsvButton({
  filename,
  headers,
  rows,
  label = "Exporter CSV",
}: ExportCsvButtonProps) {
  const handleExport = () => {
    exportToCsv(filename, headers, rows);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="gap-2 text-xs"
    >
      <Download className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}
