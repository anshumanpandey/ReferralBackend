import express from 'express';
var jwt = require('express-jwt');
var guard = require('express-jwt-permissions')({
  permissionsProperty: 'role'
})
import asyncHandler from "express-async-handler"
import { CustomerModel } from '../models/customer.model';

export const customerRoutes = express();


customerRoutes.post('/', asyncHandler(async (req, res) => {
  res.send(await CustomerModel.create(req.body));
}));