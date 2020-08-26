import express from 'express';
import { userRoutes } from './user.route';
import { orderRoutes } from './order.route';
import { rewardRoutes } from './reward.route';
import { referralProgramRoutes } from './referralProgram.route';
import { productRoutes } from './product.route';

export const routes = express();

routes.use("/user",userRoutes)
routes.use("/order",orderRoutes)
routes.use("/reward", rewardRoutes)
routes.use("/referralProgram", referralProgramRoutes)
routes.use("/product", productRoutes)
