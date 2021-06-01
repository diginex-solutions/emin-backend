var mongoose = require('mongoose')
var model = 'UserBudgetCalculator'
var UserBudgetCalculatorSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    countryName: {type: String},
    countryCode: {type: String},
    migrationFees : [
        {
            categoryName: {type: String},
            categoryCode: {type: String}, 
            subcategoryItems:[
                {
                    subCategoryName: {type: String},
                    subCategoryCode: {type: String},
                    userValue: {type: Number},
                }
            ]
        }
    ],
    jobs:{
        jobName: {type: String},
        jobId: {type: String},
        userSalary: {type: Number},
        countryCode: {type: String}
    },
    loanAmount: {type: Number},
    loanTenure: {type: Number},
    loanInterestRate: {type: Number},
    remittanceAmount: {type: Number},
    totalMigrationCost: {type: Number},
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false,
  }
)

UserBudgetCalculatorSchema.statics.newData = function (model) {
    return this.create(model)
  }

UserBudgetCalculatorSchema.statics.getAll = function () {
  return this.find({}).exec()
}

UserBudgetCalculatorSchema.statics.getByCountryCode = function (code) {
  return this.find({
    countryCode: code
  }).exec()
}

UserBudgetCalculatorSchema.statics.getJobsByCountryCode = function (code) {
  return this.find({
    'jobs.countryCode': code
  }).exec()
}

UserBudgetCalculatorSchema.statics.getListMigrationCost = function (){
  return this.find({}, { totalMigrationCost: true}).exec()
}

UserBudgetCalculatorSchema.statics.deleteAll = function () {
  return this.deleteMany({}).exec()
}

const UserBudgetCalculator = mongoose.model(model, UserBudgetCalculatorSchema)
module.exports = UserBudgetCalculator
