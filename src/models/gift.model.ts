import sequelize from "../utils/DB";
import { DataTypes, Model, Optional } from "sequelize";

interface GiftAttributes {
  id: string,
  name: string,
  referralId: string,
}

interface GiftCreationAttributes extends Optional<GiftAttributes, "id"> { }

interface Giftnstance extends Model<GiftAttributes, GiftCreationAttributes>, GiftAttributes { }

export const GiftModel = sequelize.define<Giftnstance>("Gift", {
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
  referralId: {
    type: DataTypes.STRING,
    allowNull: false
  },
})