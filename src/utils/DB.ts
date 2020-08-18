import { Sequelize } from "sequelize"
import path from "path";


let sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', '..', 'passport-db.sqlite'),
});

if (process.env.DB_DIALECT) {
  console.log('using dialect')
  sequelize = new Sequelize(process.env.DB_NAME || '', process.env.DB_USERNAME || '', process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT as "postgres" || 'postgres'
  });
} 

export default sequelize;