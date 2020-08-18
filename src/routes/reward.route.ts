import express from 'express';
var jwt = require('express-jwt');
import asyncHandler from "express-async-handler"
import { checkSchema } from "express-validator"
import { validateParams } from '../middlewares/routeValidation.middleware';
import { OrderPromotionKeys, OrderModel } from '../models/order.model';
import { RewardModel } from '../models/reward.model';

export const rewardRoutes = express();

rewardRoutes.get('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  res.send(await RewardModel.findAll());
}));

rewardRoutes.post('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), validateParams(checkSchema({
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
      options: OrderPromotionKeys
    }
  },
})), asyncHandler(async (req, res) => {
  const o = await OrderModel.create(req.body)
  res.send({ id: o.id });
}));
