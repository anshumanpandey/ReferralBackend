import sequelize from "../utils/DB";

import { DataTypes, Model, Optional } from "sequelize";
import { RewardModel } from "./reward.model";

export enum ORDER_PROMOTION_ENUM {
  COUPON = "Coupon",
  LINK = "Link",
  EMAIL = "Email"
}

interface OrderAttributes {
  id: string,
  orderAmount: number,
  promotionMethod: ORDER_PROMOTION_ENUM,
}

interface UserCreationAttributes extends Optional<OrderAttributes, "id"> { }

interface OrderInstance extends Model<OrderAttributes, UserCreationAttributes>, OrderAttributes { }

export const OrderPromotionKeys = Object.values(ORDER_PROMOTION_ENUM).filter(k => !Number.isInteger(k)) as string[]

export const OrderModel = sequelize.define<OrderInstance>("Order", {
  // Model attributes are defined here
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
  },
  orderAmount: {
    type: DataTypes.FLOAT(10, 2),
    allowNull: false
  },
  promotionMethod: {
    type: DataTypes.ENUM(...OrderPromotionKeys)
  }
})

OrderModel.hasOne(RewardModel, {
  foreignKey: {
    allowNull: true
  }
});
RewardModel.belongsTo(OrderModel);