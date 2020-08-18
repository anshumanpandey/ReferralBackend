import sequelize from "../utils/DB";
import { DataTypes, Model, Optional } from "sequelize";
import { SocialShareModel } from "./socialShare.model";

interface ReferralProgramAttributes {
  id: string,
  name: string,
  isActive: boolean,
  endDate?: Date,
  emailTemplate?: string,
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
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  emailTemplate: {
    type: DataTypes.STRING(2000),
    allowNull: true
  },
})

ReferralProgramModel.hasMany(SocialShareModel, {
  foreignKey: {
    allowNull: false
  }
});
SocialShareModel.belongsTo(ReferralProgramModel);