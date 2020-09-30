import sequelize from "../utils/DB";
import { DataTypes, Model, Optional } from "sequelize";
import { SocialShareModel } from "./socialShare.model";
import { RewardModel } from "./reward.model";
import { GiftModel } from "./gift.model";
import { OrderModel } from "./order.model";
import { CustomerModel } from "./customer.model";

export enum REWARD_TYPE_ENUM {
  STORED_CREDIT = "Stored_credit",
  GIFT = "Gift",
  FREE_PRODUCT = "Free_product",
  DISCOUNT = "Discount"
}

export enum PROMOTION_ENUM {
  PERSONAL_LINK = "Personal_link",
  COUPON_CODE = "Coupon_code",
  SOCIAL_MEDIA_IMAGE = "Social_media_image",
  EMAIL = "Email"
}

export const RewardTypeValues = Object.values(REWARD_TYPE_ENUM).filter(k => !Number.isInteger(k)) as string[]

interface ReferralProgramAttributes {
  id: string,
  name: string,
  description: string
  isActive: boolean,
  colorCode?: string
  endDate?: Date,
  emailTemplate?: string,
  emailFrom?: string,
  emailSubject?: string,

  destinationLink?: string

  creditToAward: string,
  customerMaxStoreCredit?: number,
  customerFreeProduct?: string,
  customerRewardType: REWARD_TYPE_ENUM
  creditExpiryDate?: Date,

  friendRewardType: REWARD_TYPE_ENUM
  friendDiscountAmount?: string
  friendDiscountUnit?: string
  friendFreeProduct?: string

  freeDeliver: boolean

  promotionMethods: string

  imgUrl: string
}

interface ReferralProgramCreationAttributes extends Optional<ReferralProgramAttributes, "id"> { }

interface ReferralProgram extends Model<ReferralProgramAttributes, ReferralProgramCreationAttributes>, ReferralProgramAttributes { }

export const ReferralProgramModel = sequelize.define<ReferralProgram>("ReferralProgram", {
  // Model attributes are defined here
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  colorCode: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  emailTemplate: {
    type: DataTypes.STRING(2000),
    allowNull: true
  },
  emailFrom: {
    type: DataTypes.STRING(),
    allowNull: true
  },
  emailSubject: {
    type: DataTypes.STRING(),
    allowNull: true
  },
  destinationLink: {
    type: DataTypes.STRING(),
    allowNull: true
  },

  creditToAward: {
    type: DataTypes.STRING,
    allowNull: true
  },

  customerMaxStoreCredit: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customerFreeProduct: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customerRewardType: {
    type: DataTypes.ENUM(...RewardTypeValues),
    allowNull: true
  },

  creditExpiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },

  friendRewardType: {
    type: DataTypes.ENUM(...RewardTypeValues),
    allowNull: true
  },
  friendDiscountAmount: {
    type: DataTypes.STRING,
    allowNull: true
  },
  friendDiscountUnit: {
    type: DataTypes.STRING,
    allowNull: true
  },

  freeDeliver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  friendFreeProduct: {
    type: DataTypes.STRING,
    allowNull: true
  },

  imgUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },

  promotionMethods: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      const method = this.getDataValue('promotionMethods')
      return method ? method.split(';'): []
    },
    set(val: string[]) {
      this.setDataValue('promotionMethods', val.join(';'));
    },
  }
})

ReferralProgramModel.hasMany(SocialShareModel, {
  foreignKey: {
    allowNull: false
  }
});
SocialShareModel.belongsTo(ReferralProgramModel);

ReferralProgramModel.hasMany(GiftModel, {
  foreignKey: {
    allowNull: false
  }
});
GiftModel.belongsTo(ReferralProgramModel);

ReferralProgramModel.hasMany(OrderModel, {
  foreignKey: {
    allowNull: false
  }
});
OrderModel.belongsTo(ReferralProgramModel);

ReferralProgramModel.hasMany(CustomerModel, {
  foreignKey: {
    allowNull: false
  }
});
CustomerModel.belongsTo(ReferralProgramModel);

ReferralProgramModel.hasMany(RewardModel, {
  foreignKey: {
    allowNull: false
  }
});
RewardModel.belongsTo(ReferralProgramModel);