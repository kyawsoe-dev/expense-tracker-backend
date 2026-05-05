import { Router } from "express";
import { prisma } from "../../prisma/client";
import { ExpenseRepository } from "./expense.repository";
import { ExpenseService } from "./expense.service";
import { ExpenseController } from "./expense.controller";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { validateBody, validateQuery } from "../../common/middleware/validate.middleware";
import {
  createExpenseSchema,
  expenseGroupListQuerySchema,
  expenseListQuerySchema,
  expenseMonthSummaryQuerySchema,
  expenseYearAnalyticsQuerySchema,
  updateExpenseSchema
} from "./expense.schema";
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
router.get("/", validateQuery(expenseListQuerySchema), controller.list);
router.get("/summary/current-month", controller.summary);
router.get("/summary/all-time", controller.allTimeSummary);
router.get("/summary/monthly", validateQuery(expenseMonthSummaryQuerySchema), controller.monthlySummary);
router.get("/analytics/yearly", validateQuery(expenseYearAnalyticsQuerySchema), controller.yearlyAnalytics);
router.get("/by-group/:groupId", validateQuery(expenseGroupListQuerySchema), controller.listByGroup);
router.get("/:id", controller.detail);
router.patch("/:id", validateBody(updateExpenseSchema), controller.update);
router.delete("/:id", controller.remove);

export default router;
