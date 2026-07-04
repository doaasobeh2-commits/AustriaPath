import { Router } from "express";
import { success } from "../utils/response.js";

const router = Router();

router.get("/", (_req, res) => {
  success(res, { status: "ok", service: "austria-path-api", version: "2.0.0-gate0" });
});

export default router;
