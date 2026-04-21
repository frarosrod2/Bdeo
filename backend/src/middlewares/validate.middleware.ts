import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export const validateMiddleware =
  (schema: ZodSchema, target: "body" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      res.status(400).json({
        statusCode: 400,
        error: "BadRequest",
        message: result.error.errors.map((e) => e.message).join(", "),
      });
      return;
    }
    req[target] = result.data;
    next();
  };
