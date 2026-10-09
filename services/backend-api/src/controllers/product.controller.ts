import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/errors";
import * as products from "../services/product.service";

export const list = asyncHandler(async (_req, res) => {
  res.json({ data: await products.listProducts() });
});

export const getOne = asyncHandler(async (req, res) => {
  const product = await products.getProductBySlug(req.params.slug);
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  res.json({ data: product });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await products.createProduct(req.body) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ data: await products.updateProduct(req.params.id, req.body) });
});
