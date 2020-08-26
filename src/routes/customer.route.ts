import express from 'express';
var jwt = require('express-jwt');
var guard = require('express-jwt-permissions')({
  permissionsProperty: 'role'
})
import asyncHandler from "express-async-handler"
import { CustomerModel } from '../models/customer.model';
import { ApiError } from '../utils/ApiError';
import PluginKeyExist from '../utils/PluginKeyExist';

export const customerRoutes = express();


customerRoutes.post('/', asyncHandler(async (req, res) => {
  if ((await PluginKeyExist(req.query)) == false) throw new ApiError("Plugin key not found")

  const customer = await CustomerModel.findOne({ where: { id: req.body.id }})
  if (customer) throw new ApiError("Customer already exist")
  res.send(await CustomerModel.create(req.body));
}));