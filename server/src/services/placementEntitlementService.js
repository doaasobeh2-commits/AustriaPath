import { query, withTransaction } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";
import { getSubscriptionForUser } from "../repositories/subscriptionRepository.js";
import { getPermissionsByPlan } from "../utils/permissions.js";
import { randomUUID } from "node:crypto";

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

export async function completePlacementAttempt(userId, attemptId) {
  const id = String(attemptId || "").trim();
  if (!id || id.length > 64) {
    throw new AppError("VALIDATION_ERROR", "attemptId erforderlich.", 400);
  }

  return withTransaction(async (q) => {
    const { rows: replayRows } = await q(
      `SELECT remaining_after FROM exam_attempt_ledger
       WHERE user_id = $1 AND idempotency_key = $2 LIMIT 1`,
      [userId, id]
    );
    if (replayRows.length) {
      return { completed: false, replayed: true, remainingExams: replayRows[0].remaining_after };
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

    return { completed: true, replayed: false, remainingExams: remaining };
  });
}
