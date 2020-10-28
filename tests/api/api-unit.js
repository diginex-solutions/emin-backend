const app = 'http://localhost:3000'
const origin = 'http://localhost:8080'
const request = require("supertest");

class API {
  constructor(jwt) {
    this.jwt = jwt;
    this.app = app
    this.origin = origin
  }

  withHeaders = (req) => {
    return req
      .set("Authorization", this.jwt)
      .set('Origin', origin)
      .expect("Content-Type", /json/)
  }

  req = () => {
    return request(this.app)
  }
}

module.exports = API