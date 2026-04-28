import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

export const socialLoginSchema = z.object({
  provider: z.enum(["google", "github"]),
  token: z.string().min(10)
});
