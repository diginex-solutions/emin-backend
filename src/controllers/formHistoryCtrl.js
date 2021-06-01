var formHistorySvc = require('../services/formHistorySvc')
let fileSvc = require('../services/fileSvc')
var pdfSvc = require('../services/pdfSvc')
var router = require('express').Router()
var resMapper = require('../helper/resMapper.js')
var log = require('../helper/logger.js').log

async function listFormHistoriesByFormId(req, res, next) {
  const history = await formHistorySvc.getHistoryByFormId(req.body.RESERVED_USID, req.params.formId)
  res.json(history)
}

module.exports = {
  listFormHistoriesByFormId,
}
