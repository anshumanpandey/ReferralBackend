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
import { Op } from 'sequelize';

let storage = multer.diskStorage({
  destination: 'shareImage/',
  filename: function (req, file, cb) {
    cb(null, `${new Date().valueOf().toString()}.${file.originalname.split(".").pop()}`)
  }
});
const fieldSize = 50 * 1024 * 1024
var upload = multer({ storage, limits: { fieldSize } })

export const referralProgramRoutes = express();

referralProgramRoutes.get('/program/:key', asyncHandler(async (req, res) => {
  //@ts-expect-error
  const program = await ReferralProgramModel.findOne({ where: { "$User.pluginKey$": req.params.key, isActive: true }, include: [{ model: GiftModel }, { model: UserModel, attributes: [] }] })
  if (program) throw new ApiError("Program not found")
  res.send(program);
}));

referralProgramRoutes.get('/', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  //@ts-expect-error
  res.send(await ReferralProgramModel.findAll({ where: { UserId: req.user.id }, include: [{ model: GiftModel }] }));
}));

referralProgramRoutes.get('/resume', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  const [ user, programs ] = await Promise.all([
    UserModel.findAll({ where: { role: {[Op.not]: USER_ROLE_ENUM.SUPER_ADMIN }}}),
    ReferralProgramModel.findAll(),
  ])
  const response = {
    customersAmount: user.length,
    credits: programs.reduce((total, programs) => {
      total = parseInt(programs.creditToAward) + total
      return total
    }, 0)
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
    isActive: req.body.isActive,
    endDate: req.body.endDate,
    emailTemplate: req.body.emailTemplate || null,
    creditToAward: req.body.creditToAward,

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
