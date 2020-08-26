import express from 'express';
var jwt = require('express-jwt');
import asyncHandler from "express-async-handler"
import { checkSchema } from "express-validator"
import { validateParams } from '../middlewares/routeValidation.middleware';
import { RewardModel, RewardTypeValues, REWARD_TYPE_ENUM } from '../models/reward.model';
import { ApiError } from '../utils/ApiError';
import { GiftModel } from '../models/gift.model';
import sequelize from '../utils/DB';
import { ReferralProgramModel } from '../models/referralProgram.model';
import { CustomerModel } from '../models/customer.model';
import PluginKeyExist from '../utils/PluginKeyExist';

export const rewardRoutes = express();

rewardRoutes.get('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  //@ts-expect-error
  res.send(await RewardModel.findAll({ include: [{ model: GiftModel}, { model: ReferralProgramModel, where: { UserId: req.user.id}}] }));
}));

rewardRoutes.get('/:code', asyncHandler(async (req, res) => {
  if ((await PluginKeyExist(req.query)) == false) throw new ApiError("Plugin key not found")
  //@ts-expect-error
  res.send(await RewardModel.findAll({ where: { "$Customer.referral_code$": req.params.code }, include: [{ model: CustomerModel } ] }));
}));

rewardRoutes.post('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), validateParams(checkSchema({
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
  storeCredit: {
    in: ['body'],
    trim: true
  },
  freeProduct: {
    in: ['body'],
  },
  discountAmount: {
    in: ['body'],
    optional: true,
    isFloat: true,
  },
  discountUnit: {
    in: ['body'],
  },
  freeDeliver: {
    in: ['body'],
    optional: true,
    isBoolean: true,
  },
  rewardType: {
    in: ['body'],
    exists: {
      errorMessage: 'Missing field'
    },
    isEmpty: {
      errorMessage: 'Missing field',
      negated: true
    },
    isIn: {
      options: [RewardTypeValues],
      errorMessage: `Valid options are ${RewardTypeValues.join(", ")}`
    }
  },
  referralProgramId: {
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
  const body: any = {
    sponsor: req.body.sponsor,
    freeDeliver: req.body.freeDeliver,
    rewardType: req.body.rewardType,
    ReferralProgramId: req.body.referralProgramId,
  }
  const gifts: any[] = []
  if (req.body.rewardType == REWARD_TYPE_ENUM.STORED_CREDIT) {
    if (!req.body.storeCredit) throw new ApiError("Missing storeCredit property")
    body.storeCredit = req.body.storeCredit
  } else if (req.body.rewardType == REWARD_TYPE_ENUM.GIFT) {
    if (!req.body.gifts) throw new ApiError("Missing gifts property")
    gifts.push(...req.body.gifts.filter((g: any) => g.name && g.referralId))
  } else if (req.body.rewardType == REWARD_TYPE_ENUM.FREE_PRODUCT) {
    if (!req.body.freeProduct) throw new ApiError("Missing freeProduct property")
    body.freeProduct = req.body.freeProduct
  } else if (req.body.rewardType == REWARD_TYPE_ENUM.DISCOUNT) {
    if (!req.body.discountAmount) throw new ApiError("Missing discountAmount property")
    if (!req.body.discountUnit) throw new ApiError("Missing discountUnit property")
    body.discountAmount = req.body.discountAmount
    body.discountUnit = req.body.discountUnit
  } else {
    throw new ApiError(`Reward Type [${req.body.rewardType}] not supported`)
  }

  await sequelize.transaction(async (transaction) => {
    const program = await ReferralProgramModel.findByPk(req.body.referralProgramId)
    if (!program) throw new ApiError("ReferralProgram not found")
    const o = await RewardModel.create(body, { transaction })
    if (gifts.length != 0) {
      await GiftModel.bulkCreate(gifts.map(g => ({ ...g, RewardId: o.id })), { transaction })
    }
    res.send({ id: o.id });
  });

}));
