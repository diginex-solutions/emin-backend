const config = require('../config')

const { Aborter, BlobURL, StorageURL, SharedKeyCredential } = require('@azure/storage-blob')
var crypto = require('crypto')
const credentials = new SharedKeyCredential(config.azure.storage.accountName, config.azure.storage.accountKey)

const pipeline = StorageURL.newPipeline(credentials)

let sha256sumStream = async (readableStream) => {
  return new Promise((resolve, reject) => {
    var sha256sum = crypto.createHash('sha256')
    readableStream.on('data', (data) => {
      sha256sum.update(data)
    })
    readableStream.on('end', () => {
      resolve(sha256sum.digest('hex'))
    })
    readableStream.on('error', reject)
  })
}

let downloadAndHash = async (url) => {
  const blobURL = new BlobURL(url, pipeline)
  const downloadBlockBlobResponse = await blobURL.download(Aborter.none, 0)
  return await sha256sumStream(downloadBlockBlobResponse.readableStreamBody)
}

module.exports = {
  sha256sumStream,
  downloadAndHash,
}
