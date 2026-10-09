import { Router } from "express";
import * as c from "../controllers/order.controller";
import { authenticate, requireRole } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { idParams, mockPaySchema } from "../schemas";

const router = Router();
router.use(authenticate, requireRole(["admin", "customer"]));
router.post("/checkout", c.checkout);
router.get("/", c.list);
router.get("/:id", validate({ params: idParams }), c.getOne);
router.post("/:id/mock-pay", validate({ params: idParams, body: mockPaySchema }), c.mockPay); // 404 unless PAYMENT_MODE=mock
export default router;
