import { Router } from "express";
import * as c from "../controllers/webhook.controller";

const router = Router();
router.post("/razorpay", c.razorpay);
// Stripe: add router.post("/stripe", ...) that verifies the Stripe-Signature header and calls the same ingestEvent("stripe", event.id, event).
export default router;
