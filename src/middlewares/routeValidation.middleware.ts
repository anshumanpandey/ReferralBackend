import express from 'express';
import { validationResult,ValidationChain } from "express-validator";
import { ApiError } from '../utils/ApiError';

export const validateParams = (schema: ValidationChain[]) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {

      await Promise.all(schema.map(validation => validation.run(req)));
  
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      next(new ApiError(`${errors.array()[0].msg}: ${errors.array()[0].param}`, 422))  
    };
  };