import { z } from "zod";
import { objectIdSchema } from "./common.schema";

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

export const claimIdSchema = z.object({ claimId: objectIdSchema });
