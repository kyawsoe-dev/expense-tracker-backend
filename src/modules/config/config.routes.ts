import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { getConfig } from "./config.controller";

const router = Router();

router.get("/", requireAuth, getConfig);

export default router;
