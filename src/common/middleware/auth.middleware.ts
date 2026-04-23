import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../errors/AppError";

export interface AuthPayload {
  sub: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const auth = req.header("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;

  if (!token) {
    throw new AppError(401, "Missing access token");
  }

  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    throw new AppError(401, "Invalid or expired access token");
  }
}
