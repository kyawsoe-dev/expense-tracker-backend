import { Router } from "express";
import { prisma } from "../../prisma/client";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { validateBody } from "../../common/middleware/validate.middleware";
import { GroupRepository } from "./group.repository";
import { GroupService } from "./group.service";
import { GroupController } from "./group.controller";
import { addGroupMemberSchema, createGroupSchema } from "./group.schema";

const router = Router();
const controller = new GroupController(
  new GroupService(new GroupRepository(prisma))
);

router.use(requireAuth);
router.get("/", controller.list);
router.get("/:id", controller.detail);
router.post("/", validateBody(createGroupSchema), controller.create);
router.post("/:id/members", validateBody(addGroupMemberSchema), controller.addMember);

export default router;
