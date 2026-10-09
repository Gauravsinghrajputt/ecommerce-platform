import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import productRoutes from "./product.routes";
import cartRoutes from "./cart.routes";
import orderRoutes from "./order.routes";

// Webhooks are mounted separately in index.ts (they need the raw body, before express.json()).
const router = Router();
router.use("/health", healthRoutes);
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/products", productRoutes);
router.use("/api/v1/cart", cartRoutes);
router.use("/api/v1/orders", orderRoutes);
export default router;
