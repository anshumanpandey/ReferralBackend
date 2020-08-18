import sequelize from "../utils/DB";

import { DataTypes, Model, Optional } from "sequelize";

interface ReferralProgramAttributes {
  id: string,
  name: string,
  endDate?: string,
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
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
})