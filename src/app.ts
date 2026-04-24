import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { logger } from "./config/logger";
import authRoutes from "./modules/auth/auth.routes";
import expenseRoutes from "./modules/expense/expense.routes";
import groupRoutes from "./modules/group/group.routes";
import { errorHandler } from "./common/middleware/error.middleware";
import { rateLimiter } from "./common/middleware/rateLimit.middleware";
import { registerOpenApi } from "./docs/openapi";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(rateLimiter);
  app.use(express.json());
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  if (process.env.NODE_ENV === "development") {
    registerOpenApi(app);
  }

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/groups", groupRoutes);
  app.use("/api/v1/expenses", expenseRoutes);

  app.use(errorHandler);

  return app;
}
