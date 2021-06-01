var historySvc = require('../services/historySvc')
let fileSvc = require('../services/fileSvc')
var pdfSvc = require('../services/pdfSvc')
var router = require('express').Router()
var resMapper = require('../helper/resMapper.js')
var log = require('../helper/logger.js').log

async function listHistories(req, res, next) {
  var history = await historySvc.getHistoryByUser(req.body.RESERVED_USID)
  res.json(resMapper.histories(history, req.decoded))
}

async function listHistoriesByFileId(req, res, next) {
  const history = await historySvc.getHistoryByFileId(req.body.RESERVED_USID, req.params.accessId)
  if (req.query.pdf === 'true' || req.query.pdf === true) {
    const file = await fileSvc.retrieveMyAccessById(req.params.accessId, req.body.RESERVED_USID)
    await pdfSvc.generatePdf(file, resMapper.histories(history, req.decoded), req.query.app, res)
  } else {
    res.json(resMapper.histories(history, req.decoded))
  }
}

module.exports = {
  listHistories,
  listHistoriesByFileId,
}
