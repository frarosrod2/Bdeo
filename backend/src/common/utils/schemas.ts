import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

// ── Claim schemas ────────────────────────────────────────────────────────────

export const createClaimSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
});

export const updateClaimSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(2000).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field must be provided.",
  });

export const updateClaimStatusSchema = z.object({
  status: z.enum(["Pending", "InReview", "Finished"]),
});

export const claimIdSchema = z.object({ claimId: objectId });

// ── Damage schemas ───────────────────────────────────────────────────────────

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
  claimId: objectId,
  damageId: objectId,
});
