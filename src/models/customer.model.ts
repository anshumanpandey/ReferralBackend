import sequelize from "../utils/DB";

import { DataTypes, Model,Optional } from "sequelize";
import { RewardModel } from "./reward.model";
import { OrderModel } from "./order.model";

interface CustomerAttributes {
  id: string,
  firstname: string,
  lastname: string,
  referral_code: string,
  isSponsor: boolean
}

interface UserCreationAttributes extends Optional<CustomerAttributes, "id"> {}

interface CustomerInstance extends Model<CustomerAttributes, UserCreationAttributes>, CustomerAttributes{}

export const CustomerModel = sequelize.define<CustomerInstance>("Customer", {
    // Model attributes are defined here
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    referral_code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isSponsor: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
})

CustomerModel.hasMany(RewardModel, {
  foreignKey: {
    allowNull: false
  }
});
RewardModel.belongsTo(CustomerModel);

CustomerModel.hasMany(OrderModel, {
  foreignKey: {
    allowNull: false,
    name: "CustomerId"
  }
});
OrderModel.belongsTo(CustomerModel);

CustomerModel.hasMany(OrderModel, {
  foreignKey: {
    allowNull: true,
    name: "SponsorId"
  }
});
OrderModel.belongsTo(CustomerModel);

CustomerModel.hasMany(CustomerModel, {
  foreignKey: {
    allowNull: true,
    name: "ReferredBy",
  }
});
CustomerModel.belongsTo(CustomerModel);