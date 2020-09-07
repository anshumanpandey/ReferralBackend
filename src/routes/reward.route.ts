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
import MakeId from '../utils/MakeId';
import { UserModel } from '../models/user.model';
import { ProductModel } from '../models/product.model';

export const rewardRoutes = express();

rewardRoutes.get('/admin/rewards', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  res.send(await RewardModel.findAll({ include: [{ model: CustomerModel }] }));
}));

rewardRoutes.get('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  //@ts-expect-error
  res.send(await RewardModel.findAll({ include: [{ model: ReferralProgramModel, where: { UserId: req.user.id } }] }));
}));

rewardRoutes.post('/single', asyncHandler(async (req, res) => {
  if ((await PluginKeyExist(req.query)) == false) throw new ApiError("Plugin key not found")

  const customer = await CustomerModel.findOne({ where: { id: req.body.customerId } })
  const referredCustomer = await CustomerModel.findOne({ where: { id: req.body.referredCustomerId } })

  if (!customer) throw new ApiError("Customer not found")

  //@ts-expect-error
  const program = await ReferralProgramModel.findOne({ where: { "$User.pluginKey$": req.query.pluginKey, isActive: true }, include: [{ model: UserModel, attributes: [] }] })
  if (!program) throw new ApiError("No active program found for this plugin key")

  await sequelize.transaction(async (transaction) => {

    const reward = {
      CustomerId: req.body.customerId,
      claimed: false,
      ReferralProgramId: program.id,
      ...req.body,
      freeDeliver: program.freeDeliver,
      rewardCode: MakeId(),
    }

    if (program.friendRewardType == REWARD_TYPE_ENUM.DISCOUNT) {
      reward.discountAmount = program.friendDiscountAmount;
      reward.discountUnit = program.friendDiscountUnit;
      reward.rewardType = REWARD_TYPE_ENUM.DISCOUNT;
    } else {
      reward.rewardType = REWARD_TYPE_ENUM.FREE_PRODUCT;
    }

    const r = await RewardModel.create(reward, { transaction })

    if (program.friendRewardType == REWARD_TYPE_ENUM.FREE_PRODUCT) {
      //@ts-expect-error
      const product = await program.getFreeProductForFriend({ transaction })
      //@ts-expect-error
      await r.setFreeProduct(product[0], { transaction })
    }
  
    res.send({ id: r.id });
  })

}));

rewardRoutes.get('/:code', asyncHandler(async (req, res) => {
  if ((await PluginKeyExist(req.query)) == false) throw new ApiError("Plugin key not found")
  const filters = { "$Customer.referral_code$": req.params.code, claimed: false }
  if (req.query.referredByCode) {
    //@ts-expect-error
    const referredCustomer = await CustomerModel.findOne({ referral_code: req.query.referredByCode.toString()})
    if (!referredCustomer) throw new ApiError("Referred Customer not found")
    //@ts-expect-error
    await CustomerModel.update({ ReferredBy: referredCustomer.id }, { where: { referral_code: req.params.code }});
  }
  res.send(await RewardModel.findAll({ where: filters, include: [{ model: CustomerModel }] }));
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
    const program = await ReferralProgramModel.findByPk(req.body.referralProgramId, { transaction })
    if (!program) throw new ApiError("ReferralProgram not found")
    const o = await RewardModel.create({ ...body, rewardCode: MakeId() }, { transaction })
    if (gifts.length != 0) {
      await GiftModel.bulkCreate(gifts.map(g => ({ ...g, RewardId: o.id })), { transaction })
    }
    res.send({ id: o.id });
  });

}));
