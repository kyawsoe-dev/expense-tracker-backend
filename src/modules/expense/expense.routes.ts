import { Router } from "express";
import { prisma } from "../../prisma/client";
import { ExpenseRepository } from "./expense.repository";
import { ExpenseService } from "./expense.service";
import { ExpenseController } from "./expense.controller";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { validateBody } from "../../common/middleware/validate.middleware";
import { createExpenseSchema, updateExpenseSchema } from "./expense.schema";
import { GroupRepository } from "../group/group.repository";
import { GroupService } from "../group/group.service";

const router = Router();
const controller = new ExpenseController(
  new ExpenseService(
    new ExpenseRepository(prisma),
    new GroupService(new GroupRepository(prisma))
  )
);

router.use(requireAuth);
router.post("/", validateBody(createExpenseSchema), controller.create);
router.get("/", controller.list);
router.get("/by-group/:groupId", controller.listByGroup);
router.patch("/:id", validateBody(updateExpenseSchema), controller.update);
router.delete("/:id", controller.remove);
router.get("/summary/current-month", controller.summary);

export default router;
