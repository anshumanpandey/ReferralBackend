import express from 'express';
var jwt = require('express-jwt');
import asyncHandler from "express-async-handler"
import { checkSchema } from "express-validator"
import { validateParams } from '../middlewares/routeValidation.middleware';
import { OrderPromotionKeys, OrderModel } from '../models/order.model';
import { ProductModel } from '../models/product.model';
import { UserModel } from '../models/user.model';
import { ApiError } from '../utils/ApiError';

export const productRoutes = express();

productRoutes.get('/:pluginKey', asyncHandler(async (req, res) => {
  //@ts-expect-error
  res.send(await ProductModel.findAll({ where: { "$User.pluginKey$": req.params.pluginKey }, include: [{model: UserModel, attributes: []}]}));
}));

productRoutes.post('/', validateParams(checkSchema({
  name: {
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
  pluginKey: {
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
})), asyncHandler(async (req, res) => {
  const user = await UserModel.findOne({ where: { pluginKey: req.body.pluginKey }})
  if (!user) throw new ApiError('Invalid plugin key')
  const o = await ProductModel.create({ ...req.body, UserId: user.id })
  res.send({ id: o.id });
}));
