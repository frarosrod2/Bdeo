export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly error: string,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string) {
    super(400, "BadRequest", message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, "NotFound", message);
  }
}

export class UnprocessableEntityError extends HttpError {
  constructor(message: string) {
    super(422, "UnprocessableEntity", message);
  }
}
