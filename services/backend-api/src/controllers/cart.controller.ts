import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";
import * as cart from "../services/cart.service";
import { getActiveProduct } from "../services/product.service";

export const get = asyncHandler(async (req, res) => {
  res.json({ data: await cart.getCart(req.user!.id) });
});

// Sets the ABSOLUTE quantity for a product (adds the line if it doesn't exist yet).
export const upsertItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const product = await getActiveProduct(productId);
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  if (quantity > product.stock) throw new AppError(409, "INSUFFICIENT_STOCK", `Only ${product.stock} in stock`);
  await cart.setItem(req.user!.id, productId, quantity);
  res.json({ data: await cart.getCart(req.user!.id) });
});

export const removeItem = asyncHandler(async (req, res) => {
  await cart.removeItem(req.user!.id, req.params.productId);
  res.json({ data: await cart.getCart(req.user!.id) });
});
