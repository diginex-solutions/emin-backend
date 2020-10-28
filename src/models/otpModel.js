const mongoose = require('mongoose')
const model = 'Otp'
const Otpschema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    token: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    createdAt: { type: Number },
    valid: { type: Boolean },
  },
  {
    versionKey: false,
  }
)

Otpschema.statics.use = function (token) {
  const valid = true
  const expiryThreshold = new Date(+new Date() - 1000 * 3600 * 24) // 24 hrs ago
  return this.findOneAndDelete({
    token,
    valid,
    createdAt: { $gt: expiryThreshold },
  }).lean()
}

Otpschema.statics.set = function (token, userId, valid = true, createdAt = new Date()) {
  const options = { upsert: true, new: false }
  return this.findOneAndUpdate({ userId }, { token, userId, valid, createdAt }, options).lean()
}

Otpschema.statics.getByUserId = function (userId) {
  return this.findOne({ userId }).lean()
}

Otpschema.statics.get = function (token) {
  return this.findOne({ token }).lean()
}

Otpschema.statics.removeByUserId = function (userId) {
  return this.remove({ userId }).lean()
}

const Otp = mongoose.model(model, Otpschema)
module.exports = Otp
