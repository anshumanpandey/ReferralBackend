import express from 'express';
import { userRoutes } from './user.route';

export const routes = express();

routes.use(userRoutes)
