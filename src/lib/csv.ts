/** one CSV column: its header and how a row reads in it */
export interface CsvColumn<T> {
  label: string;
  value: (row: T) => string;
}

const cell = (value: string) =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/**
 * CSV text with a UTF-8 BOM, so Excel opens Thai text correctly, and CRLF
 * line ends.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [
    columns.map((column) => cell(column.label)).join(","),
    ...rows.map((row) => columns.map((column) => cell(column.value(row))).join(",")),
  ];
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** hands `csv` to the browser as a download named `fileName` */
export function downloadCsv(csv: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
