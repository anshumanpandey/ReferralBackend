import express from 'express';
var jwt = require('express-jwt');
import asyncHandler from "express-async-handler"
import { checkSchema } from "express-validator"
import { validateParams } from '../middlewares/routeValidation.middleware';
import { ReferralProgramModel, PROMOTION_ENUM, REWARD_TYPE_ENUM } from '../models/referralProgram.model';
import { ApiError } from '../utils/ApiError';
import { GiftModel } from '../models/gift.model';
import sequelize from '../utils/DB';
import multer from 'multer';
import { UserModel, USER_ROLE_ENUM } from '../models/user.model';
import { Op, or } from 'sequelize';
import PluginKeyExist from '../utils/PluginKeyExist';
import { CustomerModel } from '../models/customer.model';
import { RewardModel } from '../models/reward.model';
import { OrderModel } from '../models/order.model';

let storage = multer.diskStorage({
  destination: 'shareImage/',
  filename: function (req, file, cb) {
    cb(null, `${new Date().valueOf().toString()}.${file.originalname.split(".").pop()}`)
  }
});
const fieldSize = 50 * 1024 * 1024
var upload = multer({ storage, limits: { fieldSize } })

export const referralProgramRoutes = express();

referralProgramRoutes.get('/program/', asyncHandler(async (req, res) => {
  if ((await PluginKeyExist(req.query)) == false) throw new ApiError("Plugin key not found")
  //@ts-expect-error
  const program = await ReferralProgramModel.findAll({ where: { "$User.pluginKey$": req.query.pluginKey, isActive: true }, include: [{ model: GiftModel }, { model: UserModel, attributes: [] }] })
  if (program.length == 0) throw new ApiError("Program not found")
  res.send(program[0]);
}));

referralProgramRoutes.get('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  //@ts-expect-error
  if (req.user.role == USER_ROLE_ENUM.SUPER_ADMIN) {
    res.send(await ReferralProgramModel.findAll({ include: [{ model: GiftModel }] }));
  } else {
    //@ts-expect-error
    res.send(await ReferralProgramModel.findAll({ where: { UserId: req.user.id }, include: [{ model: GiftModel }] }));
  }
}));

referralProgramRoutes.get('/resume', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  const customerWhereFilter = {}
  let timeFilters = {}

  if (req.query.for) {
    //@ts-expect-error
    customerWhereFilter.ReferralProgramId = req.query.for
  }
  if (req.query.from && req.query.to) {
    timeFilters = {
      createdAt: {
        [Op.between]: [new Date(parseInt(req.query.from.toString()) * 1000), new Date(parseInt(req.query.to.toString()) * 1000)],
      },
    }
  }
  const [customers, rewards, sponsors, orders] = await Promise.all([
    CustomerModel.findAll({ where: { ...customerWhereFilter, ...timeFilters }, include: [{ model: OrderModel, include: [{ model: RewardModel }] }] }),
    RewardModel.findAll({ where: { ...customerWhereFilter, ...timeFilters } }),
    CustomerModel.findAll(),
    OrderModel.findAll({ where: { ...customerWhereFilter, ...timeFilters } }),
  ])
  //@ts-expect-error
  const newCustomers = customers.filter(c => !c.ReferredBy)
  //@ts-expect-error
  const oldCustomers = customers.filter(c => c.ReferredBy)

  const response = {
    customersAmount: customers.length,
    sponsors: oldCustomers.length,
    averageCartNewCustomer: newCustomers.reduce((total, customer) => {
      //@ts-expect-error
      total = total + customer.Orders.reduce((total, order) => {
        total = total + order.orderAmount
        return total
      }, 0)
      return total
    }, 0) / newCustomers.length,
    totalRevenueNewCustomerReferred: newCustomers.reduce((total, customer) => {
      //@ts-expect-error
      total = total + customer.Orders.reduce((total, order) => {
        total = total + order.orderAmount
        return total
      }, 0)
      return total
    }, 0),
    totalRevenueFromExistingCustomerUsingStoredCredit: oldCustomers.reduce((total, customer) => {
      //@ts-expect-error
      total = total + customer.Orders.filter(o => o.Reward && o.Reward.rewardType == REWARD_TYPE_ENUM.STORED_CREDIT).reduce((total, order) => {
        total = total + order.orderAmount
        return total
      }, 0)
      return total
    }, 0),
    credits: rewards.reduce((total, reward) => {
      total = (reward.storeCredit || 0) + total
      return total
    }, 0),
    totalRevenue: orders.reduce((total, order) => {
      total = order.orderAmount + total
      return total
    }, 0),
    totalUsedCredits: rewards.filter(r => r?.claimed == true).reduce((total, reward) => {
      total = (reward.storeCredit || 0) + total
      return total
    }, 0) || 0,
    totalUnusedCredits: rewards.filter(r => r?.claimed == false).reduce((total, reward) => {
      total = (reward.storeCredit || 0) + total
      return total
    }, 0) || 0,
    //@ts-expect-error
    leaderboard: customers.sort((a,b) => b.Orders.length - a.Orders.length).slice(0, 3),
  }

  res.send(response);

}));

