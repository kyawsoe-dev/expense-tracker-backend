import { Router } from "express";
import { prisma } from "../../prisma/client";
import { requireAdminApiKey } from "../../common/middleware/admin.middleware";
import { validateBody, validateQuery } from "../../common/middleware/validate.middleware";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import {
  adminExpenseByUserQuerySchema,
  adminExpenseCreateSchema,
  adminExpenseListQuerySchema,
  adminExpenseUpdateSchema,
  adminGroupCreateSchema,
  adminGroupUpdateSchema,
  adminPaginationQuerySchema,
  adminUserCreateSchema,
  adminUserUpdateSchema
} from "./admin.schema";

const router = Router();
const controller = new AdminController(new AdminService(prisma));

router.use(requireAdminApiKey);
router.get("/overview", controller.overview);
router.get("/analytics", controller.analytics);

router.get("/users", validateQuery(adminPaginationQuerySchema), controller.listUsers);
router.post("/users", validateBody(adminUserCreateSchema), controller.createUser);
router.patch("/users/:id", validateBody(adminUserUpdateSchema), controller.updateUser);
router.delete("/users/:id", controller.deleteUser);

router.get("/groups", validateQuery(adminPaginationQuerySchema), controller.listGroups);
router.post("/groups", validateBody(adminGroupCreateSchema), controller.createGroup);
router.patch("/groups/:id", validateBody(adminGroupUpdateSchema), controller.updateGroup);
router.delete("/groups/:id", controller.deleteGroup);

router.get("/expenses", validateQuery(adminExpenseListQuerySchema), controller.listExpenses);
router.post("/expenses", validateBody(adminExpenseCreateSchema), controller.createExpense);
router.patch("/expenses/:id", validateBody(adminExpenseUpdateSchema), controller.updateExpense);
router.delete("/expenses/:id", controller.deleteExpense);

router.get("/expenses/by-user", validateQuery(adminExpenseByUserQuerySchema), controller.expensesByUser);

export default router;
