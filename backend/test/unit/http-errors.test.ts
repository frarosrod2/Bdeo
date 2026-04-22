import { describe, expect, it } from "vitest";
import {
  BadRequestError,
  HttpError,
  NotFoundError,
  UnprocessableEntityError,
} from "../../src/common/errors/http-errors";

describe("HttpError hierarchy", () => {
  describe("HttpError (base)", () => {
    it("sets statusCode, error and message correctly", () => {
      const err = new HttpError(418, "Teapot", "I am a teapot");

      expect(err.statusCode).toBe(418);
      expect(err.error).toBe("Teapot");
      expect(err.message).toBe("I am a teapot");
    });

    it("is an instance of Error", () => {
      expect(new HttpError(500, "Err", "msg")).toBeInstanceOf(Error);
    });
  });

  describe("BadRequestError", () => {
    it("has statusCode 400 and error BadRequest", () => {
      const err = new BadRequestError("bad input");

      expect(err.statusCode).toBe(400);
      expect(err.error).toBe("BadRequest");
      expect(err.message).toBe("bad input");
    });

    it("is instanceof HttpError", () => {
      expect(new BadRequestError("x")).toBeInstanceOf(HttpError);
    });
  });

  describe("NotFoundError", () => {
    it("has statusCode 404 and error NotFound", () => {
      const err = new NotFoundError("not found");

      expect(err.statusCode).toBe(404);
      expect(err.error).toBe("NotFound");
    });

    it("is instanceof HttpError", () => {
      expect(new NotFoundError("x")).toBeInstanceOf(HttpError);
    });
  });

  describe("UnprocessableEntityError", () => {
    it("has statusCode 422 and error UnprocessableEntity", () => {
      const err = new UnprocessableEntityError("rule violated");

      expect(err.statusCode).toBe(422);
      expect(err.error).toBe("UnprocessableEntity");
    });

    it("is instanceof HttpError", () => {
      expect(new UnprocessableEntityError("x")).toBeInstanceOf(HttpError);
    });
  });
});
