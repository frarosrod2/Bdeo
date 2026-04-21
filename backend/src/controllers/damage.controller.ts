import { NextFunction, Request, Response } from "express";
import { DamageService } from "../services/damage.service";

export class DamageController {
  constructor(private readonly damageService: DamageService) {}

  getByClaimId = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const damages = await this.damageService.findByClaimId(
        req.params.claimId,
      );
      res.json(damages);
    } catch (err) {
      next(err);
    }
  };

  getById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const damage = await this.damageService.findById(
        req.params.claimId,
        req.params.damageId,
      );
      res.json(damage);
    } catch (err) {
      next(err);
    }
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const damage = await this.damageService.create(
        req.params.claimId,
        req.body,
      );
      res.status(201).json(damage);
    } catch (err) {
      next(err);
    }
  };

  update = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const damage = await this.damageService.update(
        req.params.claimId,
        req.params.damageId,
        req.body,
      );
      res.json(damage);
    } catch (err) {
      next(err);
    }
  };

  remove = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.damageService.delete(req.params.claimId, req.params.damageId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
