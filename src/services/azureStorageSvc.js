var log = require('../helper/logger.js').log
const blobHashHandler = require('../helper/blobHashHandler')
const path = require('path')
const storage = require('azure-storage')
const config = require('../config')
const blobService = storage.createBlobService()
const fs = require('fs')
const util = require('util')
const GetBlobRequestOptions = {
  clientRequestTimeoutInMs: 6000 * 1000, // 500MB / 100kBps = 5000s
  maximumExecutionTimeInMs: 6000 * 1000,
}

async function downloadBlobToStream(containerName, blobName, writeStream) {
  const dowloadFilePath = path.resolve('./' + blobName.replace('.txt', '.downloaded.txt'))

  blobService.getBlobToStream(containerName, blobName, writeStream, (err, data) => {
    if (err) {
      //TODO: better handling for error
      log.error('stream err', err)
      throw err
    } else {
      log.info('stream end', data)
    }
  })
}

function createBlobReadStream(container, file) {
  let stream = blobService.createReadStream(container, file, GetBlobRequestOptions)
  return stream
}

function getBlobLinkSas(container, blobName, permissions, filename) {
  var startDate = new Date()
  startDate.setMinutes(startDate.getMinutes() - 5)
  var expiryDate = new Date(startDate)
  expiryDate.setMinutes(startDate.getMinutes() + 60)

  var sharedAccessPolicy = {
    AccessPolicy: {
      Permissions: permissions || azure.BlobUtilities.SharedAccessPermissions.READ,
      Start: startDate,
      Expiry: expiryDate,
    },
  }
  var contentDisposition = {
    contentDisposition: 'attachment; filename=' + filename,
  }
  var sasToken = blobService.generateSharedAccessSignature(container, blobName, sharedAccessPolicy, contentDisposition)
  return {
    // token: decodeURIComponent(sasToken),
    uri: blobService.getUrl(container, blobName, sasToken, true),
  }
}

async function uploadEmptyFile(blobName) {
  const filePath = `${__dirname}/../static/emptyFile`
  return await uploadOnboardFile(blobName, filePath)
}

async function uploadOnboardFile(blobName, pathToFile) {
  const filePath = pathToFile ? pathToFile : `${__dirname}/../static/Diginex Trust Beta - 1 Pager.pdf`
  const fileRs = fs.createReadStream(filePath);
  const hash = await blobHashHandler.sha256sumStream(fileRs)
  const size = (await util.promisify(fs.stat)(filePath)).size
  try {
    const resp = await new Promise((resolve, reject) => {
      blobService.createBlockBlobFromLocalFile(config.azure.containerName, blobName, filePath, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
    return [resp, size, hash]
  } catch (err) {
    log.error(err)
    throw err
  }
}

module.exports.createBlobReadStream = createBlobReadStream
module.exports.getBlobLinkSas = getBlobLinkSas
module.exports.uploadEmptyFile = uploadEmptyFile
module.exports.uploadOnboardFile = uploadOnboardFile
