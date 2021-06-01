var mongoose = require('mongoose')
var model = 'BudgetCalculator'
var BudgetCalculatorSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    countryName: {type: String},
    countryCode: {type: String},
    description: {type: String},
    migrationAverageCost: {type: Number},
    migrationFees : [
        {
            categoryName: {type: String},
            categoryCode: {type: String},
            subcategoryItems:[
                {
                    subCategoryName: {type: String},
                    subCategoryCode: {type: String},
                    defaultMin: {type: Number},
                    defaultMax: {type: Number},
                    averageValue: {type: Number},
                    ihrbValue: {type: Number},
                }
            ]
        }
    ],
    jobs: [
        {
            jobName: {type: String},
            jobId: {type: String},
            averageSalary: {type: Number},
        }
    ]
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false,
  }
)

BudgetCalculatorSchema.statics.createNew = function(data){
  return this.create(data);
}

BudgetCalculatorSchema.statics.getAll = function () {
  return this.find({}).exec()
}

BudgetCalculatorSchema.statics.getById = function(Id){
  return this.findOne({_id:Id}).exec();
}

BudgetCalculatorSchema.statics.getByCountryCode = function (countryCode) {
  return this.findOne({countryCode: countryCode}).exec()
}

BudgetCalculatorSchema.statics.deleteById = function(Id){
  return this.findOneAndDelete({_id:Id}).exec();
}

BudgetCalculatorSchema.statics.upsert = function (data) {
  const options = { upsert: true, new: true }
  return this.findOneAndUpdate({ countryCode: data.countryCode }, 
    { countryName: data.countryName, 
      countryCode: data.countryCode,
      description: data.description,
      migrationAverageCost: data.migrationAverageCost,
      migrationFees: data.migrationFees,
      jobs: data.jobs
    }, options).exec()
}

BudgetCalculatorSchema.statics.update = function (data) {
  const options = { upsert: true, new: true }
  return this.findOneAndUpdate({ countryCode: data.countryCode }, 
    { countryName: data.countryName, 
      countryCode: data.countryCode,
      migrationAverageCost: data.migrationAverageCost,
      migrationFees: data.migrationFees,
      jobs: data.jobs
    }, options).exec()
}

const BudgetCalculator = mongoose.model(model, BudgetCalculatorSchema)
module.exports = BudgetCalculator
