import { Request, Response } from "express";
import { env } from "../../config/env";

export function getConfig(_req: Request, res: Response): void {
  res.json({
    openrouter: {
      apiKey: env.openrouterApiKey,
      baseUrl: env.openrouterBaseUrl,
      defaultModel: env.openrouterDefaultModel,
    },
  });
}
