const host = 'http://localhost:3000'
const origin = 'http://localhost:8080'
const request = require('supertest')
var should = require('chai').should()
var Chance = require('chance')
var chance = new Chance()

let chai = require('chai')
let chaiHttp = require('chai-http')
chai.should()
chai.use(chaiHttp)
let req = chai.request(host)

describe('Authentication process', () => {
  let email = chance.email({ domain: 'example.com' })
  let password = '1qaz@WSX'
  let token = ''
  // Test sign up route
  describe('Sign up a new account: post /signup', () => {
    var path = '/signup'
    it('should create a new account', (done) => {
      req
        .post(path)
        .set('content-type', 'application/json')
        .send({
          captcha: '03AGdBq26yd15k80',
          email,
          lang: 'en',
          name: 'Arman',
          password,
          recaptcha: '03AGdBq',
          surname: 'Test',
        })
        .end(function (error, response, body) {
          if (error) {
            done(error)
          } else {
            status =
              (body && body.status) ||
              (response && response.status) ||
              (response && response.body && response.body.status)
            if (status) {
              should.equal(status, 200)
            }
            if (response && response.body && response.body.token) {
              token = response.body.token
              should.exist(token)
            } else {
              should.exist(null)
            }
            console.log('Email:', email)
            console.log('Password', password)
            console.log('token', token)
            done()
          }
        })
    })
  })

  describe('Sign in to account: post /signin', () => {
    var path = '/signin'
    it('should sign in to account', (done) => {
      req
        .post(path)
        .set('content-type', 'application/json')
        .send({
          captcha: '03AGdBq',
          email,
          password,
          recaptcha: '03AGdBq',
        })
        .end(function (error, response, body) {
          if (error) {
            done(error)
          } else {
            status =
              (body && body.status) ||
              (response && response.status) ||
              (response && response.body && response.body.status)
            if (status) {
              should.equal(status, 200)
            }
            if (response && response.body && response.body.token) {
              token = response.body.token
              should.exist(token)
            } else {
              should.exist(null)
            }
            console.log('Email:', email)
            console.log('Password', password)
            console.log('token', token)
            done()
          }
        })
    })
  })
})
