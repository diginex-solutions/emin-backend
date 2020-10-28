const rootPath = `${__dirname}/..`
let loginReq = () => {
  const jwt = require(`${rootPath}/dist/helper/jwtHelper`)
  const [token, user] = jwt.getJwt({
    email: 'john@asdf.com',
    name: 'John',
    surname: 'Doe',
    id: '5d4328945a5110ee4ed30267' })
  const bearerToken = "Bearer " + token
  return bearerToken
}

module.exports = {
  loginReq,
};
