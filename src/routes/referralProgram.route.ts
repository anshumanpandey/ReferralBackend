import express from 'express';
var jwt = require('express-jwt');
import asyncHandler from "express-async-handler"
import { checkSchema } from "express-validator"
import { validateParams } from '../middlewares/routeValidation.middleware';
import { ReferralProgramModel } from '../models/referralProgram.model';
import { ApiError } from '../utils/ApiError';
import { SocialShareModel } from '../models/socialShare.model';
import { USER_ROLE_ENUM } from '../models/user.model';

export const referralProgramRoutes = express();

referralProgramRoutes.get('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  //@ts-expect-error
  res.send(await ReferralProgramModel.findAll({ where: { UserId: req.user.id },include: [{ model: SocialShareModel }]}));
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
  if (req.body.isActive === true) {
   const hasActive = await ReferralProgramModel.findOne({ where: { isActive: true }})
   if (hasActive) throw new ApiError("There is a Referral Program currently active. Deactivate it before activate another one")
  }
  if (req.body.id) {
    await ReferralProgramModel.update(req.body, { where: { id: req.body.id }})
    //@ts-expect-error
    await SocialShareModel.destroy({ where: { ReferralProgramId: req.body.id } })
    await SocialShareModel.bulkCreate(req.body.SocialShares.map((s:any) => ({ ...s, ReferralProgramId: req.body.id })))
    res.send({ id: req.body.id });
  } else {
    //@ts-expect-error
    const o = await ReferralProgramModel.create({ ...req.body, UserId: req.user.id})
    await SocialShareModel.bulkCreate({ ...req.body.SocialShares, ReferralProgramId: o.id })
    res.send({ id: o.id });
  }
}));
