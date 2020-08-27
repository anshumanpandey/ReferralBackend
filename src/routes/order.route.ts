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

export const orderRoutes = express();

orderRoutes.get('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  res.send(await OrderModel.findAll({ }));
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
    const clamingCustomer = await CustomerModel.findOne({ where: { id: req.body.customerId }, transaction })
    if (!clamingCustomer) throw new ApiError("Customer not found")

    if (req.body.rewardCode) {
      const reward = await RewardModel.findOne({ where: { rewardCode: req.body.rewardCode, claimed: false }, transaction })
      if (reward && reward?.claimed == false) {
        await reward?.update({ claimed: true }, { transaction })

        const o = await OrderModel.create({ ...req.body, promotionMethod: req.body.orderPromotionMethod || ORDER_PROMOTION_ENUM.LINK,CustomerId: clamingCustomer.id }, { transaction })
        res.send({ id: o.id });
      }
    } else {
      const o = await OrderModel.create({ ...req.body, promotionMethod: req.body.orderPromotionMethod || ORDER_PROMOTION_ENUM.LINK ,CustomerId: clamingCustomer.id }, { transaction })

      const referredCustomer = await CustomerModel.findOne({ where: { referral_code: req.body.referredCustomerCode }, transaction })
      if (referredCustomer) {
        //@ts-expect-error
        const reward = await RewardModel.findOne({ where: { CustomerId: referredCustomer.id }, transaction })
        if (!reward) {
          await RewardModel.create({
            CustomerId: referredCustomer.id,
            rewardType: req.body.rewardPromotionMethod || REWARD_TYPE_ENUM.STORED_CREDIT,
            claimed: false,
            rewardCode: MakeId(),
            ...req.body,
          }, { transaction })
        }
      }

      res.send({ id: o.id });
    }
  })

}));
