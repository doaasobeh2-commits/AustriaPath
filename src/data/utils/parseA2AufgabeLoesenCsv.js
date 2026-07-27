/**
 * Parse the canonical A2 Aufgabe lösen CSV (RFC4180-style quoted fields).
 * @param {string} csvText
 */
export function parseA2AufgabeLoesenCsv(csvText) {
  const lines = String(csvText || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    /** @type {Record<string, string>} */
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ?? '';
    });
    return row;
  });
}

/**
 * @param {string} line
 * @returns {string[]}
 */
function parseCsvLine(line) {
  /** @type {string[]} */
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}
