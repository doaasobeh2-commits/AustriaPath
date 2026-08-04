import { query } from "../db/client.js";
import { AppError } from "../middleware/errorHandler.js";
import { validateCommunityText } from "./contactFilterService.js";

const MEMBER_LABEL = "AustriaPath Member";
const TEAM_LABEL = "AustriaPath Team";
const MODERATION_MESSAGES = Object.freeze({
  hidden: "Diese Frage wurde aus der Community ausgeblendet.",
  removed: "Diese Frage wurde entfernt.",
});
const MAX_VISIBLE_ANSWERS = 3;
const MAX_QUESTIONS_PER_DAY = 3;
const MAX_ANSWERS_PER_DAY = 10;
const ADMIN_ATTENTION_HOURS = 40;

export function computeNeedsAdminAttention(question) {
  if (question.visibility !== "public") return false;
  if (Number(question.answer_count) > 0) return false;
  const createdAt = new Date(question.created_at).getTime();
  if (Number.isNaN(createdAt)) return false;
  return Date.now() - createdAt >= ADMIN_ATTENTION_HOURS * 3600000;
}

/**
 * @param {object} row
 */
export function serializePublicQuestion(row, { includeBody = false } = {}) {
  const item = {
    id: row.id,
    title: row.title,
    authorLabel: MEMBER_LABEL,
    status: row.status,
    answerCount: row.answer_count,
    level: row.level || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (includeBody) item.body = row.body;
  if (row.owner_archived_at !== undefined) {
    item.isOwnerArchived = Boolean(row.owner_archived_at);
  }
  return item;
}

/**
 * Owner-only serializer — includes safe moderation state, never internal identifiers.
 * @param {object} row
 */
export function serializeOwnerQuestion(row, options = {}) {
  const item = serializePublicQuestion(row, options);
  if (row.visibility === "hidden") {
    item.moderationState = "hidden";
    item.moderationMessage = MODERATION_MESSAGES.hidden;
  } else if (row.visibility === "removed") {
    item.moderationState = "removed";
    item.moderationMessage = MODERATION_MESSAGES.removed;
  } else {
    item.moderationState = null;
    item.moderationMessage = null;
  }
  return item;
}

/**
 * @param {object} row
 */
export function serializePublicAnswer(row) {
  return {
    id: row.id,
    body: row.body,
    authorLabel: row.author_type === "admin" ? TEAM_LABEL : MEMBER_LABEL,
    createdAt: row.created_at,
  };
}

async function logAdminAction(actorId, action, details, metadata = {}) {
  await query(
    `INSERT INTO admin_activity_log (actor_id, action, details, metadata)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [actorId, action, details, JSON.stringify(metadata)]
  );
}

async function getQuestionRow(questionId, { forUpdate = false } = {}) {
  const lock = forUpdate ? "FOR UPDATE" : "";
  const { rows } = await query(
    `SELECT * FROM community_questions WHERE id = $1 ${lock}`,
    [questionId]
  );
  return rows[0] || null;
}

async function countPublicAnswers(questionId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count
     FROM community_answers
     WHERE question_id = $1 AND visibility = 'public'`,
    [questionId]
  );
  return rows[0].count;
}

async function refreshQuestionCounters(questionId, clientQuery = query) {
  const count = await clientQuery(
    `SELECT COUNT(*)::int AS count
     FROM community_answers
     WHERE question_id = $1 AND visibility = 'public'`,
    [questionId]
  ).then((r) => r.rows[0].count);

  const q = await clientQuery(
    `SELECT status, closed_at FROM community_questions WHERE id = $1`,
    [questionId]
  ).then((r) => r.rows[0]);

  let status = q.status;
  let closedAt = q.closed_at;

  if (count >= MAX_VISIBLE_ANSWERS) {
    status = "closed";
    closedAt = closedAt || new Date().toISOString();
  } else if (count >= 1 && status === "open") {
    status = "answered";
  } else if (count === 0 && status === "answered") {
    status = "open";
    closedAt = null;
  } else if (count < MAX_VISIBLE_ANSWERS && status === "closed" && count > 0) {
    status = "answered";
    closedAt = null;
  }

  await clientQuery(
    `UPDATE community_questions
     SET answer_count = $2, status = $3, closed_at = $4, updated_at = NOW()
     WHERE id = $1`,
    [questionId, count, status, closedAt]
  );

  return { answerCount: count, status, closedAt };
}

async function assertQuestionDailyLimit(userId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count
     FROM community_questions
     WHERE author_user_id = $1
       AND created_at >= NOW() - INTERVAL '24 hours'`,
    [userId]
  );
  if (rows[0].count >= MAX_QUESTIONS_PER_DAY) {
    throw new AppError(
      "RATE_LIMITED",
      "Sie können maximal 3 Fragen pro Tag stellen.",
      429
    );
  }
}

async function assertAnswerDailyLimit(userId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS count
     FROM community_answers
     WHERE author_user_id = $1
       AND created_at >= NOW() - INTERVAL '24 hours'`,
    [userId]
  );
  if (rows[0].count >= MAX_ANSWERS_PER_DAY) {
    throw new AppError(
      "RATE_LIMITED",
      "Sie können maximal 10 Antworten pro Tag schreiben.",
      429
    );
  }
}

