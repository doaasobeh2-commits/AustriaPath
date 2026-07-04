/**
 * Split SQL file into executable statements (handles plpgsql $$ blocks).
 * @param {string} sql
 */

function stripLeadingCommentsAndBlanks(text) {
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed === "" || trimmed.startsWith("--")) {
      i += 1;
      continue;
    }
    break;
  }
  return lines.slice(i).join("\n").trim();
}

export function splitSqlStatements(sql) {
  const statements = [];
  let current = "";
  let inDollar = false;

  for (const line of sql.replace(/\r\n/g, "\n").split("\n")) {
    if (line.includes("$$")) {
      inDollar = !inDollar;
    }
    current += `${line}\n`;
    if (!inDollar && (line.trim().endsWith(";") || line.trim() === ");")) {
      const stmt = stripLeadingCommentsAndBlanks(current.trim());
      if (stmt) statements.push(stmt);
      current = "";
    }
  }

  const tail = stripLeadingCommentsAndBlanks(current.trim());
  if (tail) statements.push(tail);
  return statements;
}
