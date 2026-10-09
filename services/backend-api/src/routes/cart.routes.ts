import { Router } from "express";
import * as c from "../controllers/cart.controller";
import { authenticate, requireRole } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { addCartItemSchema, productIdParams } from "../schemas";

const router = Router();
router.use(authenticate, requireRole(["admin", "customer"]));
router.get("/", c.get);
router.post("/items", validate({ body: addCartItemSchema }), c.upsertItem);
router.delete("/items/:productId", validate({ params: productIdParams }), c.removeItem);
export default router;
