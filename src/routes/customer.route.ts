import express from 'express';
var jwt = require('express-jwt');
var guard = require('express-jwt-permissions')({
  permissionsProperty: 'role'
})
import asyncHandler from "express-async-handler"
import { CustomerModel } from '../models/customer.model';
import { ApiError } from '../utils/ApiError';
import PluginKeyExist from '../utils/PluginKeyExist';
import { ReferralProgramModel } from '../models/referralProgram.model';
import { UserModel } from '../models/user.model';

export const customerRoutes = express();


customerRoutes.post('/', asyncHandler(async (req, res) => {
  if ((await PluginKeyExist(req.query)) == false) throw new ApiError("Plugin key not found")

  const customer = await CustomerModel.findOne({ where: { id: req.body.id }})
  if (customer) throw new ApiError("Customer already exist");
  //@ts-expect-error
  const program = await ReferralProgramModel.findOne({ where: { "$User.pluginKey$": req.query.pluginKey, isActive: true }, include: [{model: UserModel, attributes: []}]})
  if (!program) throw new ApiError("No active program found for this plugin key")
  res.send(await CustomerModel.create({ ...req.body, ReferralProgramId: program.id }));
}));