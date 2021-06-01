var log = require('../helper/logger.js').log
var resMapper = require('../helper/resMapper.js')
var fileSvc = require('../services/fileSvc')
var router = require('express').Router()
const errors = require('../helper/errors')
const constants = require('../constants')

async function createFolder(req, res, next) {
  if (req.body.path) {
    const isReveresedItself = constants.isReservedPath(req.body.path)
    if (!isReveresedItself) {
      // allow create '/Archived', '/Shared'
      const validated = fileSvc.reservedPathValidation(req.body.path)
    }
    let [folderRes, errMsg] = await fileSvc.createFolder(req.body.RESERVED_USID, req.body.path, req.time)
    if (errMsg) {
      errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
    } else {
      res.json(resMapper.filesView(folderRes, req.decoded))
    }
  } else {
    errors.makeMessage(res, errors.invalidRequestPayload, 'path field is required')
  }
}

async function deleteFolder(req, res, next) {
  if (req.body.path) {
    const validated = fileSvc.reservedPathValidation(req.body.path)
    let [folderRes, errMsg] = await fileSvc.deleteFolder(req.body.RESERVED_USID, req.body.path)
    if (errMsg) {
      errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
    } else {
      res.json(resMapper.filesView(folderRes, req.decoded))
    }
  } else {
    errors.makeMessage(res, errors.invalidRequestPayload, 'path field is required')
  }
}

let moveOrRename = (fn) => {
  return async (req, res, next) => {
    let documents = req.body.documents
    let pathAfter = req.body.pathAfter
    let [folderRes, errMsg] = await fn(req.body.RESERVED_USID, documents, pathAfter)
    if (errMsg) {
      errors.makeMessage(res, errors.invalidRequestPayload, errMsg)
    } else {
      if (folderRes.success) {
        res.json(folderRes)
      } else {
        res.status(422)
        res.json(folderRes)
      }
    }
  }
}

router.put('/move', moveOrRename(fileSvc.updateDir))
router.put('/rename', moveOrRename(fileSvc.renameDir))

module.exports = {
  createFolder,
  deleteFolder,
  moveOrRename,
}
