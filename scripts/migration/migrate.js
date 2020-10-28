const _ = require('lodash')
const mongoist = require('mongoist');
const db = mongoist("mongodb://localhost:27017/diginex-trust",)
debug = 1
// {formId:{$ne:null}}

// Param: Form
// Param: tempalteKey (1st time or any subsequent times)
// return template with the templateId and array of questionIds
// per user(space)

function dateTypeHandling(input){
  const dateMapping = {
    "30 July 1968": "1968-07-30",
    "14/11/73": "1973-11-14",
    "26-9-2021": "2021-09-26",
    "22 April 2029": "2029-04-22",
    "09 July 2020": "2020-07-09",
    "12/7/2022": "2022-07-12",
    "30 March 2020": "2020-03-30",
    "8/11/2021": "2021-11-08",
    "27-3-2005": "2005-03-27",
    "1 october 2015": "2015-10-01",
    "JANUARY051975": "1975-01-05",
    "24JAN2028": "2028-01-24",
    "28JAN2001": "2001-01-28",
    "31jan2009": "2009-01-31"
  }
  let dateFields = [
    "Employment Start Date (DD/MM/YYYY)",
    "Visa Expiry Date (DD/MM/YYYY)",
    "CPR Expiry Date (DD/MM/YYYY)",
    "Passport Expiry Date (DD/MM/YYYY)",
    "Birth Date (DD/MM/YYYY)",
  ]
  let value
  if (dateFields.indexOf(input.label) != -1) {
    let inputvalue = JSON.parse(input.value)
    if (inputvalue !== null && inputvalue !== '') {
      if (inputvalue.replace(/\D/g,'').length == 8) {
        let tempDate = inputvalue.replace(/\D/g,'')
        value = tempDate.substring(4,) + '-' + tempDate.substring(2,4) + '-' + tempDate.substring(0,2)
        const oldStr = String(JSON.parse(input.value))
        if (JSON.parse(input.value) && (!value || oldStr.substr(oldStr.length - 4) !== value.substr(0,4))) {
          console.log('Mismatch input.value', input.value, value);
        }
      } else {
        value = dateMapping[inputvalue] ? dateMapping[inputvalue] : false
      }
    }
    if (value === false || (!value && input.value)) {
      console.log(`date: ${inputvalue}-${input.value}-${value}`);
    }
    return {
      ...input,
      value: JSON.stringify(value),
      type: "date"
    }
  } else {
    return input
  }
}

function questionSanitizer(input){
  const dateLabelSuffix = " \\(DD/MM/YYYY\\)"
  return newinput = {
    ...input,
    label: String(input.label).replace(new RegExp(dateLabelSuffix + '$'), '')
  }
}

function nationalityTypeHandling(input) {
  let country_mapping = {
    indian: 'India',
    india: 'India',
    'indian ': 'India',
    pakistan: 'Pakistan',
    pakistani: 'Pakistan',
    filipino: 'Philippines',
    philippines: 'Philippines',
    ethiopian: 'Ethiopia',
    bengladesh: 'Bangladesh',
    bangladesh: 'Bangladesh',
    bengladeshi: 'Bangladesh',
    bangaladesh: 'Bangladesh'
  }
  if (input.label == "Nationality / Citizenship") {
    let value = JSON.parse(input.value)
    if (value) {
      value = country_mapping[value.toLowerCase()] ? country_mapping[value.toLowerCase()] : false
      // console.log('value2', value);
    }
    if (input.value !== null && !value){
      console.log('country: Not matched input.value', input.value, value);
    }
    return {
      ...input,
      value: JSON.stringify(value),
      type: "country"
    }
  }
  return input
}
async function getTemplateByForm(space, form, userId) {
  const inputs = form.inputs.map(nationalityTypeHandling).map(dateTypeHandling).map(questionSanitizer)
  const templateKey = String(inputs.map(input => {
    return input.label
  }))

  let formInputs
  let _space = space
  if (!_space[templateKey]) {
    const questionIds = inputs.map(input => {
      return mongoist.ObjectId()
    })

    formInputs = inputs.map((input, index) => {
      return {
        ...input,
        _id: questionIds[index]
      }
    })

    const templateInputs = formInputs.map((input, index) => {
      return {
        ...input,
        value: null,
      }
    })

    let version = Object.keys(_space).length > 0 ? ` (${Object.keys(_space).length})` : ''
    const name = `Coca Cola Contract - EN${version}`
    let templateId = mongoist.ObjectId()
    let template = {
      _id: templateId,
      userId,
      name,
      inputs: templateInputs,
    }
    const t = await db.templates.insertOne(template)

    _space = {
      ..._space,
      [templateKey]: {
        templateId,
        questionIds,
        count: 1
      }
    }
  } else {
    _space[templateKey].count = _space[templateKey].count + 1
    const questionIds = _space[templateKey].questionIds
    formInputs = inputs.map((input, index) => {
      return {
        ...input,
        _id: questionIds[index]
      }
    })
  }
  return [_space[templateKey].templateId, formInputs, _space]
}

