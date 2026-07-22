import { query, withTransaction } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";
import { getSubscriptionForUser } from "../repositories/subscriptionRepository.js";
import { getPermissionsByPlan } from "../utils/permissions.js";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import {
  insertPlacementReportMessage,
  sanitizePlacementReportSnapshot,
} from "./messageService.js";

function placementPermissions(subscription) {
  if (subscription?.permissions && typeof subscription.permissions === "object") {
    return subscription.permissions;
  }
  return getPermissionsByPlan(subscription?.type || "free");
}

function placementAttempt(subscription) {
  const attempt = subscription?.metadata?.placementAttempt;
  if (attempt && typeof attempt === "object") return attempt;
  return null;
}

const PLACEMENT_TURN_LIMIT = 9;
const PLACEMENT_REPORT_LIMIT = 1;

function canonicalizeForHash(value) {
  if (Array.isArray(value)) return value.map(canonicalizeForHash);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value)
    .sort()
    .reduce((result, key) => {
      result[key] = canonicalizeForHash(value[key]);
      return result;
    }, {});
}

/**
 * Run one bounded Placement provider operation while holding the current
 * subscription row lock. A thrown provider/parse/logging error rolls back the
 * usage counter automatically.
 */
export async function withAuthorizedPlacementUsage(
  { userId, attemptId, operation, idempotencyKey, requestPayload },
  work
) {
  const id = String(attemptId || "").trim();
  if (!id || id.length > 64) {
    throw new AppError("VALIDATION_ERROR", "attemptId erforderlich.", 400);
  }
  if (operation !== "turn" && operation !== "report") {
    throw new AppError("VALIDATION_ERROR", "Ungültige Placement-Operation.", 400);
  }
  const key = String(idempotencyKey || "").trim();
  if (!/^[A-Za-z0-9._:-]{1,64}$/.test(key)) {
    throw new AppError("VALIDATION_ERROR", "Idempotency-Key ist ungültig.", 400);
  }
  const requestHash = createHash("sha256")
    .update(JSON.stringify(canonicalizeForHash(requestPayload || {})))
    .digest("hex");

  return withTransaction(async (q) => {
    const { rows } = await q(
      `SELECT * FROM subscriptions
       WHERE user_id = $1 AND is_current = TRUE
       ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [userId]
    );
    const subscription = rows[0];
    const attempt = placementAttempt(subscription);
    const validStatus =
      operation === "turn"
        ? attempt?.status === "in_progress"
        : attempt?.status === "in_progress" || attempt?.status === "completed";

    if (
      !subscription ||
      subscription.status !== "active" ||
      attempt?.id !== id ||
      !validStatus
    ) {
      throw new AppError(
        "PLACEMENT_NOT_ENTITLED",
        "Kein gültiger Placement-Versuch.",
        403
      );
    }

    const existingUsage = subscription.metadata?.placementUsage;
    const usage =
      existingUsage?.attemptId === id
        ? {
            attemptId: id,
            evaluatedTurns: Math.max(0, Number(existingUsage.evaluatedTurns) || 0),
            reports: Math.max(0, Number(existingUsage.reports) || 0),
            completedOperations: Array.isArray(existingUsage.completedOperations)
              ? existingUsage.completedOperations.slice(-10)
              : [],
          }
        : {
            attemptId: id,
            evaluatedTurns: 0,
            reports: 0,
            completedOperations: [],
          };

    const completed = usage.completedOperations.find(
      (item) => item?.operation === operation && item?.idempotencyKey === key
    );
    if (completed) {
      if (completed.requestHash !== requestHash) {
        throw new AppError(
          "IDEMPOTENCY_MISMATCH",
          "Idempotency-Key mit anderer Placement-Anfrage verwendet.",
          409
        );
      }
      return completed.response;
    }

    if (operation === "turn" && usage.evaluatedTurns >= PLACEMENT_TURN_LIMIT) {
      throw new AppError(
        "PLACEMENT_TURN_LIMIT_REACHED",
        "Maximale Anzahl der Placement-Auswertungen erreicht.",
        409
      );
    }
    if (operation === "report" && usage.reports >= PLACEMENT_REPORT_LIMIT) {
      throw new AppError(
        "PLACEMENT_REPORT_LIMIT_REACHED",
        "Placement-Bericht wurde bereits erstellt.",
        409
      );
    }

    const response = await work(q, { subscription, attempt, usage });

    if (operation === "turn") usage.evaluatedTurns += 1;
    else usage.reports += 1;
    usage.completedOperations.push({
      operation,
      idempotencyKey: key,
      requestHash,
      response,
    });

    const metadata = {
      ...(subscription.metadata || {}),
      placementUsage: usage,
    };
    await q(
      `UPDATE subscriptions SET metadata = $2::jsonb, updated_at = NOW()
       WHERE id = $1`,
      [subscription.id, JSON.stringify(metadata)]
    );

    return response;
  });
}

export async function getPlacementEntitlement(userId) {
  const subscription = await getSubscriptionForUser(userId);
  const permissions = placementPermissions(subscription);
  const remainingExams = Number(subscription?.remaining_exams ?? 0);
  const canTake =
    subscription?.status === "active" &&
    Boolean(permissions.placementTest) &&
    remainingExams > 0;
  const attempt = placementAttempt(subscription);

  return {
    canTake,
    remainingExams: canTake ? remainingExams : 0,
    planType: subscription?.type || "free",
    permissions,
    attemptStatus: canTake ? attempt?.status || "available" : attempt?.status || null,
    attemptId: canTake ? attempt?.id || null : null,
  };
}

export async function grantPlacementAttempt(userId) {
  const { rows: users } = await query(
    `SELECT id, status FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [userId]
  );
  if (!users.length) {
    throw new AppError("NOT_FOUND", "Benutzer nicht gefunden.", 404);
  }
  if (users[0].status === "blocked") {
    throw new AppError("AUTH_BLOCKED", "Benutzer ist gesperrt.", 403);
  }

  const existing = await getPlacementEntitlement(userId);
  if (existing.canTake) {
    return {
      granted: false,
      alreadyEntitled: true,
      remainingExams: existing.remainingExams,
      subscriptionType: existing.planType,
    };
  }

  const subscription = await withTransaction(async (q) => {
    await q(
      `UPDATE subscriptions SET is_current = FALSE, updated_at = NOW()
       WHERE user_id = $1 AND is_current = TRUE`,
      [userId]
    );
    const { rows } = await q(
      `INSERT INTO subscriptions (
         user_id, type, status, remaining_exams, permissions, is_current,
         start_date, metadata
       ) VALUES (
         $1, 'placement_test'::subscription_type, 'active', 1, $2::jsonb,
         TRUE, NOW(), $3::jsonb
       ) RETURNING *`,
      [
        userId,
        JSON.stringify(getPermissionsByPlan("placement_test")),
        JSON.stringify({
          source: "admin_grant_placement_pilot",
          creditsGranted: 0,
          placementAttempt: {
            id: randomUUID(),
            status: "available",
            grantedAt: new Date().toISOString(),
          },
        }),
      ]
    );
    await q(
      `UPDATE users SET plan = 'placement_test'::subscription_type, updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
    return rows[0];
  });

  return {
    granted: true,
    alreadyEntitled: false,
    remainingExams: Number(subscription.remaining_exams),
    subscriptionType: subscription.type,
  };
}

export async function beginPlacementAttempt(userId) {
  return withTransaction(async (q) => {
    const { rows } = await q(
      `SELECT * FROM subscriptions
       WHERE user_id = $1 AND is_current = TRUE
       ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [userId]
    );
    const subscription = rows[0];
    const permissions = placementPermissions(subscription);
    if (
      !subscription ||
      subscription.status !== "active" ||
      !permissions.placementTest ||
      Number(subscription.remaining_exams) < 1
    ) {
      throw new AppError(
        "PLACEMENT_NOT_ENTITLED",
        "Keine freigegebene Placement-Prüfung verfügbar.",
        403
      );
    }

    const existingAttempt = placementAttempt(subscription);
    if (existingAttempt?.status === "in_progress" && existingAttempt.id) {
      return {
        started: false,
        resumed: true,
        attemptId: existingAttempt.id,
        attemptStatus: "in_progress",
        remainingExams: Number(subscription.remaining_exams),
      };
    }

    const attemptId = existingAttempt?.id || randomUUID();
    const metadata = {
      ...(subscription.metadata || {}),
      placementAttempt: {
        ...existingAttempt,
        id: attemptId,
        status: "in_progress",
        startedAt: existingAttempt?.startedAt || new Date().toISOString(),
      },
    };
    await q(
      `UPDATE subscriptions
       SET metadata = $2::jsonb, updated_at = NOW()
       WHERE id = $1`,
      [subscription.id, JSON.stringify(metadata)]
    );

    return {
      started: true,
      resumed: false,
      attemptId,
      attemptStatus: "in_progress",
      remainingExams: Number(subscription.remaining_exams),
    };
  });
}

export async function completePlacementAttempt(userId, attemptId, reportSnapshot) {
  const id = String(attemptId || "").trim();
  if (!id || id.length > 64) {
    throw new AppError("VALIDATION_ERROR", "attemptId erforderlich.", 400);
  }

  const snapshot = sanitizePlacementReportSnapshot(reportSnapshot);

  return withTransaction(async (q) => {
    const { rows: replayRows } = await q(
      `SELECT remaining_after FROM exam_attempt_ledger
       WHERE user_id = $1 AND idempotency_key = $2 LIMIT 1`,
      [userId, id]
    );
    if (replayRows.length) {
      const messageId = await insertPlacementReportMessage(q, {
        userId,
        attemptId: id,
        snapshot,
      });
      return {
        completed: false,
        replayed: true,
        remainingExams: replayRows[0].remaining_after,
        messageId,
      };
    }

    const { rows } = await q(
      `SELECT * FROM subscriptions
       WHERE user_id = $1 AND is_current = TRUE
       ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [userId]
    );
    const subscription = rows[0];
    const permissions = placementPermissions(subscription);
    const attempt = placementAttempt(subscription);
    if (
      !subscription ||
      subscription.status !== "active" ||
      !permissions.placementTest ||
      Number(subscription.remaining_exams) < 1 ||
      attempt?.status !== "in_progress" ||
      attempt?.id !== id
    ) {
      throw new AppError("PLACEMENT_NOT_ENTITLED", "Kein aktiver Placement-Versuch.", 403);
    }

    const remaining = Number(subscription.remaining_exams) - 1;
    const nextPermissions =
      remaining <= 0 && subscription.type === "placement_test"
        ? { ...permissions, placementTest: false }
        : permissions;
    const metadata = {
      ...(subscription.metadata || {}),
      placementAttempt: {
        ...attempt,
        status: "completed",
        completedAt: new Date().toISOString(),
      },
    };
    await q(
      `UPDATE subscriptions
       SET remaining_exams = $2, permissions = $3::jsonb,
           metadata = $4::jsonb, updated_at = NOW()
       WHERE id = $1`,
      [subscription.id, remaining, JSON.stringify(nextPermissions), JSON.stringify(metadata)]
    );
    await q(
      `INSERT INTO exam_attempt_ledger
         (user_id, subscription_id, session_id, product_type, exam_index,
          idempotency_key, remaining_after)
       VALUES ($1, $2, NULL, 'placement_test'::product_type, 1, $3, $4)`,
      [userId, subscription.id, id, remaining]
    );

    const messageId = await insertPlacementReportMessage(q, {
      userId,
      attemptId: id,
      snapshot,
    });

    return { completed: true, replayed: false, remainingExams: remaining, messageId };
  });
}
