var mongoose = require('mongoose')
var model = 'ExchangeRate'
var ExchangeRateSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    currency: {type: String},
    exchangeRate: {type: Number},
    date: {type: Number}
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false,
  }
)

ExchangeRateSchema.statics.getAll = function () {
    return this.find({}).exec()
  }

ExchangeRateSchema.statics.getByCurrency = function (currency) {
  return this.findOne({currency: currency}).exec()
}

ExchangeRateSchema.statics.getById = function (Id){
  return this.findOne({_id: Id}).exec();
}

ExchangeRateSchema.statics.deleteById = function(Id){
  return this.findOneAndDelete({_id: Id}).exec();
}

ExchangeRateSchema.statics.createNew = function(data) {
  const convertDate = new Date(data.date);
  const convertNumber = Number(new Date(convertDate));
  data.date = convertNumber;
  return this.create(data);
}

ExchangeRateSchema.statics.upsert = function (data) {
  const options = { upsert: true, new: true }
  return this.findOneAndUpdate({ currency: data.currency }, 
    { currency: data.currency, 
      exchangeRate: data.rate,
      date: data.date
    }, options).exec()
  }

const ExchangeRate = mongoose.model(model, ExchangeRateSchema)
module.exports = ExchangeRate
