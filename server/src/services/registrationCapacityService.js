import { withTransaction, query } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import { createUserWithProfile, getCurrentSubscription, rowToApiUser } from "../repositories/userRepository.js";
import { hashPassword } from "../utils/password.js";
import { createOneTimeToken } from "../repositories/tokenStoreRepository.js";
import { sendVerificationEmail } from "./emailService.js";

const TOKEN_ROUTE_VERIFY = "auth:email-verify";
const REGISTRATION_FULL_MESSAGE_DE =
  "Die aktuelle Testphase ist vollständig belegt. Sie können sich in die Warteliste eintragen. Wir informieren Sie, sobald neue Plätze verfügbar sind.";
const REGISTRATION_CLOSED_MESSAGE_DE =
  "Die Registrierung ist derzeit geschlossen. Sie können sich in die Warteliste eintragen.";

/** SQL fragment — users that count toward the public registration capacity. */
export function capacityCountSql(alias = "u") {
  const a = alias;
  return `
    ${a}.deleted_at IS NULL
    AND ${a}.status <> 'blocked'
    AND ${a}.role = 'student'
    AND LOWER(${a}.email) <> LOWER($1)
    AND ${a}.email NOT ILIKE '%@test.local'
    AND COALESCE(${a}.registration_capacity_exempt, FALSE) = FALSE
  `;
}

const REGISTRATION_GATE_LOCK_KEY = 482947231;

async function acquireRegistrationGateLock(clientQuery) {
  await clientQuery(`SELECT pg_advisory_xact_lock($1)`, [REGISTRATION_GATE_LOCK_KEY]);
}

export async function countCapacityUsers(clientQuery = query) {
  const { rows } = await clientQuery(
    `SELECT COUNT(*)::int AS count FROM users u WHERE ${capacityCountSql("u")}`,
    [env.adminEmail]
  );
  return rows[0].count;
}

async function syncCapacitySlotsUsed(clientQuery = query) {
  const counted = await countCapacityUsers(clientQuery);
  await clientQuery(
    `UPDATE registration_settings SET capacity_slots_used = $1, updated_at = NOW() WHERE id = 1`,
    [counted]
  );
  return counted;
}

async function reserveCapacitySlot(clientQuery) {
  const { rows } = await clientQuery(
    `WITH locked AS (
       SELECT * FROM registration_settings WHERE id = 1 FOR UPDATE
     )
     UPDATE registration_settings AS rs
     SET capacity_slots_used = rs.capacity_slots_used + 1, updated_at = NOW()
     FROM locked
     WHERE rs.id = 1
       AND locked.manual_state = 'open'
       AND rs.capacity_slots_used < rs.capacity
     RETURNING rs.capacity, rs.capacity_slots_used, rs.manual_state`
  );

  if (!rows.length) {
    const { rows: settingsRows } = await clientQuery(
      `SELECT manual_state FROM registration_settings WHERE id = 1`
    );
    if (settingsRows[0]?.manual_state === "closed") {
      throw new AppError("REGISTRATION_CLOSED", REGISTRATION_CLOSED_MESSAGE_DE, 403, {
        waitlistAvailable: true,
        registrationState: "manually_closed",
      });
    }
    throw new AppError("REGISTRATION_FULL", REGISTRATION_FULL_MESSAGE_DE, 403, {
      waitlistAvailable: true,
      registrationState: "capacity_full",
    });
  }

  return rows[0];
}

export function deriveRegistrationState(settings, counted) {
  if (settings.manual_state === "closed") return "manually_closed";
  if (counted >= settings.capacity) return "capacity_full";
  return "open";
}

export async function getRegistrationOverview(clientQuery = query) {
  const counted = await syncCapacitySlotsUsed(clientQuery);
  const { rows } = await clientQuery(
    `SELECT capacity, manual_state, capacity_slots_used FROM registration_settings WHERE id = 1`
  );
  const settings = rows[0] || { capacity: 70, manual_state: "open", capacity_slots_used: counted };
  const state = deriveRegistrationState(settings, counted);
  return {
    capacity: settings.capacity,
    counted,
    spotsRemaining: Math.max(0, settings.capacity - counted),
    manualState: settings.manual_state,
    registrationState: state,
    isOpen: state === "open",
  };
}

export async function assertRegistrationAllowed(clientQuery) {
  await reserveCapacitySlot(clientQuery);
}

export async function updateRegistrationSettings({ capacity, manualState }) {
  if (capacity !== undefined) {
    const safeCapacity = Number(capacity);
    if (!Number.isInteger(safeCapacity) || safeCapacity < 1) {
      throw new AppError("VALIDATION_ERROR", "Kapazität muss mindestens 1 sein.", 400);
    }
    await query(
      `UPDATE registration_settings SET capacity = $1, updated_at = NOW() WHERE id = 1`,
      [safeCapacity]
    );
  }
  if (manualState !== undefined) {
    if (!["open", "closed"].includes(manualState)) {
      throw new AppError("VALIDATION_ERROR", "Ungültiger Registrierungsstatus.", 400);
    }
    await query(
      `UPDATE registration_settings SET manual_state = $1, updated_at = NOW() WHERE id = 1`,
      [manualState]
    );
  }
  return getRegistrationOverview();
}

/**
 * Race-safe registration with capacity gate.
 */
export async function registerUserWithCapacityGate(body) {
  const email = body.email.trim().toLowerCase();

  const apiUser = await withTransaction(async (clientQuery) => {
    await acquireRegistrationGateLock(clientQuery);
    await reserveCapacitySlot(clientQuery);

    const passwordHash = await hashPassword(body.password);
    const user = await createUserWithProfile(
      {
        email,
        passwordHash,
        name: body.name,
        level: body.level,
      },
      clientQuery
    );

    return { ...user, display_name: body.name };
  });

  const sub = await getCurrentSubscription(apiUser.id);
  const result = rowToApiUser(apiUser, sub);

  try {
    const token = await createOneTimeToken(TOKEN_ROUTE_VERIFY, { userId: apiUser.id, email }, 48);
    const verifyUrl = `${env.corsOrigin}?verifyEmail=${token}`;
    await sendVerificationEmail(email, verifyUrl);
  } catch {
    /* non-blocking */
  }

  return result;
}