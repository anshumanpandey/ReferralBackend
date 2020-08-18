import express from 'express';
var jwt = require('express-jwt');
var guard = require('express-jwt-permissions')({
  permissionsProperty: 'role'
})
import asyncHandler from "express-async-handler"
import { checkSchema } from "express-validator"
import { validateParams } from '../middlewares/routeValidation.middleware';
import { ReferralProgramModel } from '../models/referralProgram.model';
import { ApiError } from '../utils/ApiError';
import { SocialShareModel } from '../models/socialShare.model';
import { USER_ROLE_ENUM } from '../models/user.model';

export const referralProgramRoutes = express();

referralProgramRoutes.get('/', guard.check(USER_ROLE_ENUM.SUPER_ADMIN),jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  //@ts-expect-error
  res.send(await ReferralProgramModel.findAll({ where: { UserId: req.user.id },include: [{ model: SocialShareModel }]}));
}));

referralProgramRoutes.post('/', guard.check(USER_ROLE_ENUM.SUPER_ADMIN),jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), validateParams(checkSchema({
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
  if (req.body.isActive === true) {
   const hasActive = await ReferralProgramModel.findOne({ where: { isActive: true }})
   if (hasActive) throw new ApiError("There is a Referral Program currently active. Deactivate it before activate another one")
  }
  if (req.body.id) {
    const o = await ReferralProgramModel.update(req.body, { where: { id: req.body.id }})
    res.send({ id: req.body.id });
  } else {
    //@ts-expect-error
    const o = await ReferralProgramModel.create({ ...req.body, UserId: req.user.id})
    res.send({ id: o.id });
  }
}));
