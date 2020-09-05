import sequelize from "../utils/DB";
import { DataTypes, Model, Optional } from "sequelize";
import { UserModel } from "./user.model";
import { RewardModel } from "./reward.model";

interface ProductAttributes {
  id: string,
  name: string,
}

interface ProductCreationAttributes extends Optional<ProductAttributes, "id"> { }

interface ProductInstance extends Model<ProductAttributes, ProductCreationAttributes>, ProductAttributes { }

export const ProductModel = sequelize.define<ProductInstance>("Product", {
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
})

UserModel.hasMany(ProductModel, {
  foreignKey: {
    allowNull: false
  }
});
ProductModel.belongsTo(UserModel);

RewardModel.belongsToMany(ProductModel, {
  as: "FreeProduct",
  through: "PartnerDefaultItems"
});
ProductModel.belongsToMany(RewardModel, {
  as: "ForReward",
  through: "PartnerDefaultItems"
});