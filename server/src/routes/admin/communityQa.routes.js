import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";
import { success } from "../../utils/response.js";
import {
  adminAnswerQuestion,
  adminSetAnswerVisibility,
  adminSetQuestionStatus,
  adminSetQuestionVisibility,
  listAdminQuestions,
} from "../../services/communityQaService.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/questions", async (req, res, next) => {
  try {
    success(res, await listAdminQuestions({
      page: req.query.page,
      limit: req.query.limit,
    }));
  } catch (e) {
    next(e);
  }
});

router.post("/questions/:questionId/answer", async (req, res, next) => {
  try {
    const answer = await adminAnswerQuestion(
      req.auth.userId,
      req.params.questionId,
      req.body?.body
    );
    success(res, { answer }, 201);
  } catch (e) {
    next(e);
  }
});

router.patch("/questions/:questionId/visibility", async (req, res, next) => {
  try {
    success(
      res,
      await adminSetQuestionVisibility(
        req.auth.userId,
        req.params.questionId,
        req.body?.visibility
      )
    );
  } catch (e) {
    next(e);
  }
});

router.patch("/questions/:questionId/status", async (req, res, next) => {
  try {
    success(
      res,
      await adminSetQuestionStatus(
        req.auth.userId,
        req.params.questionId,
        req.body?.status
      )
    );
  } catch (e) {
    next(e);
  }
});

router.patch("/answers/:answerId/visibility", async (req, res, next) => {
  try {
    success(
      res,
      await adminSetAnswerVisibility(
        req.auth.userId,
        req.params.answerId,
        req.body?.visibility
      )
    );
  } catch (e) {
    next(e);
  }
});

export default router;
