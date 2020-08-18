import sequelize from "../utils/DB";

import { DataTypes, Model,Optional } from "sequelize";

export enum USER_ROLE_ENUM {
  PARTNER = "Partner",
  SUPER_ADMIN = "Super_admin"
}

interface UserAttributes {
  id: string,
  companyName: string,
  address: string,
  pluginKey: string,
  email: string,
  password: string,
  role: string,
  isDisabled: boolean,
}

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes{}

const roleKeys = Object.values(USER_ROLE_ENUM).filter(k => !Number.isInteger(k)) as string[]

export const UserModel = sequelize.define<UserInstance>("User", {
    // Model attributes are defined here
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pluginKey: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isDisabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    role: {
      type: DataTypes.ENUM(...roleKeys)
    }
})