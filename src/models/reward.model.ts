import sequelize from "../utils/DB";
import { DataTypes, Model, Optional } from "sequelize";
import { GiftModel } from "./gift.model";

export enum REWARD_TYPE_ENUM {
  STORED_CREDIT = "Stored_credit",
  GIFT = "Gift",
  FREE_PRODUCT = "Free_product",
  DISCOUNT = "Discount"
}

interface RewardAttributes {
  id: string,
  sponsor: string,
  storeCredit?: number,
  freeProduct?: string,
  rewardType: REWARD_TYPE_ENUM
  discountAmount?: string
  discountUnit?: string
  freeDeliver: boolean
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
  sponsor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rewardType: {
    type: DataTypes.ENUM(...RewardTypeValues),
    allowNull: false
  },
  storeCredit: {
    type: DataTypes.INTEGER,
  },
  freeProduct: {
    type: DataTypes.STRING,
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
})

RewardModel.hasMany(GiftModel, {
  foreignKey: {
    allowNull: false
  }
});
GiftModel.belongsTo(RewardModel);