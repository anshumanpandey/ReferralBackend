import express from 'express';
var jwt = require('express-jwt');
import asyncHandler from "express-async-handler"
import { checkSchema } from "express-validator"
import { validateParams } from '../middlewares/routeValidation.middleware';
import { OrderPromotionKeys, OrderModel, ORDER_PROMOTION_ENUM } from '../models/order.model';
import { ApiError } from '../utils/ApiError';
import { RewardModel, RewardTypeValues, REWARD_TYPE_ENUM } from '../models/reward.model';
import PluginKeyExist from '../utils/PluginKeyExist';
import { CustomerModel } from '../models/customer.model';
import MakeId from '../utils/MakeId';
import sequelize from '../utils/DB';
import { UserModel } from '../models/user.model';
import { ReferralProgramModel } from '../models/referralProgram.model';
import { ProductModel } from '../models/product.model';

export const orderRoutes = express();

orderRoutes.get('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  res.send(await OrderModel.findAll({}));
}));

orderRoutes.post('/', validateParams(checkSchema({
  customerId: {
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
  referredCustomerCode: {
    in: ['body'],
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
  },
  orderPromotionMethod: {
    in: ['body'],
  },
  rewardPromotionMethod: {
    in: ['body'],
  },
})), asyncHandler(async (req, res) => {
  if ((await PluginKeyExist(req.query)) == false) throw new ApiError("Plugin key not found")

  await sequelize.transaction(async (transaction) => {
    const user = await UserModel.findOne({ where: { pluginKey: req.query.pluginKey }, include: [{ model: ReferralProgramModel, where: { isActive: true } }] })

    //@ts-expect-error
    const program = user?.ReferralPrograms[0]

    if (!user || !program) throw new ApiError("User has not active referral programs")

    const clamingCustomer = await CustomerModel.findOne({ where: { id: req.body.customerId }, transaction })
    if (!clamingCustomer) throw new ApiError("Customer not found")

    let sponsorId = undefined
    if (req.body.rewardCode) {
      const reward = await RewardModel.findOne({ where: { rewardCode: req.body.rewardCode }, transaction })
      if (reward && reward?.claimed == false) {
        await reward?.update({ claimed: true }, { transaction })
        //@ts-expect-error
        sponsorId = reward.CustomerId
      }
    }

    if (req.body.referredCustomerCode) {
      const referredCustomer = await CustomerModel.findOne({ where: { referral_code: req.body.referredCustomerCode }, transaction })
      if (!referredCustomer) throw new ApiError("Referred customer not found")

      await clamingCustomer.update({ ReferredBy: referredCustomer.id}, { transaction })
      await referredCustomer.update({ isSponsor: true }, { transaction })
      
      sponsorId = referredCustomer.id
      //@ts-expect-error
      const reward = await RewardModel.findOne({ where: { CustomerId: referredCustomer.id, ReferralProgramId: program.id, }, transaction })
      if (!reward) {
        const customerReward = {
          CustomerId: referredCustomer.id,
          rewardType: program.customerRewardType,
          claimed: false,
          ReferralProgramId: program.id,
          ...req.body,
          rewardCode: MakeId(),
          freeDeliver: program.freeDeliver,
        }
        if (program.customerRewardType == REWARD_TYPE_ENUM.STORED_CREDIT) {
          customerReward.storeCredit = program.creditToAward || 0
        }
        const reward = await RewardModel.create(customerReward, { transaction })

        if (program.customerRewardType == REWARD_TYPE_ENUM.FREE_PRODUCT) {
          const product = await program.getFreeProductForCustomer({ transaction })
          //@ts-expect-error
          await reward.addFreeProduct(product[0], { transaction })
        }
      }
    }

    const o = await OrderModel.create({ ...req.body, ReferralProgramId: program.id, CustomerId: clamingCustomer.id, SponsorId: sponsorId, promotionMethod: req.body.orderPromotionMethod || ORDER_PROMOTION_ENUM.LINK }, { transaction })

    res.send({ id: o.id });
  })

}));
