module.exports = {}
var mongoose = require('mongoose')
const BudgetCalculator = mongoose.model('BudgetCalculator')
const UserBudgetCalculator = mongoose.model('UserBudgetCalculator')
const ExchangeRate = mongoose.model('ExchangeRate')
const axios = require('axios').default
const cError = require('../helper/customError')

const getAll = async () =>{
    let result = await BudgetCalculator.getAll()
    return result
}

const ensureDefaultBudgetCalculators = async() => {
    const defaultData = [
        {
            countryName: "Qatar",
            countryCode: "qatar",
            description: "qatar_description",
            migrationAverageCost: 12,
            migrationFees : [
                {
                    categoryName: "Passport",
                    categoryCode: "passport",
                    subcategoryItems:[
                        {
                            subCategoryName: "Administrative Costs",
                            subCategoryCode: "administrative_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 33.6625673,
                        }
                    ]
                },
                {
                    categoryName: "Visa",
                    categoryCode: "visa",
                    subcategoryItems:[
                        {
                            subCategoryName: "Administrative Costs",
                            subCategoryCode: "administrative_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 112.0563116,
                        }
                    ]
                },
                {
                    categoryName: "Training",
                    categoryCode: "training",
                    subcategoryItems:[
                        {
                            subCategoryName: "Orientation / training costs",
                            subCategoryCode: "training_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 119.487347,
                        }
                    ]
                },
                {
                    categoryName: "Medical",
                    categoryCode: "medical",
                    subcategoryItems:[
                        {
                            subCategoryName: "Medical Costs",
                            subCategoryCode: "medical_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 82.3974908,
                        }
                    ]
                },
                {
                    categoryName: "Airfare",
                    categoryCode: "airfare",
                    subcategoryItems:[
                        {
                            subCategoryName: "Flight Travel Costs",
                            subCategoryCode: "travel_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 226.596702,
                        }
                    ]
                },
                {
                    categoryName: "Recruitment Agent",
                    categoryCode: "recruitment_agent",
                    subcategoryItems:[
                        {
                            subCategoryName: "Recruitment Service Fee",
                            subCategoryCode: "recruitment_service_fee",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 340.2990132,
                        }
                    ]
                },
                {
                    categoryName: "Total Costs",
                    categoryCode: "total_costs",
                    subcategoryItems:[
                        {
                            subCategoryName: "Total Costs",
                            subCategoryCode: "total_costs",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 3855.80,
                        }
                    ]
                }
            ],
            jobs: [
                {
                    jobName: "Other",
                    jobId: "other",
                    averageSalary: 0,
                },
                {
                    jobName: "Domestic",
                    jobId: "domestic",
                    averageSalary: 0,
                },
                {
                    jobName: "Garment",
                    jobId: "garment",
                    averageSalary: 0,
                },
                {
                    jobName: "Construction",
                    jobId: "construction",
                    averageSalary: 0,
                },
                {
                    jobName: "Hospitality",
                    jobId: "hospitality",
                    averageSalary: 0,
                },
                {
                    jobName: "Manufacturing",
                    jobId: "manufacturing",
                    averageSalary: 0,
                },
                {
                    jobName: "Cleaning",
                    jobId: "cleaning",
                    averageSalary: 0,
                },
                {
                    jobName: "Driver",
                    jobId: "driver",
                    averageSalary: 0,
                },
                {
                    jobName: "Agriculture",
                    jobId: "agriculture",
                    averageSalary: 0,
                },
                {
                    jobName: "SalesPerson",
                    jobId: "salesperson",
                    averageSalary: 0,
                }
            ]
        },
        {
            countryName: "Kuwait",
            countryCode: "kuwait",
            description: "kuwait_description",
            migrationAverageCost: 12,
            migrationFees : [
                {
                    categoryName: "Passport",
                    categoryCode: "passport",
                    subcategoryItems:[
                        {
                            subCategoryName: "Administrative Costs",
                            subCategoryCode: "administrative_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 33.6625673,
                        }
                    ]
                },
                {
                    categoryName: "Visa",
                    categoryCode: "visa",
                    subcategoryItems:[
                        {
                            subCategoryName: "Administrative Costs",
                            subCategoryCode: "administrative_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Training",
                    categoryCode: "training",
                    subcategoryItems:[
                        {
                            subCategoryName: "Orientation / training costs",
                            subCategoryCode: "training_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Medical",
                    categoryCode: "medical",
                    subcategoryItems:[
                        {
                            subCategoryName: "Medical Costs",
                            subCategoryCode: "medical_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 53.55496778,
                        }
                    ]
                },
                {
                    categoryName: "Airfare",
                    categoryCode: "airfare",
                    subcategoryItems:[
                        {
                            subCategoryName: "Flight Travel Costs",
                            subCategoryCode: "travel_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Recruitment Agent",
                    categoryCode: "recruitment_agent",
                    subcategoryItems:[
                        {
                            subCategoryName: "Recruitment Service Fee",
                            subCategoryCode: "recruitment_service_fee",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 822.15,
                        }
                    ]
                },
                {
                    categoryName: "Total Costs",
                    categoryCode: "total_costs",
                    subcategoryItems:[
                        {
                            subCategoryName: "Total Costs",
                            subCategoryCode: "total_costs",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 4181.25,
                        }
                    ]
                }
            ],
            jobs: [
                {
                    jobName: "Other",
                    jobId: "other",
                    averageSalary: 0,
                },
                {
                    jobName: "Domestic",
                    jobId: "domestic",
                    averageSalary: 0,
                },
                {
                    jobName: "Garment",
                    jobId: "garment",
                    averageSalary: 0,
                },
                {
                    jobName: "Construction",
                    jobId: "construction",
                    averageSalary: 0,
                },
                {
                    jobName: "Hospitality",
                    jobId: "hospitality",
                    averageSalary: 0,
                },
                {
                    jobName: "Manufacturing",
                    jobId: "manufacturing",
                    averageSalary: 0,
                },
                {
                    jobName: "Cleaning",
                    jobId: "cleaning",
                    averageSalary: 0,
                },
                {
                    jobName: "Driver",
                    jobId: "driver",
                    averageSalary: 0,
                },
                {
                    jobName: "Agriculture",
                    jobId: "agriculture",
                    averageSalary: 0,
                },
                {
                    jobName: "SalesPerson",
                    jobId: "salesperson",
                    averageSalary: 0,
                }
            ]
        },
        {
            countryName: "Bahrain",
            countryCode: "bahrain",
            description: "bahrain_description",
            migrationAverageCost: 12,
            migrationFees : [
                {
                    categoryName: "Passport",
                    categoryCode: "passport",
                    subcategoryItems:[
                        {
                            subCategoryName: "Administrative Costs",
                            subCategoryCode: "administrative_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 33.6625673,
                        }
                    ]
                },
                {
                    categoryName: "Visa",
                    categoryCode: "visa",
                    subcategoryItems:[
                        {
                            subCategoryName: "Administrative Costs",
                            subCategoryCode: "administrative_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 55.20699909,
                        }
                    ]
                },
                {
                    categoryName: "Training",
                    categoryCode: "training",
                    subcategoryItems:[
                        {
                            subCategoryName: "Orientation / training costs",
                            subCategoryCode: "training_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Medical",
                    categoryCode: "medical",
                    subcategoryItems:[
                        {
                            subCategoryName: "Medical Costs",
                            subCategoryCode: "medical_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 53.55496778,
                        }
                    ]
                },
                {
                    categoryName: "Airfare",
                    categoryCode: "airfare",
                    subcategoryItems:[
                        {
                            subCategoryName: "Flight Travel Costs",
                            subCategoryCode: "travel_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Recruitment Agent",
                    categoryCode: "recruitment_agent",
                    subcategoryItems:[
                        {
                            subCategoryName: "Recruitment Service Fee",
                            subCategoryCode: "recruitment_service_fee",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 752.85,
                        }
                    ]
                },
                {
                    categoryName: "Total Costs",
                    categoryCode: "total_costs",
                    subcategoryItems:[
                        {
                            subCategoryName: "Total Costs",
                            subCategoryCode: "total_costs",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 4181.25,
                        }
                    ]
                }
            ],
            jobs: [
                {
                    jobName: "Other",
                    jobId: "other",
                    averageSalary: 0,
                },
                {
                    jobName: "Domestic",
                    jobId: "domestic",
                    averageSalary: 0,
                },
                {
                    jobName: "Garment",
                    jobId: "garment",
                    averageSalary: 0,
                },
                {
                    jobName: "Construction",
                    jobId: "construction",
                    averageSalary: 0,
                },
                {
                    jobName: "Hospitality",
                    jobId: "hospitality",
                    averageSalary: 0,
                },
                {
                    jobName: "Manufacturing",
                    jobId: "manufacturing",
                    averageSalary: 0,
                },
                {
                    jobName: "Cleaning",
                    jobId: "cleaning",
                    averageSalary: 0,
                },
                {
                    jobName: "Driver",
                    jobId: "driver",
                    averageSalary: 0,
                },
                {
                    jobName: "Agriculture",
                    jobId: "agriculture",
                    averageSalary: 0,
                },
                {
                    jobName: "SalesPerson",
                    jobId: "salesperson",
                    averageSalary: 0,
                }
            ]
        },
        {
            countryName: "Oman",
            countryCode: "oman",
            description: "oman_description",
            migrationAverageCost: 12,
            migrationFees : [
                {
                    categoryName: "Passport",
                    categoryCode: "passport",
                    subcategoryItems:[
                        {
                            subCategoryName: "Administrative Costs",
                            subCategoryCode: "administrative_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 33.6625673,
                        }
                    ]
                },
                {
                    categoryName: "Visa",
                    categoryCode: "visa",
                    subcategoryItems:[
                        {
                            subCategoryName: "Administrative Costs",
                            subCategoryCode: "administrative_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 24.72216259,
                        }
                    ]
                },
                {
                    categoryName: "Training",
                    categoryCode: "training",
                    subcategoryItems:[
                        {
                            subCategoryName: "Orientation / training costs",
                            subCategoryCode: "training_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Medical",
                    categoryCode: "medical",
                    subcategoryItems:[
                        {
                            subCategoryName: "Medical Costs",
                            subCategoryCode: "medical_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 53.55496778,
                        }
                    ]
                },
                {
                    categoryName: "Airfare",
                    categoryCode: "airfare",
                    subcategoryItems:[
                        {
                            subCategoryName: "Flight Travel Costs",
                            subCategoryCode: "travel_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 269.29,
                        }
                    ]
                },
                {
                    categoryName: "Recruitment Agent",
                    categoryCode: "recruitment_agent",
                    subcategoryItems:[
                        {
                            subCategoryName: "Recruitment Service Fee",
                            subCategoryCode: "recruitment_service_fee",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 775.95,
                        }
                    ]
                },
                {
                    categoryName: "Total Costs",
                    categoryCode: "total_costs",
                    subcategoryItems:[
                        {
                            subCategoryName: "Total Costs",
                            subCategoryCode: "total_costs",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 2951.14,
                        }
                    ]
                }
            ],
            jobs: [
                {
                    jobName: "Other",
                    jobId: "other",
                    averageSalary: 0,
                },
                {
                    jobName: "Domestic",
                    jobId: "domestic",
                    averageSalary: 0,
                },
                {
                    jobName: "Garment",
                    jobId: "garment",
                    averageSalary: 0,
                },
                {
                    jobName: "Construction",
                    jobId: "construction",
                    averageSalary: 0,
                },
                {
                    jobName: "Hospitality",
                    jobId: "hospitality",
                    averageSalary: 0,
                },
                {
                    jobName: "Manufacturing",
                    jobId: "manufacturing",
                    averageSalary: 0,
                },
                {
                    jobName: "Cleaning",
                    jobId: "cleaning",
                    averageSalary: 0,
                },
                {
                    jobName: "Driver",
                    jobId: "driver",
                    averageSalary: 0,
                },
                {
                    jobName: "Agriculture",
                    jobId: "agriculture",
                    averageSalary: 0,
                },
                {
                    jobName: "SalesPerson",
                    jobId: "salesperson",
                    averageSalary: 0,
                }
            ]
        },
        {
            countryName: "Saudi Arabia",
            countryCode: "saudi_arabia",
            description: "saudi_arabia_description",
            migrationAverageCost: 12,
            migrationFees : [
                {
                    categoryName: "Passport",
                    categoryCode: "passport",
                    subcategoryItems:[
                        {
                            subCategoryName: "Administrative Costs",
                            subCategoryCode: "administrative_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 33.6625673,
                        }
                    ]
                },
                {
                    categoryName: "Visa",
                    categoryCode: "visa",
                    subcategoryItems:[
                        {
                            subCategoryName: "Administrative Costs",
                            subCategoryCode: "administrative_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Training",
                    categoryCode: "training",
                    subcategoryItems:[
                        {
                            subCategoryName: "Orientation / training costs",
                            subCategoryCode: "training_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Medical",
                    categoryCode: "medical",
                    subcategoryItems:[
                        {
                            subCategoryName: "Medical Costs",
                            subCategoryCode: "medical_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 53.55496778,
                        }
                    ]
                },
                {
                    categoryName: "Airfare",
                    categoryCode: "airfare",
                    subcategoryItems:[
                        {
                            subCategoryName: "Flight Travel Costs",
                            subCategoryCode: "travel_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Recruitment Agent",
                    categoryCode: "recruitment_agent",
                    subcategoryItems:[
                        {
                            subCategoryName: "Recruitment Service Fee",
                            subCategoryCode: "recruitment_service_fee",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 1270.41,
                        }
                    ]
                },
                {
                    categoryName: "Total Costs",
                    categoryCode: "total_costs",
                    subcategoryItems:[
                        {
                            subCategoryName: "Total Costs",
                            subCategoryCode: "total_costs",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 4180.45,
                        }
                    ]
                }
            ],
            jobs: [
                {
                    jobName: "Other",
                    jobId: "other",
                    averageSalary: 0,
                },
                {
                    jobName: "Domestic",
                    jobId: "domestic",
                    averageSalary: 0,
                },
                {
                    jobName: "Garment",
                    jobId: "garment",
                    averageSalary: 0,
                },
                {
                    jobName: "Construction",
                    jobId: "construction",
                    averageSalary: 0,
                },
                {
                    jobName: "Hospitality",
                    jobId: "hospitality",
                    averageSalary: 0,
                },
                {
                    jobName: "Manufacturing",
                    jobId: "manufacturing",
                    averageSalary: 0,
                },
                {
                    jobName: "Cleaning",
                    jobId: "cleaning",
                    averageSalary: 0,
                },
                {
                    jobName: "Driver",
                    jobId: "driver",
                    averageSalary: 0,
                },
                {
                    jobName: "Agriculture",
                    jobId: "agriculture",
                    averageSalary: 0,
                },
                {
                    jobName: "SalesPerson",
                    jobId: "salesperson",
                    averageSalary: 0,
                }
            ]
        },
        {
            countryName: "United Arab Emirates",
            countryCode: "uae",
            description: "uae_description",
            migrationAverageCost: 12,
            migrationFees : [
                {
                    categoryName: "Passport",
                    categoryCode: "passport",
                    subcategoryItems:[
                        {
                            subCategoryName: "Administrative Costs",
                            subCategoryCode: "administrative_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 33.6625673,
                        }
                    ]
                },
                {
                    categoryName: "Visa",
                    categoryCode: "visa",
                    subcategoryItems:[
                        {
                            subCategoryName: "Administrative Costs",
                            subCategoryCode: "administrative_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 153.259916,
                        }
                    ]
                },
                {
                    categoryName: "Training",
                    categoryCode: "training",
                    subcategoryItems:[
                        {
                            subCategoryName: "Orientation / training costs",
                            subCategoryCode: "training_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Medical",
                    categoryCode: "medical",
                    subcategoryItems:[
                        {
                            subCategoryName: "Medical Costs",
                            subCategoryCode: "medical_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 53.55496778,
                        }
                    ]
                },
                {
                    categoryName: "Airfare",
                    categoryCode: "airfare",
                    subcategoryItems:[
                        {
                            subCategoryName: "Flight Travel Costs",
                            subCategoryCode: "travel_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 292.28,
                        }
                    ]
                },
                {
                    categoryName: "Recruitment Agent",
                    categoryCode: "recruitment_agent",
                    subcategoryItems:[
                        {
                            subCategoryName: "Recruitment Service Fee",
                            subCategoryCode: "recruitment_service_fee",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 829.84,
                        }
                    ]
                },
                {
                    categoryName: "Total Costs",
                    categoryCode: "total_costs",
                    subcategoryItems:[
                        {
                            subCategoryName: "Total Costs",
                            subCategoryCode: "total_costs",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 4181.25,
                        }
                    ]
                }
            ],
            jobs: [
                {
                    jobName: "Other",
                    jobId: "other",
                    averageSalary: 0,
                },
                {
                    jobName: "Domestic",
                    jobId: "domestic",
                    averageSalary: 0,
                },
                {
                    jobName: "Garment",
                    jobId: "garment",
                    averageSalary: 0,
                },
                {
                    jobName: "Construction",
                    jobId: "construction",
                    averageSalary: 0,
                },
                {
                    jobName: "Hospitality",
                    jobId: "hospitality",
                    averageSalary: 0,
                },
                {
                    jobName: "Manufacturing",
                    jobId: "manufacturing",
                    averageSalary: 0,
                },
                {
                    jobName: "Cleaning",
                    jobId: "cleaning",
                    averageSalary: 0,
                },
                {
                    jobName: "Driver",
                    jobId: "driver",
                    averageSalary: 0,
                },
                {
                    jobName: "Agriculture",
                    jobId: "agriculture",
                    averageSalary: 0,
                },
                {
                    jobName: "SalesPerson",
                    jobId: "salesperson",
                    averageSalary: 0,
                }
            ]
        },
        {
            countryName: "Others",
            countryCode: "other",
            description: null,
            migrationAverageCost: 12,
            migrationFees : [
                {
                    categoryName: "Passport",
                    categoryCode: "passport",
                    subcategoryItems:[
                        {
                            subCategoryName: "Administrative Costs",
                            subCategoryCode: "administrative_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Visa",
                    categoryCode: "visa",
                    subcategoryItems:[
                        {
                            subCategoryName: "Administrative Costs",
                            subCategoryCode: "administrative_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Training",
                    categoryCode: "training",
                    subcategoryItems:[
                        {
                            subCategoryName: "Orientation / training costs",
                            subCategoryCode: "training_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Medical",
                    categoryCode: "medical",
                    subcategoryItems:[
                        {
                            subCategoryName: "Medical Costs",
                            subCategoryCode: "medical_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Airfare",
                    categoryCode: "airfare",
                    subcategoryItems:[
                        {
                            subCategoryName: "Flight Travel Costs",
                            subCategoryCode: "travel_cost",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Recruitment Agent",
                    categoryCode: "recruitment_agent",
                    subcategoryItems:[
                        {
                            subCategoryName: "Recruitment Service Fee",
                            subCategoryCode: "recruitment_service_fee",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                },
                {
                    categoryName: "Total Costs",
                    categoryCode: "total_costs",
                    subcategoryItems:[
                        {
                            subCategoryName: "Total Costs",
                            subCategoryCode: "total_costs",
                            defaultMin: 1000,
                            defaultMax: 500000,
                            averageValue: 0,
                            ihrbValue: 0,
                        }
                    ]
                }
            ],
            jobs: [
                {
                    jobName: "Other",
                    jobId: "other",
                    averageSalary: 0,
                },
                {
                    jobName: "Domestic",
                    jobId: "domestic",
                    averageSalary: 0,
                },
                {
                    jobName: "Garment",
                    jobId: "garment",
                    averageSalary: 0,
                },
                {
                    jobName: "Construction",
                    jobId: "construction",
                    averageSalary: 0,
                },
                {
                    jobName: "Hospitality",
                    jobId: "hospitality",
                    averageSalary: 0,
                },
                {
                    jobName: "Manufacturing",
                    jobId: "manufacturing",
                    averageSalary: 0,
                },
                {
                    jobName: "Cleaning",
                    jobId: "cleaning",
                    averageSalary: 0,
                },
                {
                    jobName: "Driver",
                    jobId: "driver",
                    averageSalary: 0,
                },
                {
                    jobName: "Agriculture",
                    jobId: "agriculture",
                    averageSalary: 0,
                },
                {
                    jobName: "SalesPerson",
                    jobId: "salesperson",
                    averageSalary: 0,
                }
            ]
        },
    ]
     
    const lst = await BudgetCalculator.getAll()
      if (!lst.length){
        await UserBudgetCalculator.deleteAll()
        defaultData.forEach(async (item) => {
            await BudgetCalculator.upsert(item)
        })
    }
    return true;
}

const createNewBudgetCalculator = async(data)=>{
    if(data.countryName != null && data.countryName != ""){
        data._id = mongoose.Types.ObjectId();
        return await BudgetCalculator.createNew(data);
    }
    else{
        throw new cError.ResourceNotFoundException('BudgetCalculator is null');
    }
}

const deleteUserBudgetCalculator = async(Id) =>{
    const checkExists = await BudgetCalculator.getById(Id);
    if(!checkExists){
        throw new cError.ResourceNotFoundException('BudgetCalculator not found');
    }
    else{
        return await BudgetCalculator.deleteById(Id);
    }
}

const ensureDefaultExchangeRates = async() => {
    const defaultData = [
        {
            "currency": "OMR",
            "rate": 0.465447,
            "date": new Date(2020,12,10)
        },
        {
            "currency": "QAR",
            "rate": 4.402388,
            "date": new Date(2020,12,10)
        },
        {
            "currency": "AED",
            "rate": 4.440426,
            "date": new Date(2020,12,10)
        },
        {
            "currency": "KWD",
            "rate": 0.368863,
            "date": new Date(2020,12,10)
        },
        {
            "currency": "SAR",
            "rate": 4.53521,
            "date": new Date(2020,12,10)
        },
        {
            "currency": "BHD",
            "rate": 0.455917,
            "date": new Date(2020,12,10)
        },
    ]
     
    const lst = await ExchangeRate.getAll()
      if (!lst.length){
        defaultData.forEach(async (item) => {
            await ExchangeRate.upsert(item)
        })
    }

    return true;
}

const getExchangeRate = async(currency) => {
    const exRate = await ExchangeRate.getByCurrency(currency)
    var today = new Date()
    var compareDate = today.setDate(today.getDate() - 1)
    if (exRate && exRate.date >= compareDate) return exRate.exchangeRate

    //call api to get rate currency - USD
    let rate = 1
    if (exRate) rate = exRate.exchangeRate
    const api_key = "-"
    const api_url = "http://data.fixer.io/api/latest?access_key=" +api_key + "&base=EUR&symbols=" + currency
    await axios.get(api_url)
        .then(function (response) {
            rate = response.data.rates[currency]
        })
        .catch(function (error) {
            console.log(error)
        })
        .then(function () {
    });
    const data = {
        currency,
        rate,
        date: new Date()
    }
    await ExchangeRate.upsert(data)
    return rate
}

const createNewExchangeRate = async(data)=>{
    if(data.currency!= null && data.currency != ""){
        data._id = mongoose.Types.ObjectId();
        return await ExchangeRate.createNew(data);
    }
    else{
        throw new cError.ResourceNotFoundException('ExchangeRate is null');
    }
}

const deleteExchangeRate = async(Id)=>{
    const checkExists = await ExchangeRate.getById(Id);
    if(!checkExists){
        throw new cError.ResourceNotFoundException('ExchangeRate not found');
    }
    else{
        return await ExchangeRate.deleteById(Id);
    }
}

const getAllExchangeRate = async() => {
    const data = await ExchangeRate.getAll()
    return data
}

module.exports.getAll = getAll
module.exports.ensureDefaultBudgetCalculators = ensureDefaultBudgetCalculators
module.exports.ensureDefaultExchangeRates = ensureDefaultExchangeRates
module.exports.getExchangeRate = getExchangeRate
module.exports.getAllExchangeRate = getAllExchangeRate
module.exports.createNewBudgetCalculator = createNewBudgetCalculator
module.exports.deleteUserBudgetCalculator = deleteUserBudgetCalculator
module.exports.createNewExchangeRate = createNewExchangeRate
module.exports.deleteExchangeRate = deleteExchangeRate
