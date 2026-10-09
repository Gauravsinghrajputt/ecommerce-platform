import { z } from "zod";
import { INDIAN_STATES } from "./indian-states";

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number"),
  line1: z.string().trim().min(5, "Enter your street address"),
  line2: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().min(2, "Enter your city"),
  state: z.enum(INDIAN_STATES, { errorMap: () => ({ message: "Select your state" }) }),
  pin: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit PIN code"),
});
export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;
