import { Router } from "express";
import { prisma } from "../../prisma/client";
import { requireAdminApiKey } from "../../common/middleware/admin.middleware";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";

const router = Router();
const controller = new AdminController(new AdminService(prisma));

router.use(requireAdminApiKey);
router.get("/overview", controller.overview);

export default router;
