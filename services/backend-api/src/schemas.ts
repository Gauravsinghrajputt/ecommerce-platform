import { z } from "zod";

const email = z.string().trim().toLowerCase().email();
const uuid = z.string().uuid();

export const registerSchema = z.object({
  email,
  password: z.string().min(8).max(72), // bcrypt ignores bytes after 72
  fullName: z.string().trim().min(1).max(100),
  role: z.enum(["customer", "admin"]).default("customer"),
  adminCode: z.string().optional(),
});
export const loginSchema = z.object({ email, password: z.string().min(1) });

const CATEGORIES = ["apparel", "bags", "home-desk", "drinkware"] as const;
const productFields = {
  category: z.enum(CATEGORIES),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase letters, digits and hyphens only").max(80),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(5000).default(""),
  price_cents: z.number().int().min(0),
  stock: z.number().int().min(0),
  image_url: z.string().url().nullable().optional(),
  is_active: z.boolean().optional(),
};
export const createProductSchema = z.object({ ...productFields, category: z.enum(CATEGORIES).default("home-desk"), currency: z.string().length(3).default("INR") });
export const updateProductSchema = z
  .object(productFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required");

export const idParams = z.object({ id: uuid });
export const productIdParams = z.object({ productId: uuid });
export const addCartItemSchema = z.object({ productId: uuid, quantity: z.number().int().min(1).max(99) });
export const mockPaySchema = z.object({ outcome: z.enum(["captured", "failed"]).default("captured") });