export async function createQuestion(userId, { title, body, level }) {
  await assertQuestionDailyLimit(userId);
  const cleanTitle = validateCommunityText(title, { min: 10, max: 200 });
  const cleanBody = validateCommunityText(body, { min: 20, max: 1500 });

  const { rows } = await query(
    `INSERT INTO community_questions (author_user_id, level, title, body)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, level || null, cleanTitle, cleanBody]
  );
  return serializePublicQuestion(rows[0], { includeBody: true });
}

export async function listPublicFeed({ page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
  const offset = (safePage - 1) * safeLimit;

  const { rows } = await query(
    `SELECT id, title, body, status, answer_count, level, created_at, updated_at
     FROM community_questions
     WHERE visibility = 'public'
       AND status IN ('open', 'answered', 'closed')
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [safeLimit, offset]
  );

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total
     FROM community_questions
     WHERE visibility = 'public'
       AND status IN ('open', 'answered', 'closed')`
  );

  return {
    items: rows.map((r) => serializePublicQuestion(r)),
    page: safePage,
    limit: safeLimit,
    total: countRows[0].total,
  };
}

export async function getQuestionDetail(questionId) {
  const question = await getQuestionRow(questionId);
  if (!question || question.visibility !== "public") {
    throw new AppError("NOT_FOUND", "Frage nicht gefunden.", 404);
  }

  const { rows: answers } = await query(
    `SELECT id, body, author_type, created_at
     FROM community_answers
     WHERE question_id = $1 AND visibility = 'public'
     ORDER BY created_at ASC
     LIMIT $2`,
    [questionId, MAX_VISIBLE_ANSWERS]
  );

  return {
    question: serializePublicQuestion(question, { includeBody: true }),
    answers: answers.map(serializePublicAnswer),
  };
}

export async function createAnswer(userId, questionId, body, { isAdmin = false } = {}) {
  const question = await getQuestionRow(questionId, { forUpdate: true });
  if (!question || question.visibility !== "public") {
    throw new AppError("NOT_FOUND", "Frage nicht gefunden.", 404);
  }
  if (question.status === "closed") {
    throw new AppError("VALIDATION_ERROR", "Diese Frage ist geschlossen.", 400);
  }
  if (!isAdmin && question.author_user_id === userId) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Sie können Ihre eigene Frage nicht beantworten.",
      400
    );
  }

  const publicCount = await countPublicAnswers(questionId);
  if (publicCount >= MAX_VISIBLE_ANSWERS) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Diese Frage hat bereits die maximale Anzahl an Antworten.",
      400
    );
  }

  if (!isAdmin) {
    await assertAnswerDailyLimit(userId);
  }

  const cleanBody = validateCommunityText(body, { min: 10, max: 1500 });
  const authorType = isAdmin ? "admin" : "member";

  try {
    const { rows } = await query(
      `INSERT INTO community_answers (question_id, author_user_id, author_type, body)
       VALUES ($1, $2, $3, $4)
       RETURNING id, body, author_type, created_at`,
      [questionId, userId, authorType, cleanBody]
    );

    await refreshQuestionCounters(questionId);

    return serializePublicAnswer(rows[0]);
  } catch (err) {
    if (err?.code === "23505") {
      throw new AppError(
        "VALIDATION_ERROR",
        "Sie haben diese Frage bereits beantwortet.",
        400
      );
    }
    throw err;
  }
}

export async function listMyQuestions(userId, { archived = false, page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
  const offset = (safePage - 1) * safeLimit;
  const archivedFilter = archived
    ? "owner_archived_at IS NOT NULL"
    : "owner_archived_at IS NULL";

  const { rows } = await query(
    `SELECT id, title, body, status, visibility, answer_count, level, owner_archived_at, created_at, updated_at
     FROM community_questions
     WHERE author_user_id = $1
       AND ${archivedFilter}
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, safeLimit, offset]
  );

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total
     FROM community_questions
     WHERE author_user_id = $1
       AND ${archivedFilter}`,
    [userId]
  );

  return {
    items: rows.map((r) => serializeOwnerQuestion(r, { includeBody: true })),
    page: safePage,
    limit: safeLimit,
    total: countRows[0].total,
    archived: Boolean(archived),
  };
}

export async function getMyQuestionDetail(userId, questionId) {
  const question = await getQuestionRow(questionId);
  if (!question || question.author_user_id !== userId) {
    throw new AppError("NOT_FOUND", "Frage nicht gefunden.", 404);
  }

  const { rows: answers } = await query(
    `SELECT id, body, author_type, created_at
     FROM community_answers
     WHERE question_id = $1 AND visibility = 'public'
     ORDER BY created_at ASC`,
    [questionId]
  );

  return {
    question: serializeOwnerQuestion(question, { includeBody: true }),
    answers: answers.map(serializePublicAnswer),
  };
}

export async function archiveMyQuestion(userId, questionId) {
  const question = await getQuestionRow(questionId);
  if (!question || question.author_user_id !== userId) {
    throw new AppError("NOT_FOUND", "Frage nicht gefunden.", 404);
  }
  await query(
    `UPDATE community_questions
     SET owner_archived_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [questionId]
  );
  return { archived: true };
}

