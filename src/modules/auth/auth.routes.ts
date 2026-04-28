import { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { loginSchema, refreshSchema, registerSchema, socialLoginSchema } from "./auth.schema";
import { validateBody } from "../../common/middleware/validate.middleware";
import { requireAuth } from "../../common/middleware/auth.middleware";

const router = Router();
const controller = new AuthController(new AuthService());

router.post("/register", validateBody(registerSchema), controller.register);
router.post("/login", validateBody(loginSchema), controller.login);
router.post("/social-login", validateBody(socialLoginSchema), controller.socialLogin);
router.post("/refresh", validateBody(refreshSchema), controller.refresh);
router.post("/logout", requireAuth, controller.logout);

export default router;
