import cors from "cors";
import express, { Application } from "express";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware";
import { ClaimRepository } from "./repositories/claim.repository";
import { DamageRepository } from "./repositories/damage.repository";
import { createClaimRouter } from "./routes/claim.routes";
import { createDamageRouter } from "./routes/damage.routes";
import { ClaimService } from "./services/claim.service";
import { DamageService } from "./services/damage.service";

export function createApp(): Application {
  const app = express();

  // ── Middleware ────────────────────────────────────────────────────────────
  app.use(cors());
  app.use(express.json());

  // ── Dependency injection composition root ────────────────────────────────
  const claimRepo = new ClaimRepository();
  const damageRepo = new DamageRepository();

  const claimService = new ClaimService(claimRepo, damageRepo);
  const damageService = new DamageService(claimRepo, damageRepo);

  // ── Routes ────────────────────────────────────────────────────────────────
  const claimRouter = createClaimRouter(claimService);
  const damageRouter = createDamageRouter(damageService);

  app.use("/api/claims", claimRouter);
  // Damage routes are nested under claims; mergeParams is set inside createDamageRouter
  app.use("/api/claims/:claimId/damages", damageRouter);

  // ── Error handler (must be last) ─────────────────────────────────────────
  app.use(errorHandlerMiddleware);

  return app;
}
