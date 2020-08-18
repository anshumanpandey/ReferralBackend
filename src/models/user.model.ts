import sequelize from "../utils/DB";

import { DataTypes, Model,Optional } from "sequelize";

interface UserAttributes {
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  phoneNumber: string,
  companyTitle: string,
  companyName: string,
  profilePic: string
}

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes{}

export const UserModel = sequelize.define<UserInstance>("User", {
    // Model attributes are defined here
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING
      // allowNull defaults to true
    },
    email: {
      type: DataTypes.STRING
      // allowNull defaults to true
    },
    password: {
      type: DataTypes.STRING
      // allowNull defaults to true
    },
    phoneNumber: {
      type: DataTypes.STRING
      // allowNull defaults to true
    },
    companyTitle: {
      type: DataTypes.STRING
      // allowNull defaults to true
    },
    companyName: {
      type: DataTypes.STRING
      // allowNull defaults to true
    },
    profilePic: {
      type: DataTypes.STRING
      // allowNull defaults to true
    }
})