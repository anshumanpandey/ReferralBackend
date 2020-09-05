import sequelize from "../utils/DB";
import { DataTypes, Model, Optional } from "sequelize";
import { GiftModel } from "./gift.model";
import { ProductModel } from "./product.model";

export enum REWARD_TYPE_ENUM {
  STORED_CREDIT = "Stored_credit",
  GIFT = "Gift",
  FREE_PRODUCT = "Free_product",
  DISCOUNT = "Discount"
}

interface RewardAttributes {
  id: string,
  storeCredit?: number,
  freeProduct?: string,
  rewardType: REWARD_TYPE_ENUM
  discountAmount?: string
  discountUnit?: string
  freeDeliver: boolean,
  claimed?: boolean,
  rewardCode: string,
}

interface RewardCreationAttributes extends Optional<RewardAttributes, "id"> { }

interface RewardInstance extends Model<RewardAttributes, RewardCreationAttributes>, RewardAttributes { }

export const RewardTypeValues = Object.values(REWARD_TYPE_ENUM).filter(k => !Number.isInteger(k)) as string[]

export const RewardModel = sequelize.define<RewardInstance>("Reward", {
  // Model attributes are defined here
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
  },
  rewardType: {
    type: DataTypes.ENUM(...RewardTypeValues),
    allowNull: false
  },
  storeCredit: {
    type: DataTypes.INTEGER,
  },
  discountAmount: {
    type: DataTypes.FLOAT,
  },
  discountUnit: {
    type: DataTypes.STRING,
  },
  freeDeliver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  claimed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rewardCode: {
    type: DataTypes.STRING,
  },
})

RewardModel.hasOne(ProductModel, {
  as: "FreeProductId",
  foreignKey: {
    allowNull: false,
  }
});
ProductModel.belongsTo(RewardModel);