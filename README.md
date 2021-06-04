# emin-backend

### branches to environments
- dev
- master
- production-emin
- production-emin-app
- qa
- production-wbi
- production-mobile

### Running the app

- npm i
- cd temp
- docker-compose up -d #to get redis and mongo
- cd ..
- npm run seedmongo #(optional)
- npm run dev | ./node_modules/.bin/bunyan

### Get a jwt token for local
```
npm test | grep "token Bearer"
```

### Generate JWT for local backend
```
require('jsonwebtoken').sign({userId: '5d4328945a5110ee4ed30267', user: {email: "johndoe@diginex.com"}}, '123456789',{ expiresIn: '30d' })

//'123456789' as config.secret need to match
//userId must exist in some record
```
