import rateLimit from "express-rate-limit";
import { env } from "../../config/env";

const isDevelopment = env.nodeEnv === "development";

export const rateLimiter = rateLimit({
  windowMs: isDevelopment ? 60 * 1000 : env.rateLimitWindowMs, // 1 minute in dev, normal in prod
  max: isDevelopment ? 1000 : env.rateLimitMax, // Higher limit in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" },
  skip: (request) => isDevelopment, // Skip rate limiting in development
});
