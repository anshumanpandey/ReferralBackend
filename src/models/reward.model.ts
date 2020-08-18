import sequelize from "../utils/DB";
import { DataTypes, Model, Optional } from "sequelize";

interface RewardAttributes {
  id: string,
  sponsor: string,
  storeCredit: number,
}

interface RewardCreationAttributes extends Optional<RewardAttributes, "id"> { }

interface RewardInstance extends Model<RewardAttributes, RewardCreationAttributes>, RewardAttributes { }

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
  storeCredit: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
})