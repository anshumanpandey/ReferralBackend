import sequelize from "../utils/DB";
import { DataTypes, Model, Optional } from "sequelize";

interface SocialShareAttributes {
  id: string,
  url: string,
  imgUrl: string,
}

interface SocialShareAttributes extends Optional<SocialShareAttributes, "id"> { }

interface SocialShareInstance extends Model<SocialShareAttributes, SocialShareAttributes>, SocialShareAttributes { }

export const SocialShareModel = sequelize.define<SocialShareInstance>("SocialShare", {
  // Model attributes are defined here
  id: {
    primaryKey: true,
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  imgUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
})