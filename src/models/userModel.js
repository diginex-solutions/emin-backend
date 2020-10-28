const { LANGUAGES, USER_TYPE } = require('../constants')
var mongoose = require('mongoose')
var model = 'User'
var UserSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    name: String,
    surname: String,
    email: { type: String, index: true },
    dateOfBirth: { type: String, required: false },
    gender: { type: String, required: false },
    countryCode: { type: String, required: false },
    phoneNumber: { type: String, required: false },
    location: { type: String, required: false },
    workDepartment: { type: String, required: false },
    workTitle: { type: String, required: false },
    userType: { type: String, default: USER_TYPE.normal, required: false }, // Normal, SuperUser, Diginex
    createdAt: { type: Number },
    expiresAt: { type: Number },
    password: { type: String },
    lang: { type: String, default: LANGUAGES.default },
    isRegistered: { type: Boolean, default: true, required: true },
    applicationId: { type: String, default: null },
    extUserId: { type: String, default: null },
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false,
  }
)

UserSchema.statics.newUser = function (user) {
  return this.create(user)
}

UserSchema.statics.getUserById_ = function (userId) {
  return this.findOne({ _id: userId }, '-password').lean()
}

UserSchema.statics.getUserById = function (userId) {
  return this.findOne({ _id: userId }, '-password').exec()
}

UserSchema.statics.getUsers = function () {
  return this.find({}, '-password').exec()
}

UserSchema.statics.listUserByIds = function (userIds) {
  return this.find({ _id: userIds }, '-password').lean()
}

UserSchema.statics.setUserById = function (userId, user, upsert = false) {
  const options = { new: true, upsert, setDefaultsOnInsert: true }
  return this.findOneAndUpdate({ _id: userId }, user, options).exec()
}
UserSchema.statics.getUserByEmail = function (email) {
  return this.findOne({ email: email }, '-password').exec()
}

UserSchema.statics.getUserWithPwByEmail = function (email) {
  return this.findOne({ email: email }).exec()
}

UserSchema.statics.getUserWithPwd = function (userId) {
  return this.findOne({ _id: userId }).exec()
}

UserSchema.statics.changePassword = function (userId, hashed) {
  const options = { fields: { password: 0 } , new: true}
  return this.findOneAndUpdate({ _id: userId }, { password: hashed }, options).lean()
}

UserSchema.statics.getExtUser = function (applicationId, extUserId) {
  return this.findOne({ applicationId, extUserId }, '-password').lean()
}

const User = mongoose.model(model, UserSchema)
module.exports = User
