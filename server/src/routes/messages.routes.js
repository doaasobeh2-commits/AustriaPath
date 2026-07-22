import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { getMessage, listMessages } from "../services/messageService.js";
import { success } from "../utils/response.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    success(res, { items: await listMessages(req.auth.userId) });
  } catch (error) {
    next(error);
  }
});

router.get("/:messageId", requireAuth, async (req, res, next) => {
  try {
    const message = await getMessage(req.auth.userId, req.params.messageId);
    if (!message) throw new AppError("MESSAGE_NOT_FOUND", "Nachricht nicht gefunden.", 404);
    success(res, { message });
  } catch (error) {
    next(error);
  }
});

export default router;
