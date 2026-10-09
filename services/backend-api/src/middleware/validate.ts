import { RequestHandler } from "express";
import { ZodTypeAny } from "zod";

// Parsed (and coerced/defaulted) values replace the raw ones, so controllers get clean data.
export const validate =
  (schemas: { body?: ZodTypeAny; params?: ZodTypeAny; query?: ZodTypeAny }): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      next();
    } catch (err) {
      next(err);
    }
  };
