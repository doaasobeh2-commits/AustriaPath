import express from "express";
import cookieParser from "cookie-parser";
import { createCorsMiddleware } from "./config/cors.js";
import { newRequestId, attachResReq } from "./middleware/request.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import examSessionsRoutes from "./routes/examSessions.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import studentProfileRoutes from "./routes/studentProfile.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import placementRoutes from "./routes/placement.routes.js";
import webhooksRoutes from "./routes/webhooks.routes.js";
import examinerLabRoutes from "./routes/admin/examinerLab.routes.js";
import ruleRegistryPublicRoutes from "./routes/ruleRegistry.routes.js";
import ruleRegistryAdminRoutes from "./routes/admin/ruleRegistry.routes.js";
import usersRoutes from "./routes/users.routes.js";
import bootstrapRoutes from "./routes/bootstrap.routes.js";
import adminUsersRoutes from "./routes/admin/users.routes.js";
import migrationRoutes from "./routes/migration.routes.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(createCorsMiddleware());
  app.use(newRequestId);
  app.use(cookieParser());
  app.use((req, res, next) => {
    attachResReq(req, res, next);
  });

  app.use("/webhooks", webhooksRoutes);

  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRoutes);
  app.use("/auth", authRoutes);
  app.use("/exam-sessions", examSessionsRoutes);
  app.use("/reports", reportsRoutes);
  app.use("/student-profile", studentProfileRoutes);
  app.use("/subscription", subscriptionRoutes);
  app.use("/ai", aiRoutes);
  app.use("/placement", placementRoutes);
  app.use("/admin/examiner-lab", examinerLabRoutes);
  app.use("/admin/rule-registry", ruleRegistryAdminRoutes);
  app.use("/rule-registry", ruleRegistryPublicRoutes);
  app.use("/migration", migrationRoutes);
  app.use("/users", usersRoutes);
  app.use("/internal", bootstrapRoutes);
  app.use("/admin/users", adminUsersRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
