import { Router } from "express";
import { ClaimController } from "../controllers/claim.controller";
import { validateMiddleware } from "../middlewares/validate.middleware";
import {
  claimIdSchema,
  createClaimSchema,
  updateClaimSchema,
  updateClaimStatusSchema,
} from "../schemas/claim.schema";
import { ClaimService } from "../services/claim.service";

export function createClaimRouter(claimService: ClaimService): Router {
  const router = Router();
  const ctrl = new ClaimController(claimService);

  // GET /claims
  router.get("/", ctrl.getAll);

  // POST /claims
  router.post("/", validateMiddleware(createClaimSchema), ctrl.create);

  // GET /claims/:claimId
  router.get(
    "/:claimId",
    validateMiddleware(claimIdSchema, "params"),
    ctrl.getById,
  );

  // PATCH /claims/:claimId/status
  router.patch(
    "/:claimId/status",
    validateMiddleware(claimIdSchema, "params"),
    validateMiddleware(updateClaimStatusSchema),
    ctrl.updateStatus,
  );

  // PATCH /claims/:claimId
  router.patch(
    "/:claimId",
    validateMiddleware(claimIdSchema, "params"),
    validateMiddleware(updateClaimSchema),
    ctrl.update,
  );

  // DELETE /claims/:claimId
  router.delete(
    "/:claimId",
    validateMiddleware(claimIdSchema, "params"),
    ctrl.remove,
  );

  return router;
}
