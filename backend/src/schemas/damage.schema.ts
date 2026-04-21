import z from "zod";
import { objectIdSchema } from "./common.schema";

export const createDamageSchema = z.object({
  part: z.string().min(1, "Part is required").max(100),
  severity: z.enum(["low", "mid", "high"], {
    required_error: "Severity is required",
  }),
  imageUrl: z.string().url("imageUrl must be a valid URL"),
  price: z
    .number({ required_error: "Price is required" })
    .min(0, "Price must be non-negative"),
});

export const updateDamageSchema = z
  .object({
    part: z.string().min(1).max(100).optional(),
    severity: z.enum(["low", "mid", "high"]).optional(),
    imageUrl: z.string().url().optional(),
    price: z.number().min(0).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided.",
  });

export const damageParamsSchema = z.object({
  claimId: objectIdSchema,
  damageId: objectIdSchema,
});
