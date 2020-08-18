import express from 'express';
var jwt = require('express-jwt');
import asyncHandler from "express-async-handler"
import { Op } from "sequelize"
import { checkSchema } from "express-validator"
import { sign } from 'jsonwebtoken'
import { hash, compare } from "bcrypt"
import { UserModel, USER_ROLE_ENUM } from '../models/user.model';
import { validateParams } from '../middlewares/routeValidation.middleware';
import { ApiError } from '../utils/ApiError';
import { sendForgotPassword } from '../utils/Mail';
import multer from 'multer';

let storage = multer.diskStorage({
  destination: 'profilePic/',
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});

const fieldSize = 50 * 1024 * 1024

var upload = multer({ storage, limits: { fieldSize } })

export const userRoutes = express();

userRoutes.post('/login', validateParams(checkSchema({
  email: {
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
  password: {
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
  const { email, password} = req.body;
  const user = await UserModel.findOne({
    where: { email },
    attributes: { exclude: ["createdAt", "updatedAt"]}
  });

  if (!user) throw new ApiError("User not found")
  if (!await compare(password, user.password)) throw new ApiError("Email or password incorrect")

  const jsonData = user.toJSON();
  //@ts-ignore
  delete jsonData.password;
  var token = sign(jsonData, process.env.JWT_SECRET || 'aa', { expiresIn: '9999 years'});
  res.send({ ...jsonData, token });
}));

userRoutes.get('/get', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  //@ts-expect-error
  res.send(await UserModel.findByPk(req.user.id));
}));

userRoutes.post('/createPartner', validateParams(checkSchema({
  companyName: {
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
  address: {
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
  pluginKey: {
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
  email: {
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
  password: {
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
})), jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({
    where: { email },
    attributes: { exclude: ["createdAt", "updatedAt"]}
  });


  if (req.body.id) {
    let pass = null
    if (req.body.password) {
      pass = await hash(password, 8)
    }
    await UserModel.update({ ...req.body, password: pass ? pass : undefined }, { where: { id: req.body.id }})
    res.send({ id: req.body.id });
  } else {
    if (user) throw new ApiError("Email registered")
    const p = await UserModel.create({ ...req.body, password: await hash(password, 8), role: USER_ROLE_ENUM.PARTNER })
    res.send({ id: p.id });
  }
}));

userRoutes.get('/getPartners', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  res.send(await UserModel.findAll({ attributes: { exclude: ["password"]},where: { role: { [Op.not]: USER_ROLE_ENUM.SUPER_ADMIN }}}));
}));


userRoutes.post('/uploadProfilePic', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), upload.single("awardFile"), asyncHandler(async (req, res) => {
  console.log(req.file)
  await UserModel
  //@ts-expect-error
  .update({ profilePic: `${req.protocol + '://' + req.get('host')}/profilePic/${req.file.filename}` }, { where: { id: req.user.id }})
  res.send({ success: 'Achivement created' });
}));

userRoutes.post('/getUser', jwt({ secret: process.env.JWT_SECRET || 'aa', algorithms: ['HS256'] }), asyncHandler(async (req, res) => {
  //@ts-expect-error
  res.send(await UserModel.findByPk(req.user.id));
}));