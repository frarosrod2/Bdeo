import { NextFunction, Request, Response } from "express";
import { ClaimStatus } from "../models/claim.model";
import { ClaimService } from "../services/claim.service";

export class ClaimController {
  constructor(private readonly claimService: ClaimService) {}

  getAll = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const claims = await this.claimService.findAll();
      res.json(claims);
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
      const claim = await this.claimService.findById(req.params.claimId);
      res.json(claim);
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
      const claim = await this.claimService.create(req.body);
      res.status(201).json(claim);
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
      const claim = await this.claimService.update(
        req.params.claimId,
        req.body,
      );
      res.json(claim);
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const claim = await this.claimService.updateStatus(
        req.params.claimId,
        req.body.status as ClaimStatus,
      );
      res.json(claim);
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
      await this.claimService.delete(req.params.claimId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
