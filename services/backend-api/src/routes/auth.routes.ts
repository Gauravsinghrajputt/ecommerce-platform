import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as c from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { loginSchema, registerSchema } from "../schemas";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many attempts, try again later" } },
});

const router = Router();
router.use(limiter);
router.post("/register", validate({ body: registerSchema }), c.register);
router.post("/login", validate({ body: loginSchema }), c.login);
router.post("/refresh", c.refresh);
router.post("/logout", c.logout);
router.get("/me", authenticate, c.me);
export default router;
