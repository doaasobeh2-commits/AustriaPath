import { Router } from "express";
import { requireAuth, requireActiveAccess } from "../middleware/auth.js";
import { success } from "../utils/response.js";
import {
  archiveMyQuestion,
  closeQuestionByOwner,
  createAnswer,
  createQuestion,
  getMyQuestionDetail,
  getQuestionDetail,
  listMyQuestions,
  listPublicFeed,
  restoreMyQuestion,
} from "../services/communityQaService.js";
import {
  communityAnswerDailyRateLimit,
  communityQuestionDailyRateLimit,
} from "../middleware/rateLimit.js";

const router = Router();

router.use(requireAuth, requireActiveAccess);

router.get("/questions", async (req, res, next) => {
  try {
    success(res, await listPublicFeed({
      page: req.query.page,
      limit: req.query.limit,
    }));
  } catch (e) {
    next(e);
  }
});

router.post("/questions", communityQuestionDailyRateLimit, async (req, res, next) => {
  try {
  const question = await createQuestion(req.auth.userId, {
      title: req.body?.title,
      body: req.body?.body,
      level: req.body?.level || req.auth.user?.level,
    });
    success(res, { question }, 201);
  } catch (e) {
    next(e);
  }
});

router.get("/questions/:questionId", async (req, res, next) => {
  try {
    success(res, await getQuestionDetail(req.params.questionId));
  } catch (e) {
    next(e);
  }
});

router.post(
  "/questions/:questionId/answers",
  communityAnswerDailyRateLimit,
  async (req, res, next) => {
    try {
      const answer = await createAnswer(
        req.auth.userId,
        req.params.questionId,
        req.body?.body
      );
      success(res, { answer }, 201);
    } catch (e) {
      next(e);
    }
  }
);

router.post("/questions/:questionId/close", async (req, res, next) => {
  try {
    success(res, await closeQuestionByOwner(req.auth.userId, req.params.questionId));
  } catch (e) {
    next(e);
  }
});

router.get("/my/questions", async (req, res, next) => {
  try {
    success(res, await listMyQuestions(req.auth.userId, {
      archived: req.query.archived === "true",
      page: req.query.page,
      limit: req.query.limit,
    }));
  } catch (e) {
    next(e);
  }
});

router.get("/my/questions/:questionId", async (req, res, next) => {
  try {
    success(res, await getMyQuestionDetail(req.auth.userId, req.params.questionId));
  } catch (e) {
    next(e);
  }
});

router.post("/my/questions/:questionId/archive", async (req, res, next) => {
  try {
    success(res, await archiveMyQuestion(req.auth.userId, req.params.questionId));
  } catch (e) {
    next(e);
  }
});

router.post("/my/questions/:questionId/restore", async (req, res, next) => {
  try {
    success(res, await restoreMyQuestion(req.auth.userId, req.params.questionId));
  } catch (e) {
    next(e);
  }
});

export default router;
