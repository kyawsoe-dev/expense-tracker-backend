import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { env } from "../../config/env";

export function requireAdminApiKey(req: Request, _res: Response, next: NextFunction): void {
  if (!env.adminApiKey) {
    next();
    return;
  }

  const key = req.header("x-admin-api-key");
  if (key !== env.adminApiKey) {
    throw new AppError(401, "Missing or invalid admin API key");
  }

  next();
}
