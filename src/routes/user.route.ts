import express from 'express';
var jwt = require('express-jwt');
import asyncHandler from "express-async-handler"
import { Op } from "sequelize"
import { checkSchema } from "express-validator"
import { sign } from 'jsonwebtoken'
import { hash, compare } from "bcrypt"
import { UserModel } from '../models/user.model';
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

userRoutes.post('/createPartner', validateParams(checkSchema({
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
  }
})), asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await UserModel.findOne({
    where: { email },
    attributes: { exclude: ["createdAt", "updatedAt"]}
  });

  if (!user) throw new ApiError("Email not registered")

  const password = Math.random().toString(36).substr(2, 5)

  await user.update({ password: await hash(password, 8) })
  //@ts-expect-error
  await sendForgotPassword({email, password })
  res.send({ success: 'Mail sended' });
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