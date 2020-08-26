import express from 'express';
var jwt = require('express-jwt');
import asyncHandler from "express-async-handler"
import { checkSchema } from "express-validator"
import { validateParams } from '../middlewares/routeValidation.middleware';
import { OrderPromotionKeys, OrderModel } from '../models/order.model';
import { UserModel } from '../models/user.model';
import { ApiError } from '../utils/ApiError';

export const orderRoutes = express();

orderRoutes.get('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  //@ts-expect-error
  res.send(await OrderModel.findAll({ where: { UserId: req.user.id } }));
}));

orderRoutes.post('/', validateParams(checkSchema({
  customer: {
    in: ['body'],
    exists: {
      errorMessage: 'Missing field'
    },
    isEmpty: {
      errorMessage: 'Missing field',
      negated: true
    },
    trim: true
  },
  sponsor: {
    in: ['body'],
    exists: {
      errorMessage: 'Missing field'
    },
    isEmpty: {
      errorMessage: 'Missing field',
      negated: true
    },
    trim: true
  },
  orderAmount: {
    in: ['body'],
    exists: {
      errorMessage: 'Missing field'
    },
    isEmpty: {
      errorMessage: 'Missing field',
      negated: true
    },
    isFloat: true,
  },
  pluginKey: {
    in: ['body'],
    exists: {
      errorMessage: 'Missing field'
    },
    isEmpty: {
      errorMessage: 'Missing field',
      negated: true
    },
    isFloat: true,
  },
  promotionMethod: {
    in: ['body'],
    exists: {
      errorMessage: 'Missing field'
    },
    isEmpty: {
      errorMessage: 'Missing field',
      negated: true
    },
    isIn: {
      options: [OrderPromotionKeys],
      errorMessage: `Valid options are ${OrderPromotionKeys.join(", ")}`
    }
  },
})), asyncHandler(async (req, res) => {
  const user = await UserModel.findOne({ where: { pluginKey: req.body.pluginKey } })
  if (!user) throw new ApiError('Invalid plugin key')

  const o = await OrderModel.create({ ...req.body, UserId: user.id })
  res.send({ id: o.id });
}));
