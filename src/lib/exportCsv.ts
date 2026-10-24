/**
 * Client-side CSV export utility with UTF-8 BOM support
 * for perfect Arabic and French characters rendering in Excel.
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const escapeCell = (val: string | number) => {
    const stringVal = String(val ?? "");
    if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n")) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const csvContent =
    "\uFEFF" + // UTF-8 Byte Order Mark for Excel
    [
      headers.map(escapeCell).join(","),
      ...rows.map((row) => row.map(escapeCell).join(",")),
    ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
