/**
 * Format JS string arrays for PostgreSQL enum/text array parameters.
 * Works with node-pg and PGLite (which does not accept bare JS arrays).
 * @param {string[]} values
 */
export function formatPgTextArray(values) {
  if (!values?.length) return "{}";
  const escaped = values.map((v) => String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"'));
  return `{${escaped.join(",")}}`;
}
