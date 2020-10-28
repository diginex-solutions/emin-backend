var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

const createdAt = new Date().getTime();
const threeMonthsMilliseconds = 1 * 1000 * 3600 * 24 * 90;

function hashSalt(secret, round = 10) {
  const salt = bcrypt.genSaltSync(round)
  const hashed = bcrypt.hashSync(secret, salt)
  return hashed
}

const users = [
  {
    id: mongoose.Types.ObjectId('5d4328945a5110ee4ed30267'),
    email: 'john@asdf.com',
    name: 'John',
    surname: 'Doe',
    lang: 'en',
    createdAt,
    expiresAt: new Date(createdAt + threeMonthsMilliseconds).getTime(),
    isRegistered: true,
    userType: 'normal',
    password: hashSalt('abc123ABC!'),
  },
];

module.exports = users
