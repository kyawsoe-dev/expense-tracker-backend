import { Router } from "express";
import { prisma } from "../../prisma/client";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { validateBody, validateQuery } from "../../common/middleware/validate.middleware";
import { GroupRepository } from "./group.repository";
import { GroupService } from "./group.service";
import { GroupController } from "./group.controller";
import {
  addGroupMemberSchema,
  createGroupSchema,
  renameGroupSchema,
  memberSuggestionQuerySchema
} from "./group.schema";

const router = Router();
const controller = new GroupController(
  new GroupService(new GroupRepository(prisma))
);

router.use(requireAuth);
router.get("/", controller.list);
router.get("/member-suggestions", validateQuery(memberSuggestionQuerySchema), controller.suggestMembers);
router.get("/:id", controller.detail);
router.post("/", validateBody(createGroupSchema), controller.create);
router.post("/:id/members", validateBody(addGroupMemberSchema), controller.addMember);
router.patch("/:id", validateBody(renameGroupSchema), controller.rename);
router.delete("/:id/members/:memberId", controller.removeMember);

export default router;
