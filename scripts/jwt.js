// var fs = require('fs')
let jwt = require('jsonwebtoken')
// var privateKey = fs.readFileSync('eminApp');
// var token = jwt.sign({userId: '5dbaba43edf93201ea4acb7e', user: {email: "manhongcc@gmail.com"}}, privateKey, { algorithm: 'RS256' });
// console.log(token)

// var privateKey = fs.readFileSync('1024test');
var token = jwt.sign({ userId: '5d4328945a5110ee4ed30267', user: { email: "john@asdf.com" } }, '123456789');
console.log(token)