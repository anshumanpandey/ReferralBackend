import express from 'express';
var jwt = require('express-jwt');
import asyncHandler from "express-async-handler"
import { checkSchema } from "express-validator"
import { validateParams } from '../middlewares/routeValidation.middleware';
import { OrderPromotionKeys, OrderModel } from '../models/order.model';
import { ProductModel } from '../models/product.model';
import { UserModel, USER_ROLE_ENUM } from '../models/user.model';
import { ApiError } from '../utils/ApiError';

export const productRoutes = express();

productRoutes.get('/back', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  //@ts-expect-error
  if (req.user.role == USER_ROLE_ENUM.SUPER_ADMIN) {
    res.send(await ProductModel.findAll());
  } else {
    //@ts-expect-error
    res.send(await ProductModel.findAll({ where: { UserId: req.user.id}}));
  }
}));

productRoutes.get('/:pluginKey', asyncHandler(async (req, res) => {
  //@ts-expect-error
  res.send(await ProductModel.findAll({ where: { "$User.pluginKey$": req.params.pluginKey }, include: [{model: UserModel, attributes: []}]}));
}));

productRoutes.post('/', validateParams(checkSchema({
  "products.*.id": {
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
  "products.*.name": {
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
  products: {
    isArray: true,
    in: ['body'],
    exists: {
      errorMessage: 'Missing field'
    },
    isEmpty: {
      errorMessage: 'Missing field',
      negated: true
    },
  },
})), asyncHandler(async (req, res) => {
  const user = await UserModel.findOne({ where: { pluginKey: req.query.pluginKey }})
  if (!user) throw new ApiError('Invalid plugin key')

  const products = await ProductModel.findAll({ where: { id: req.body.products.map((p: any) => p.id) }})
  if (products.length != 0) throw new ApiError("Product ID already exist")

  const o = await ProductModel.bulkCreate(req.body.products.map((p: any) => ({ name: p.name, id: p.id, UserId: user.id })))
  res.send(o.map(p => p.id));
}));
