import { Router } from "express";
import { success } from "../utils/response.js";
import { requireAuth } from "../middleware/auth.js";
import {
  getLatestReport,
  getReport,
  listReports,
} from "../services/reportPersistenceService.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const items = await listReports(req.auth.userId, {
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
      productType: req.query.productType,
    });
    success(res, { items, pagination: { page: Number(req.query.page || 1), limit: 20, total: items.length, hasMore: false } });
  } catch (e) {
    next(e);
  }
});

router.get("/latest", requireAuth, async (req, res, next) => {
  try {
    const report = await getLatestReport(req.auth.userId);
    success(res, { report, legacy: report ? toLegacyReport(report) : null });
  } catch (e) {
    next(e);
  }
});

router.get("/:reportId", requireAuth, async (req, res, next) => {
  try {
    const report = await getReport(req.auth.userId, req.params.reportId);
    if (!report) {
      return next(Object.assign(new Error("NOT_FOUND"), { code: "REPORT_NOT_FOUND" }));
    }
    success(res, { report, legacy: toLegacyReport(report) });
  } catch (e) {
    next(e);
  }
});

function toLegacyReport(report) {
  return {
    id: report.reportId,
    title: `${report.productType} · ${report.cefrLevel}`,
    type: report.productType,
    level: report.cefrLevel,
    summary: report.summary,
    strengths: report.strengths,
    weaknesses: report.weaknesses,
    evaluationMethod: report.evaluationMethod,
    date: report.createdAt,
  };
}

export default router;
