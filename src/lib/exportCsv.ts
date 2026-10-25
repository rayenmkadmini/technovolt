/**
 * Client-side CSV export utility with UTF-8 BOM support
 * for perfect Arabic and French characters rendering in Excel,
 * with CSV/formula injection sanitization (CWE-1236)
 * and safe empty dataset handling.
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][] = []
) {
  try {
    const safeRows = Array.isArray(rows) ? rows : [];
    const escapeCell = (val: string | number) => {
      let stringVal = String(val ?? "");
      // Neutralize CSV / formula injection (cells starting with =, +, -, @, tab, or CR)
      if (/^[=+\-@\t\r]/.test(stringVal)) {
        stringVal = `'${stringVal}`;
      }
      if (
        stringVal.includes(",") ||
        stringVal.includes('"') ||
        stringVal.includes("\n") ||
        stringVal.includes(";")
      ) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    };

    const csvContent =
      "\uFEFF" + // UTF-8 Byte Order Mark for Excel
      [
        (headers || []).map(escapeCell).join(","),
        ...safeRows.map((row) => (row || []).map(escapeCell).join(",")),
      ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename || "export-technovolt"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export CSV error:", err);
  }
}
