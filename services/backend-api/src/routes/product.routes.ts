import { Router } from "express";
import * as c from "../controllers/product.controller";
import { authenticate, requireRole } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { createProductSchema, idParams, updateProductSchema } from "../schemas";

const router = Router();
router.get("/", c.list);
router.get("/:slug", c.getOne);
router.post("/", authenticate, requireRole(["admin"]), validate({ body: createProductSchema }), c.create);
router.put("/:id", authenticate, requireRole(["admin"]), validate({ params: idParams, body: updateProductSchema }), c.update);
export default router;
