var compression = require('compression')
var express = require('express')
var config = require('./config')
var log = require('./helper/logger.js').log
var mongoose = require('mongoose')
var app = express()
var bodyParser = require('body-parser')
var models = require('./models/db')
var controller = require('./controllers')
var jwt = require('./middleware/jwt')
var cors = require('cors')
var morgan = require('morgan')
var stampWorker = require('./helper/stampWorker')
const { EmailCronService } = require('./helper/emailCronService')
const helmet = require('helmet')
const corsOptions = require('./helper/corsHandler').corsOptions
const requestTracker = require('./middleware/requestTracker').requestTracker
const errors = require('./helper/errors.js')
const { actionThenCatch, errHandler } = require('./middleware/errorHandler')
const router = require('./router')
const errorNotifier = require('./helper/errorNotifier')
var favicon = require('serve-favicon')
require('./auth/auth')
require('./models/spaceModel')
const spaceModel = mongoose.model('space')
const {ChecklistService} = require('./services/checklistSvc')
const videoFilterSvc = require('./services/videoFilterSvc')
const videoSvc = require('./services/videoSvc')
const budgetCalculatorSvc = require('./services/budgetCalculatorSvc')
const seabookSvc = require('./services/seabookSvc')
const surveySvc = require('./services/surveySvc')
var cron = require('node-cron')
const smartContractService = require('./services/smartContract')

var isProduction = process.env.APP_ENV === 'production'
var port = process.env.NODE_PORT || 3000

process.on('uncaughtException', function (err, origin) {
  errorNotifier.send(err)
  console.log('uncaughtException:', err)
})

process.on('unhandledRejection', function (reason, promise) {
  errorNotifier.send(reason)
  console.log('Unhandled Rejection:', reason)
})

if (!isProduction) {
  mongoose.set('debug', process.env.NODE_DEBUG || config.debug)
}

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(config.morganFormat))
}

app.use(compression())
app.use(helmet())
app.use(cors(corsOptions))
const maxLimit = '30mb'
app.use(
  bodyParser.urlencoded({
    limit: maxLimit,
    extended: true,
  })
)
app.use(
  bodyParser.json({
    limit: maxLimit,
  })
)
app.use(favicon(__dirname + '/static/favicon.ico'))
app.get('/healthz', function (req, res) {
  res.send('API OK')
})

app.get('/.well-known/assetlinks.json', function (req, res) {
  res.sendFile(__dirname + '/static/assetlinks.json');
})

app.use(requestTracker)
app.use(router)
app.get('/authhealthz', function (req, res) {
  res.send(req.decoded)
})
app.use(errHandler)

mongoose.connection.on('error', function (err) {
  console.log('Mongoose default connection has occured ' + err + ' error')
})

mongoose.connection.on('disconnected', function () {
  console.log('Mongoose default connection is disconnected')
  setTimeout(() => process.exit(1), 2000)
})

mongoose.connection.on('connected', async function () {
  console.log('Mongoose default connection is opened')
  await loadEnv()
  console.log('Mongoose seed master data: start')
  console.log('Seeding default private space...')
  let space = await spaceModel.findOne({isPrivate: true})
  if (!space) {
    let defaultSpace = {
      name:'Default Private Space',
      isPrivate: true
    }
    space = await spaceModel.create(defaultSpace)
  }
  console.log('Seeding default document types...')
  let checklistSvc = new ChecklistService()
  await checklistSvc.ensureDefaultDocumentTypes(space._id)

  console.log('Seeding default video filters...')
  await videoFilterSvc.ensureDefaultVideoFilters()

  console.log('Seeding default videos...')
  await videoSvc.ensureDefaultVideos()

  console.log('Seeding default budget calculator...')
  await budgetCalculatorSvc.ensureDefaultBudgetCalculators()

  console.log('Seeding default exchange rate...')
  await budgetCalculatorSvc.ensureDefaultExchangeRates()

  console.log('Seeding default seabook...')
  await seabookSvc.ensureChecklistCategory()
  await seabookSvc.ensureChecklistDocument()
  await seabookSvc.ensureDocumentPath()

  console.log('Mongoose seed master data: end')

  var server = app.listen(port, () => {
    log.info(`App listening on port ${port}`)
    if (process.env.APP_ENV !== 'local') {
      stampWorker.start()
    }
    var cronJob = cron.schedule(config.cronJobDate, () =>  {
      smartContractService.uploadToBlockChain()
    });
    cronJob.start();

    new EmailCronService()
  })
})

mongoose.connect(config.mongodb.url, { useNewUrlParser: true, useCreateIndex: true }).catch((error) => {
  console.log('-----------exiting-----------', error)
  setTimeout(() => process.exit(1), 2000)
})

async function loadEnv() {
  const { ExtAppService } = require('./services/extAppSvc');
  const extAppSvc = ExtAppService.getInstance()
  const appPubKeys = await extAppSvc.readAppPubKey()
  appPubKeys.forEach(ele => {
    process.env[`pubkey_${ele.applicationId}`] = ele.pubKey
  });
}

module.exports = app