async function cleanUp() {
  return await db.files.remove({fullpath: '/'})
}

async function userDateToTimestamp() {
  const users = await db.users.find()
  await Promise.all(users.map(async user => {
    let createdAt, expiresAt
    if (user.createdAt instanceof Date) {
      createdAt = user.createdAt.getTime()
    }
    if (user.expiresAt instanceof Date) {
      expiresAt = user.expiresAt.getTime()
    }
    if (expiresAt || createdAt) {
      await db.users.findAndModify({query: {_id: user._id}, update: {$set: {createdAt, expiresAt}}})
    }
  }))
}

async function dateToTimestamp(collection, field) {
  const docs = await db[collection].find()
  await Promise.all(docs.map(async doc => {
    if ( doc[field] instanceof Date) {
      let ts = doc[field].getTime()
      await db[collection].findAndModify({query: {_id: doc._id}, update: {$set: {[field]:ts}}})
    }
  }))
}


async function main() {
  await dateToTimestamp('users', 'createdAt')
  await dateToTimestamp('users', 'expiresAt')

  await dateToTimestamp('otps', 'createdAt')

  await dateToTimestamp('histories', 'date')

  await dateToTimestamp('forms', 'dateCreated')
  await dateToTimestamp('forms', 'dateReceived')
  await dateToTimestamp('forms', 'dateFilled')

  await dateToTimestamp('files', 'uploaded')


  // await userDateToTimestamp()
  const users = await db.users.find()
  let promises = await Promise.all(users.map(async user => {
    let space = {}
    // email = 'employer.emin@gmail.com'
    let email = 'mmenon@coca-cola.com.bh'
    if (user.email != email) {
      // return
    }
    let result = await cleanUp()
    const files = await db.files.find({user: user._id})
    if (files.length) {
      const _files = files.map(f => {
        if (!f.isFolder){
          return f._id
        }
      }).filter(i => i)

      const sharings = await db.sharings.find({fileId: { $in: _files}, formId: {$ne: null}})

      for(const share of sharings) {
        let sharingId = share._id
        let formIds = share.formId
        const forms = await db.forms.find({_id: {$in: formIds}})
        for (const form of forms) {
          if (!form.templateId || debug) {
            let templateId, formsInput
            [templateId, formsInput, space ]= await getTemplateByForm(space, form, user._id)
            let newForm = await db.forms.findAndModify({query: {_id: form._id}, update: {$set: {templateId, inputs: formsInput, sharingId}}})
          }
        }
      }
      if (sharings.length){
        console.log("Current User: ",user,  `# of files:`, _files.length,  `# of actions: ${sharings.length}`, space)
      }
    }
  }))
  console.log('exiting');
  process.exit(22)
}

main()
