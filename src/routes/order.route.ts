import express from 'express';
var jwt = require('express-jwt');
import asyncHandler from "express-async-handler"
import { checkSchema } from "express-validator"
import { validateParams } from '../middlewares/routeValidation.middleware';
import { OrderPromotionKeys, OrderModel } from '../models/order.model';
import { ApiError } from '../utils/ApiError';
import { RewardModel, RewardTypeValues } from '../models/reward.model';
import PluginKeyExist from '../utils/PluginKeyExist';
import { CustomerModel } from '../models/customer.model';
import MakeId from '../utils/MakeId';
import sequelize from '../utils/DB';

export const orderRoutes = express();

orderRoutes.get('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  //@ts-expect-error
  res.send(await OrderModel.findAll({ where: { UserId: req.user.id } }));
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
  referredCustomerId: {
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
    exists: {
      errorMessage: 'Missing field'
    },
    isEmpty: {
      errorMessage: 'Missing field',
      negated: true
    },
    isIn: {
      options: [OrderPromotionKeys],
      errorMessage: `Valid options are ${OrderPromotionKeys.join(", ")}`
    }
  },
  rewardPromotionMethod: {
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
})), asyncHandler(async (req, res) => {
  if ((await PluginKeyExist(req.query)) == false) throw new ApiError("Plugin key not found")

  await sequelize.transaction(async (transaction) => {
    const clamingCustomer = await CustomerModel.findOne({ where: { id: req.body.customerId }, transaction })
    if (!clamingCustomer) throw new ApiError("Customer not found")

    if (req.body.rewardCode) {
      const reward = await RewardModel.findOne({ where: { rewardCode: req.body.rewardCode, claimed: false }, transaction })
      if (reward && reward?.claimed == false) {
        await reward?.update({ claimed: true }, { transaction })

        const o = await OrderModel.create({ ...req.body, CustomerId: clamingCustomer.id }, { transaction })
        res.send({ id: o.id });
      }
    } else {
      const o = await OrderModel.create({ ...req.body, CustomerId: clamingCustomer.id }, { transaction })

      const referredCustomer = await CustomerModel.findOne({ where: { id: req.body.referredCustomerId }, transaction })
      if (referredCustomer) {
        //@ts-expect-error
        const reward = await RewardModel.findOne({ where: { CustomerId: referredCustomer.id }, transaction })
        if (!reward) {
          await RewardModel.create({
            CustomerId: referredCustomer.id,
            rewardType: req.body.rewardPromotionMethod,
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
