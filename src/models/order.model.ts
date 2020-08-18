import sequelize from "../utils/DB";

import { DataTypes, Model, Optional } from "sequelize";

export enum ORDER_PROMOTION_ENUM {
  COUPON = "Coupon",
  LINK = "Link",
  EMAIL = "Email"
}

interface OrderAttributes {
  id: string,
  customer: string,
  sponsor: string,
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
  customer: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sponsor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  orderAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  promotionMethod: {
    type: DataTypes.ENUM(...OrderPromotionKeys)
  }
})