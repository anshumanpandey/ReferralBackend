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

      const friendRewardData: any = {
        CustomerId: clamingCustomer.id,
        rewardType: req.body.rewardPromotionMethod || REWARD_TYPE_ENUM.STORED_CREDIT,
        claimed: false,
        ReferralProgramId: program.id,
        rewardCode: MakeId(),
      }
      if (program.friendRewardType == REWARD_TYPE_ENUM.DISCOUNT) {
        friendRewardData.discountAmount = program.friendDiscountAmount
        friendRewardData.discountUnit = program.friendDiscountUnit
      }
  
      /*const friendReward = await RewardModel.create(friendRewardData, { transaction })
      if (program.friendRewardType == REWARD_TYPE_ENUM.FREE_PRODUCT) {
        const product = await ProductModel.findOne({ where: { id: }})
        friendReward.addFreeProduct(re)
      }*/

      sponsorId = referredCustomer.id
      //@ts-expect-error
      const reward = await RewardModel.findOne({ where: { CustomerId: referredCustomer.id }, transaction })
      if (!reward) {
        await RewardModel.create({
          CustomerId: referredCustomer.id,
          rewardType: req.body.rewardPromotionMethod || REWARD_TYPE_ENUM.STORED_CREDIT,
          claimed: false,
          storeCredit: program.creditToAward || 0,
          ReferralProgramId: program.id,
          ...req.body,
          rewardCode: MakeId(),
        }, { transaction })
      }
    }

    const o = await OrderModel.create({ ...req.body, ReferralProgramId: program.id, CustomerId: clamingCustomer.id, SponsorId: sponsorId, promotionMethod: req.body.orderPromotionMethod || ORDER_PROMOTION_ENUM.LINK }, { transaction })

    res.send({ id: o.id });
  })

}));
