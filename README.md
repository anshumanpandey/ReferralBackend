# Referal Portal Backend

##### ENV vars to set up


- `JWT_SECRET=`[RANDOM STRING FOR TOKEN ENCRYPTION]
- `DB_DIALECT=`[one of 'mysql' | 'mariadb' | 'postgres' | 'mssql']
- `DB_HOST=`[DB SERVER URL]
- `DB_NAME=`[DB NAME]
- `DB_PASSWORD=`[DB PASS]
- `DB_USERNAME=`[DB USERNAME]
- `PORT=`[PORT TO RUN THE SERVER - DEFAULT TO 5000]

##### How to run with pm2
1. Run on server `npm install pm2 -g`
2. Run `git clone https://github.com/anshumanpandey/ReferralBackend.git`
3. Run `cd ReferralBackend`
4. run `npm install`
5. Create and set the ENV vars defined above
6. run `pm2 start npm --name "[APP_NAME]" -- start` 
7. App will be running on specified port number, can be checked with `pm2 status`
 
##### Install NodeJS 

1. Run `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.36.0/install.sh | bash`
2. Run `source ~/.profile`
3. Run `nvm install node`