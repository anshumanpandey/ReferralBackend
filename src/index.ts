require('dotenv').config()
import {app, bootstrap} from './app'
import {AddressInfo} from 'net'
import sequelize from './utils/DB';
import { SeedSuperadmin } from './utils/Seeder';

bootstrap()
.then(() => sequelize.sync())
.then(() => SeedSuperadmin())
.then(() => {
    const server = app.listen(parseInt(process.env.PORT || '5050') || 5050, '0.0.0.0', () => {
        const {port, address} = server.address() as AddressInfo;
        console.log('Server listening on:','http://' + address + ':'+port);
    });
})