referralProgramRoutes.post('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), upload.single("shareImage"), validateParams(checkSchema({
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
    const hasActive = await ReferralProgramModel.findOne({ where: { isActive: true } })
    if (hasActive) throw new ApiError("There is a Referral Program currently active. Deactivate it before activate another one")
  }
  const promotions = []
  if (req.body.personalLinkPromotion) promotions.push(PROMOTION_ENUM.PERSONAL_LINK)
  if (req.body.couponPromotion) promotions.push(PROMOTION_ENUM.COUPON_CODE)
  if (req.body.socialMediaImage) promotions.push(PROMOTION_ENUM.SOCIAL_MEDIA_IMAGE)
  if (req.body.emailPromotion) promotions.push(PROMOTION_ENUM.EMAIL)

  const program: any = {
    id: req.body.id,
    name: req.body.name,
    description: req.body.description,
    isActive: req.body.isActive,
    endDate: req.body.endDate,
    emailTemplate: req.body.emailTemplate || null,
    emailFrom: req.body.emailFrom || null,
    emailSubject: req.body.emailSubject || null,
    creditToAward: req.body.creditToAward,

    destinationLink: req.body.destinationLink,

    customerMaxStoreCredit: req.body.maxCreditPerCustomer,
    customerFreeProduct: req.body.customerFreeProduct,
    customerRewardType: req.body.rewardType,
    creditExpiryDate: req.body.creditExpiryDate,

    friendRewardType: req.body.rewardFriendType,
    friendDiscountAmount: req.body.discountAmount,
    friendDiscountUnit: req.body.discountUnit,
    friendFreeProduct: req.body.friendFreeProduct,

    freeDeliver: req.body.freeDeliver,

    promotionMethods: promotions.length != 0 ? promotions : undefined,

    gifts: req.body.gifts,

    //@ts-expect-error
    UserId: req.user.id
  }

  //@ts-expect-error
  if (req.user.role == "Super_admin" && req.body.linkTo) {
    program.UserId = req.body.linkTo
  }

  if (req.body.socialMediaImage == "true") {
    program.imgUrl = req.file ? `${req.protocol + '://' + req.get('host')}/shareImage/${req.file.filename}` : undefined
  } else {
    program.imgUrl = null
  }

  const gift: any[] = []
  if (program.customerRewardType == REWARD_TYPE_ENUM.GIFT) {
    gift.push(...program.gifts.filter((g: any) => g.name && g.referralId))
  }


  if (program.customerRewardType != REWARD_TYPE_ENUM.STORED_CREDIT) {
    program.creditToAward = ""
    program.creditExpiryDate = null
    program.customerMaxStoreCredit = null
  }

  if (program.customerRewardType != REWARD_TYPE_ENUM.FREE_PRODUCT) {
    program.customerFreeProduct = ""
  }

  if (program.friendRewardType != REWARD_TYPE_ENUM.DISCOUNT) {
    program.friendDiscountAmount = ""
    program.friendDiscountUnit = ""
  }

  if (program.friendRewardType != REWARD_TYPE_ENUM.FREE_PRODUCT) {
    program.friendFreeProduct = ""
  }

  await sequelize.transaction(async (transaction) => {
    let programId: any = null
    if (program.id) {
      const fieldsToUpdate = Object.keys(program).filter(k => program[k] !== undefined)
      //@ts-expect-error
      await ReferralProgramModel.update(program, { fields: fieldsToUpdate, where: { id: program.id }, transaction })

      programId = program.id
    } else {
      const o = await ReferralProgramModel.create(program, { transaction })
      programId = o.id
    }

    //@ts-expect-error
    await GiftModel.destroy({ where: { ReferralProgramId: programId }, transaction })
    if (gift.length != 0) {
      await GiftModel.bulkCreate(gift.map((g: any) => ({ ...g, ReferralProgramId: programId })), { transaction })
    }

    res.send({ id: programId });
  });

}));
