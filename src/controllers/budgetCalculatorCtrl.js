const budgetCalculatorSvc = require('../services/budgetCalculatorSvc')
const userBudgetCalculatorSvc = require('../services/userBudgetCalculatorSvc')

function convertMasterData(data, rate){
  console.log(rate)
  if (!rate) rate = 1
  data.forEach(element => {
    element.migrationAverageCost = element.migrationAverageCost * rate
    element.jobs.forEach(job => {
      job.averageSalary = job.averageSalary * rate
    })
    element.migrationFees.forEach(fee => {
      fee.subcategoryItems.forEach(sub => {
        sub.defaultMin = sub.defaultMin * rate
        sub.defaultMax = sub.defaultMax * rate
        sub.averageValue = sub.averageValue * rate
        sub.ihrbValue = sub.ihrbValue * rate
      })
    })
  })
  return data
}

async function getAllBudgetCalculator(req, res, next) {
  const data = await budgetCalculatorSvc.getAll()
  const exRate = await budgetCalculatorSvc.getExchangeRate(req.params.currency)
  res.json(convertMasterData(data, exRate))
}

function convertUserData(data, rate){
  if (!rate) rate = 1
  data.loanAmount = data.loanAmount / rate
  data.loanTenure = data.loanTenure / rate
  data.loanInterestRate = data.loanInterestRate / rate
  data.remittanceAmount = data.remittanceAmount / rate
  data.totalMigrationCost = data.totalMigrationCost / rate
  if (data.jobs){
    data.jobs.userSalary = data.jobs.userSalary / rate
  }
  if (data.migrationFees){
    data.migrationFees.forEach(fee => {
      if (fee.subcategoryItems){
        fee.subcategoryItems.forEach(sub =>{
          sub.userValue = sub.userValue / rate
        })
      }
    })
  }
  return data
}

async function insertUserBudgetCalculator(req, res, next) {
  const exRate = await budgetCalculatorSvc.getExchangeRate(req.params.currency)
  const reqData = convertUserData(req.body, exRate)
  const data = await userBudgetCalculatorSvc.create(reqData)
  res.json(convertMasterData(data, exRate))
}

async function createNewBudgetCalculator(req, res, next){
  await budgetCalculatorSvc.createNewBudgetCalculator(req.body);
  res.json({success:true});
}

async function deleteBudgetCalculatorById(req, res, next){
  await budgetCalculatorSvc.deleteUserBudgetCalculator(req.params.Id);
  res.json({success:true});
}

async function getAllUserBudgetCalculator(req, res, next) {
  const data = await userBudgetCalculatorSvc.getAll()
  res.json(data)
}

async function getMasterDataForMigrationCost(req, res, next){
  const exRate = await budgetCalculatorSvc.getExchangeRate(req.params.currency)
  const data = await userBudgetCalculatorSvc.calculateMigrationCost()
  res.json({migrationCost: data * exRate})
}

async function deleteUserBudgetCalculator(req, res, next){
  await userBudgetCalculatorSvc.deleteAll()
  res.json({success: true})
}

async function getExchangeRate(req, res, next){
  const data = await budgetCalculatorSvc.getAllExchangeRate()
  res.json(data)
}

async function createNewExchangeRate(req, res, next){
  await budgetCalculatorSvc.createNewExchangeRate(req.body);
  res.json({success: true});
}

async function deleteExchangeRateById(req, res, next){
  await budgetCalculatorSvc.deleteExchangeRate(req.params.Id);
  res.json({success: true});
}

module.exports = {
    getAllBudgetCalculator,
    insertUserBudgetCalculator,
    getAllUserBudgetCalculator,
    getMasterDataForMigrationCost,
    deleteUserBudgetCalculator,
    getExchangeRate,
    createNewBudgetCalculator,
    deleteBudgetCalculatorById,
    createNewExchangeRate,
    deleteExchangeRateById
}
