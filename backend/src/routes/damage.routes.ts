import { Router } from "express";
import {
  createDamageSchema,
  damageParamsSchema,
  updateDamageSchema,
} from "../common/utils/schemas";
import { DamageController } from "../controllers/damage.controller";
import { validateMiddleware } from "../middlewares/validate.middleware";
import { claimIdSchema } from "../schemas/claim.schema";
import { DamageService } from "../services/damage.service";

export function createDamageRouter(damageService: DamageService): Router {
  // mergeParams exposes :claimId from the parent router
  const router = Router({ mergeParams: true });
  const ctrl = new DamageController(damageService);

  // GET /claims/:claimId/damages
  router.get(
    "/",
    validateMiddleware(claimIdSchema, "params"),
    ctrl.getByClaimId,
  );

  // POST /claims/:claimId/damages
  router.post(
    "/",
    validateMiddleware(claimIdSchema, "params"),
    validateMiddleware(createDamageSchema),
    ctrl.create,
  );

  // GET /claims/:claimId/damages/:damageId
  router.get(
    "/:damageId",
    validateMiddleware(damageParamsSchema, "params"),
    ctrl.getById,
  );

  // PATCH /claims/:claimId/damages/:damageId
  router.patch(
    "/:damageId",
    validateMiddleware(damageParamsSchema, "params"),
    validateMiddleware(updateDamageSchema),
    ctrl.update,
  );

  // DELETE /claims/:claimId/damages/:damageId
  router.delete(
    "/:damageId",
    validateMiddleware(damageParamsSchema, "params"),
    ctrl.remove,
  );

  return router;
}