export async function restoreMyQuestion(userId, questionId) {
  const question = await getQuestionRow(questionId);
  if (!question || question.author_user_id !== userId) {
    throw new AppError("NOT_FOUND", "Frage nicht gefunden.", 404);
  }
  await query(
    `UPDATE community_questions
     SET owner_archived_at = NULL, updated_at = NOW()
     WHERE id = $1`,
    [questionId]
  );
  return { archived: false };
}

export async function closeQuestionByOwner(userId, questionId) {
  const question = await getQuestionRow(questionId);
  if (!question || question.author_user_id !== userId) {
    throw new AppError("NOT_FOUND", "Frage nicht gefunden.", 404);
  }
  if (question.visibility !== "public") {
    throw new AppError("NOT_FOUND", "Frage nicht gefunden.", 404);
  }
  if (question.status === "closed") {
    return { status: "closed" };
  }
  await query(
    `UPDATE community_questions
     SET status = 'closed', closed_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [questionId]
  );
  return { status: "closed" };
}

export async function listAdminQuestions({ page = 1, limit = 30 } = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 30));
  const offset = (safePage - 1) * safeLimit;

  const { rows } = await query(
    `SELECT q.*, u.email AS author_email
     FROM community_questions q
     JOIN users u ON u.id = q.author_user_id
     ORDER BY q.created_at DESC
     LIMIT $1 OFFSET $2`,
    [safeLimit, offset]
  );

  const items = await Promise.all(
    rows.map(async (q) => {
      const { rows: answers } = await query(
        `SELECT a.*, u.email AS author_email
         FROM community_answers a
         JOIN users u ON u.id = a.author_user_id
         WHERE a.question_id = $1
         ORDER BY a.created_at ASC`,
        [q.id]
      );
      return {
        id: q.id,
        title: q.title,
        body: q.body,
        status: q.status,
        visibility: q.visibility,
        answerCount: q.answer_count,
        authorEmail: q.author_email,
        createdAt: q.created_at,
        needsAdminAttention: computeNeedsAdminAttention(q),
        answers: answers.map((a) => ({
          id: a.id,
          body: a.body,
          visibility: a.visibility,
          authorType: a.author_type,
          authorEmail: a.author_email,
          createdAt: a.created_at,
        })),
      };
    })
  );

  return { items, page: safePage, limit: safeLimit };
}

export async function adminSetQuestionVisibility(adminId, questionId, visibility) {
  if (!["public", "hidden", "removed"].includes(visibility)) {
    throw new AppError("VALIDATION_ERROR", "Ungültige Sichtbarkeit.", 400);
  }
  const question = await getQuestionRow(questionId);
  if (!question) throw new AppError("NOT_FOUND", "Frage nicht gefunden.", 404);

  await query(
    `UPDATE community_questions SET visibility = $2, updated_at = NOW() WHERE id = $1`,
    [questionId, visibility]
  );
  await logAdminAction(
    adminId,
    `community_question_${visibility}`,
    `Question ${questionId} set to ${visibility}`,
    { questionId, visibility }
  );
  return { visibility };
}

export async function adminSetAnswerVisibility(adminId, answerId, visibility) {
  if (!["public", "hidden", "removed"].includes(visibility)) {
    throw new AppError("VALIDATION_ERROR", "Ungültige Sichtbarkeit.", 400);
  }
  const { rows } = await query(`SELECT * FROM community_answers WHERE id = $1`, [answerId]);
  if (!rows.length) throw new AppError("NOT_FOUND", "Antwort nicht gefunden.", 404);

  await query(`UPDATE community_answers SET visibility = $2 WHERE id = $1`, [
    answerId,
    visibility,
  ]);
  await refreshQuestionCounters(rows[0].question_id);
  await logAdminAction(
    adminId,
    `community_answer_${visibility}`,
    `Answer ${answerId} set to ${visibility}`,
    { answerId, questionId: rows[0].question_id, visibility }
  );
  return { visibility };
}

export async function adminSetQuestionStatus(adminId, questionId, status) {
  if (!["open", "answered", "closed"].includes(status)) {
    throw new AppError("VALIDATION_ERROR", "Ungültiger Status.", 400);
  }
  const question = await getQuestionRow(questionId);
  if (!question) throw new AppError("NOT_FOUND", "Frage nicht gefunden.", 404);

  const closedAt = status === "closed" ? new Date().toISOString() : null;
  await query(
    `UPDATE community_questions
     SET status = $2, closed_at = $3, updated_at = NOW()
     WHERE id = $1`,
    [questionId, status, closedAt]
  );
  await logAdminAction(
    adminId,
    `community_question_status_${status}`,
    `Question ${questionId} status set to ${status}`,
    { questionId, status }
  );
  return { status };
}

export async function adminAnswerQuestion(adminId, questionId, body) {
  const answer = await createAnswer(adminId, questionId, body, { isAdmin: true });
  await logAdminAction(
    adminId,
    "community_admin_answer",
    `Admin answered question ${questionId}`,
    { questionId, answerId: answer.id }
  );
  return answer;
}
