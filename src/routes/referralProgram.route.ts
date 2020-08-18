import express from 'express';
var jwt = require('express-jwt');
import asyncHandler from "express-async-handler"
import { checkSchema } from "express-validator"
import { validateParams } from '../middlewares/routeValidation.middleware';
import { OrderPromotionKeys, OrderModel } from '../models/order.model';
import { ReferralProgramModel } from '../models/referralProgram.model';

export const referralProgramRoutes = express();

referralProgramRoutes.get('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  res.send(await ReferralProgramModel.findAll());
}));

referralProgramRoutes.post('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), validateParams(checkSchema({
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
})), asyncHandler(async (req, res) => {
  if (req.body.id) {
    const o = await ReferralProgramModel.update(req.body, { where: { id: req.body.id }})
    res.send({ id: req.body.id });
  } else {
    const o = await ReferralProgramModel.create(req.body)
    res.send({ id: o.id });
  }
}));
