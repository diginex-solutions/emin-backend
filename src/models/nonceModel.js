var mongoose = require('mongoose')
var model = 'Nonce'
var Nonceschema = new mongoose.Schema(
  {
    _id: Number,
    nonce: Number,
  },
  {
    versionKey: false,
  }
)

Nonceschema.statics.use = function () {
  var options = { new: false }
  return this.findOneAndUpdate({ _id: 1 }, { $inc: { nonce: 1 } }, options).exec()
}

Nonceschema.statics.set = function (nonce) {
  var options = { upsert: true, new: false }
  return this.findOneAndUpdate({ _id: 1 }, { nonce: nonce }, options).exec()
}

const Nonce = mongoose.model(model, Nonceschema)
module.exports = Nonce
