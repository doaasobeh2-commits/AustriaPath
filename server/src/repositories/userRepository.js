import { query } from "../db/client.js";
import { formatPgTextArray } from "../db/arrays.js";
import { getPermissionsByPlan } from "../utils/permissions.js";
import { env } from "../config/env.js";
import { accessFieldsForUser } from "../services/accessService.js";

function defaultAllowedLevels(level) {
  if (level === "B2") return ["A2", "B1", "B2"];
  if (level === "B1") return ["A2", "B1"];
  return ["A2"];
}

function mapCefrLevel(level) {
  const l = String(level || "B1").toUpperCase();
  if (["A2", "B1", "B2"].includes(l)) return l;
  return "B1";
}

export function rowToApiUser(row, subscriptionRow) {
  const sub = subscriptionRow || {
    type: row.plan || "free",
    status: "inactive",
    remaining_exams: 0,
    end_date: null,
    permissions: getPermissionsByPlan(row.plan || "free"),
  };

  return {
    id: row.id,
    email: row.email,
    name: row.display_name || row.email?.split("@")[0] || "Student",
    role: row.role,
    status: row.status,
    level: row.level?.replace("+", "") || row.level || "B1",
    allowedLevels: row.allowed_levels || defaultAllowedLevels(row.level),
    emailVerified: row.email_verified,
    subscription: {
      type: sub.type,
      status: sub.status,
      remainingExams: sub.remaining_exams ?? 0,
      endDate: sub.end_date || null,
    },
    permissions:
      typeof sub.permissions === "object"
        ? sub.permissions
        : getPermissionsByPlan(sub.type),
    aiCredits: row.ai_credits ?? 0,
    usedAiCredits: row.used_ai_credits ?? 0,
    ...accessFieldsForUser(row, env.adminEmail),
  };
}

export async function findUserByEmail(email) {
  const { rows } = await query(
    `SELECT u.*, p.display_name
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE LOWER(u.email) = LOWER($1) AND u.deleted_at IS NULL
     LIMIT 1`,
    [email.trim()]
  );
  return rows[0] || null;
}

export async function findUserById(userId) {
  const { rows } = await query(
    `SELECT u.*, p.display_name
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.id = $1 AND u.deleted_at IS NULL
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function getCurrentSubscription(userId) {
  const { rows } = await query(
    `SELECT * FROM subscriptions
     WHERE user_id = $1 AND is_current = TRUE
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function createUserWithProfile({
  email,
  passwordHash,
  name,
  level,
}) {
  const cefr = mapCefrLevel(level);
  const allowed = defaultAllowedLevels(cefr);

  const { rows } = await query(
    `INSERT INTO users (email, password_hash, level, allowed_levels, ai_credits)
     VALUES ($1, $2, $3::cefr_label, $4::cefr_label[], 5)
     RETURNING *`,
    [email.trim().toLowerCase(), passwordHash, cefr, formatPgTextArray(allowed)]
  );
  const user = rows[0];

  await query(
    `INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)`,
    [user.id, name.trim()]
  );

  await query(
    `INSERT INTO subscriptions (user_id, type, status, remaining_exams, permissions, is_current)
     VALUES ($1, 'free', 'inactive', 0, $2::jsonb, TRUE)`,
    [user.id, JSON.stringify(getPermissionsByPlan("free"))]
  );

  await query(
    `INSERT INTO student_learning_profiles (user_id, profile_json, official_exam_level)
     VALUES ($1, $2::jsonb, $3::cefr_label)`,
    [
      user.id,
      JSON.stringify({
        profileVersion: "2.0.0",
        officialExamLevel: cefr,
        officialSkillLevels: {},
        weakSkills: [],
        recurringMistakes: [],
        globalUsedModelIds: [],
        examHistory: [],
        practiceHistory: [],
        practiceStats: { sessionsCompleted: 0, minutesPracticed: 0, skillPracticeCounts: {} },
        reportSummaries: [],
        aiRecommendations: [],
        updatedAt: new Date().toISOString(),
      }),
      cefr,
    ]
  );

  await query(
    `INSERT INTO ai_credits (user_id, amount, balance_after, reason)
     VALUES ($1, 5, 5, 'registration_default')`,
    [user.id]
  );

  user.display_name = name.trim();
  return user;
}

export async function updateLastLogin(userId) {
  await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [userId]);
}

export function isReservedAdminEmail(email) {
  return email.trim().toLowerCase() === env.adminEmail;
}
