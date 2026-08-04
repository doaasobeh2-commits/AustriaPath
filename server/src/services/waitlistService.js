import { query } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validateWaitlistEmail(email) {
  const clean = normalizeEmail(email);
  if (!EMAIL_RE.test(clean)) {
    throw new AppError("VALIDATION_ERROR", "Ungültige E-Mail.", 400);
  }
  return clean;
}

export async function joinWaitlist({ email, displayName, preferredLanguage }) {
  const emailNormalized = validateWaitlistEmail(email);
  const safeName = displayName ? String(displayName).trim().slice(0, 120) : null;
  const safeLanguage = preferredLanguage
    ? String(preferredLanguage).trim().slice(0, 32)
    : null;

  try {
    const { rows } = await query(
      `INSERT INTO registration_waitlist (email, email_normalized, display_name, preferred_language)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, display_name, preferred_language, status, created_at`,
      [emailNormalized, emailNormalized, safeName, safeLanguage]
    );
    return {
      id: rows[0].id,
      email: rows[0].email,
      displayName: rows[0].display_name,
      preferredLanguage: rows[0].preferred_language,
      status: rows[0].status,
      createdAt: rows[0].created_at,
    };
  } catch (err) {
    if (err?.code === "23505") {
      throw new AppError(
        "WAITLIST_DUPLICATE",
        "Diese E-Mail steht bereits auf der Warteliste.",
        409
      );
    }
    throw err;
  }
}

export async function getWaitlistSummary() {
  const { rows } = await query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'waiting')::int AS waiting,
       COUNT(*) FILTER (WHERE status = 'registered')::int AS registered
     FROM registration_waitlist
     WHERE status <> 'removed'`
  );
  return rows[0];
}

export async function listWaitlistEntries({ search = "", limit = 50 } = {}) {
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  const term = String(search || "").trim().toLowerCase();
  const params = [];
  let where = `status <> 'removed'`;
  if (term) {
    params.push(`%${term}%`);
    where += ` AND (email_normalized LIKE $1 OR LOWER(COALESCE(display_name, '')) LIKE $1)`;
  }
  params.push(safeLimit);

  const { rows } = await query(
    `SELECT id, email, display_name, preferred_language, status, admin_notes,
            registered_at, created_at, updated_at
     FROM registration_waitlist
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length}`,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    preferredLanguage: row.preferred_language,
    status: row.status,
    adminNotes: row.admin_notes,
    registeredAt: row.registered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function updateWaitlistEntry(entryId, { status, adminNotes }) {
  if (status !== undefined) {
    if (!["waiting", "registered", "removed"].includes(status)) {
      throw new AppError("VALIDATION_ERROR", "Ungültiger Wartelistenstatus.", 400);
    }
  }

  const { rows } = await query(
    `UPDATE registration_waitlist
     SET status = COALESCE($2, status),
         admin_notes = COALESCE($3, admin_notes),
         registered_at = CASE
           WHEN $2 = 'registered' AND registered_at IS NULL THEN NOW()
           ELSE registered_at
         END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, display_name, preferred_language, status, admin_notes,
               registered_at, created_at, updated_at`,
    [entryId, status ?? null, adminNotes ?? null]
  );

  if (!rows.length) {
    throw new AppError("NOT_FOUND", "Wartelisteneintrag nicht gefunden.", 404);
  }

  const row = rows[0];
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    preferredLanguage: row.preferred_language,
    status: row.status,
    adminNotes: row.admin_notes,
    registeredAt: row.registered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function exportWaitlistCsv() {
  const { rows } = await query(
    `SELECT email, display_name, preferred_language, status, registered_at, created_at
     FROM registration_waitlist
     WHERE status <> 'removed'
     ORDER BY created_at DESC`
  );

  const header = "email,display_name,preferred_language,status,registered_at,created_at";
  const lines = rows.map((row) =>
    [
      csvEscape(row.email),
      csvEscape(row.display_name || ""),
      csvEscape(row.preferred_language || ""),
      csvEscape(row.status),
      csvEscape(row.registered_at || ""),
      csvEscape(row.created_at || ""),
    ].join(",")
  );
  return `${header}\n${lines.join("\n")}\n`;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
