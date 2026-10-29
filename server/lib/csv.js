export function escapeCsv(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function rowsToCsv(rows) {
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
}
