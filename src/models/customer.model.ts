import sequelize from "../utils/DB";

import { DataTypes, Model,Optional } from "sequelize";

interface CustomerAttributes {
  id: string,
  firstname: string,
  lastname: string,
  referral_code: string,
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
})
