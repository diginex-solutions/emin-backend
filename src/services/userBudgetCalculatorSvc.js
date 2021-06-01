module.exports = {}
var mongoose = require('mongoose')
const UserBudgetCalculator = mongoose.model('UserBudgetCalculator')
const BudgetCalculator = mongoose.model('BudgetCalculator')

const trimmedMean = (arr) =>{
    arr = arr.filter(x=>x !== null && x !== 0)
    if (arr.length == 0) return 0
    if (arr.length == 1) return arr[0]
    if (arr.length == 2) return (arr[0] + arr[1]) / 2
    const sort = arr.sort(function(a, b){return a-b})
    //console.log("list: " + JSON.stringify(sort)) 
    var no = Math.round(0.1 * arr.length)
    //console.log("no: " + no)
    let sum = 0
    for(let i = no; i< sort.length-no; i++){
        sum += sort[i]
    }
    //console.log("sum: " + sum)
    return sum / (arr.length - 2 * no)
}

const create = async (params) =>{
    //insert data to user budget calculator table
    let userData = {
        _id: mongoose.Types.ObjectId(),
        countryName: params.countryName,
        countryCode: params.countryCode,
        migrationFees : params.migrationFees,
        jobs: params.jobs,
        loanAmount: params.loanAmount,
        loanTenure: params.loanTenure,
        loanInterestRate: params.loanInterestRate,
        remittanceAmount: params.remittanceAmount,
        totalMigrationCost: params.totalMigrationCost,
    }
    await UserBudgetCalculator.newData(userData)

    //update master table for migration
    let masterData = await BudgetCalculator.getByCountryCode(params.countryCode)
    if (masterData){
        const lstData = await UserBudgetCalculator.getByCountryCode(params.countryCode)
        let lstMigrationFees = []
        lstData.forEach(item => {
            lstMigrationFees.push.apply(lstMigrationFees, item.migrationFees)
        });
        let migrationFees = []
        lstMigrationFees.forEach(item => {
            let existed = migrationFees.find(x=> x.categoryCode == item.categoryCode)
            if (!existed){
                migrationFees.push(item)
            } else{
                existed.subcategoryItems.push.apply(existed.subcategoryItems, item.subcategoryItems)
            }
        });

        //update migration cost
        const sumMigrationCost = lstData.map(x=>x.totalMigrationCost)
        masterData.migrationAverageCost = trimmedMean(sumMigrationCost)

        //update migration fee
        masterData.migrationFees.forEach(category =>{
            const categories = migrationFees.find(x=>x.categoryCode === category.categoryCode)
            if (categories){
                const lstSub = categories.subcategoryItems
                category.subcategoryItems.forEach(subCategory => {
                    const lstSubUser = lstSub.filter(x=>x.subCategoryCode === subCategory.subCategoryCode)
                    if (lstSubUser && lstSubUser.length){
                        const arr = lstSubUser.map(x=>x.userValue)
                        //console.log(subCategory.subCategoryCode + ": " + JSON.stringify(arr))
                        subCategory.averageValue = trimmedMean(arr)
                    }
                })
            }
        })
    }
    await BudgetCalculator.update(masterData)

    //update master data for jobs
    if (params.jobs && params.jobs.countryCode){
        let masterDataJob = await BudgetCalculator.getByCountryCode(params.jobs.countryCode)
        if (masterDataJob){
            const lstJobs = await UserBudgetCalculator.getJobsByCountryCode(params.jobs.countryCode)
            let jobs = []
            lstJobs.forEach(item => {
                let j = []
                j.push(item.jobs)
                jobs.push.apply(jobs, j)
            });
            //console.log(jobs)
            //update jobs
            masterDataJob.jobs.forEach(item => {
                const lstJob = jobs.filter(x=>x.jobId === item.jobId)
                if (lstJob && lstJob.length){
                    const arr = lstJob.map(x=>x.userSalary)
                    //console.log(arr)
                    item.averageSalary = trimmedMean(arr)
                }
            })
        }
        await BudgetCalculator.update(masterDataJob)
    }

    //return master data
    const result = await BudgetCalculator.getAll()
    return result
}

const getAll = async () =>{
    const data = await UserBudgetCalculator.getAll()
    return data
}

const calculateMigrationCost = async ()=>{
    const migrationCost = await UserBudgetCalculator.getListMigrationCost()
    const arr = migrationCost.map(x=>x.totalMigrationCost)
    //console.log(arr)
    return trimmedMean(arr)
}

const deleteAll = async ()=>{
    await UserBudgetCalculator.deleteAll()
}

module.exports.create = create
module.exports.getAll = getAll
module.exports.calculateMigrationCost = calculateMigrationCost
module.exports.deleteAll = deleteAll