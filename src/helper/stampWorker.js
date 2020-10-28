var log = require('../helper/logger.js').log
const config = require('../config')
const rootEtherSender = require('./rootEtherSender')
const blobHashHandler = require('./blobHashHandler')
const jsonHashHandler = require('./jsonHashHandler')

const OpenTimestamps = require('javascript-opentimestamps')
const UrlWhitelist = OpenTimestamps.Calendar.UrlWhitelist
let whitelist = { whitelist: new UrlWhitelist(config.opentimestamps.whitelist) }
var mongoose = require('mongoose')
var File = mongoose.model('File')
var History = mongoose.model('History')

var CronJob = require('cron').CronJob

const state = {
  stamped: 1,
  upgraded: 2,
  uploaded: 3,
  success: 4,
}

let fileStampingWorker = async () => {
  log.info(`***FileStampingWorker started***`)
  var files = await File.listFilesNotStamped()
  var idWithDetaches = await Promise.all(
    files.map(async (item) => {
      if (!item.hash) {
        item.hash = await blobHashHandler.downloadAndHash(item.storage)
        await File.updateFileHash(item.id, item.hash)
      }
      return {
        id: item._id,
        detached: OpenTimestamps.DetachedTimestampFile.fromHash(
          new OpenTimestamps.Ops.OpSHA256(),
          Buffer.from(item.hash, 'hex')
        ),
      }
    })
  )

  let otsHandler = async (idWithDetached) => {
    let detached = idWithDetached.detached
    await File.updateOts(idWithDetached.id, Buffer.from(detached.serializeToBytes(), 'hex'), state.stamped)
  }
  try {
    await stampingWorker(idWithDetaches)
    await Promise.all(idWithDetaches.map(otsHandler)) //commit to DB before next stage
  } catch (err) {
    log.error(err)
  }
  log.info(`***FileStampingWorker ended***`)
}

let histStampingWorker = async () => {
  log.info(`***HistoryStampingWorker started***`)
  var histories = await History.listHistoriesNotStamped()
  var idWithDetaches = await Promise.all(
    histories.map((item) => {
      return {
        id: item._id,
        detached: OpenTimestamps.DetachedTimestampFile.fromHash(
          new OpenTimestamps.Ops.OpSHA256(),
          Buffer.from(jsonHashHandler.historysha256sum(item), 'hex')
        ),
      }
    })
  )

  let otsHandler = async (idWithDetached) => {
    let detached = idWithDetached.detached
    await History.updateFileHash(idWithDetached.id, Buffer.from(detached.fileDigest()).toString('hex'))
    await History.updateOts(idWithDetached.id, Buffer.from(detached.serializeToBytes(), 'hex'), state.stamped)
  }
  try {
    await stampingWorker(idWithDetaches)
    await Promise.all(idWithDetaches.map(otsHandler)) //commit to DB before next stage
  } catch (err) {
    log.error(err)
  }
  log.info(`***HistoryStampingWorker ended***`)
}

let stampingWorker = async (idWithDetaches) => {
  let detaches = idWithDetaches.map((item) => item.detached)
  let options = { calendars: config.opentimestamps.calendars }
  if (detaches && detaches.length > 0) {
    await OpenTimestamps.stamp(detaches, options)
  }
}

let fileUpgradeOtsWorker = async () => {
  log.info('***FileUpgradeOtsWorker starting***')
  let fileOtsList = await File.listPendingOts()
  let fileOtsUpgradeList = await Promise.all(
    fileOtsList.map(stampUpgrade).map(async (resp) => {
      let result = await resp
      let idWithOts = result.idWithOts
      if (result.changed) {
        const upgradedFileOtsBuf = Buffer.from(result.detachedOts.serializeToBytes(), 'hex')
        log.info('Success upgradedFileOtsBuf', idWithOts._id, idWithOts.hash)
        return File.updateOts(idWithOts._id, upgradedFileOtsBuf, state.upgraded)
      } else {
        log.info('Timestamp not upgraded', idWithOts._id, idWithOts.hash)
      }
    })
  ) //commit to DB before next stage
  log.info('***FileUpgradeOtsWorker ended***')
  return fileOtsUpgradeList
}

let histUpgradeOtsWorker = async () => {
  log.info('***HistUpgradeOtsWorker starting***')
  let historyOtsList = await History.listPendingOts()
  let histOtsUpgradeList = await Promise.all(
    historyOtsList.map(stampUpgrade).map(async (resp) => {
      let result = await resp
      let idWithOts = result.idWithOts
      if (result.changed) {
        const upgradedHistOtsBuf = Buffer.from(result.detachedOts.serializeToBytes(), 'hex')
        log.info('Success upgradedHistOtsBuf', idWithOts._id, idWithOts.hash)
        return History.updateOts(idWithOts._id, upgradedHistOtsBuf, state.upgraded)
      } else {
        log.info('Timestamp not upgraded', idWithOts._id, idWithOts.hash)
      }
    })
  ) //commit to DB before next stage
  log.info('***HistUpgradeOtsWorker ended***')
  return histOtsUpgradeList
}

let stampUpgrade = async (idWithOts) => {
  let detachedOts = OpenTimestamps.DetachedTimestampFile.deserialize(idWithOts.ots)
  try {
    let changed = await OpenTimestamps.upgrade(detachedOts, whitelist)
    return { idWithOts, detachedOts, changed }
  } catch (err) {
    log.error('error:', err)
  }
}

function getMerkleRoot(ots) {
  if (ots.isTimestampComplete()) {
    return (
      '0x' +
      ots
        .strTree()
        .split('\n')
        .find((l) => l.indexOf('merkle root') > 0)
        .match(/merkle root ([0-9a-f]+)/)[1]
    )
  }
  return null
}

let objectRootsToHashes = async (objOtsList, fn, tezosFn) => {
  let roots = objOtsList.map((file) =>
    getMerkleRoot(OpenTimestamps.DetachedTimestampFile.deserialize(file.ots).timestamp)
  )
  await rootEtherSender.syncRootThenCache(roots)
  let txHashesResult = await rootEtherSender.getTxHash(roots)
  let tezosOpHashes = await rootEtherSender.getTezosOpHash(roots)

  let result = await Promise.all(objOtsList.map((obj, index) => {
    if (tezosFn) {
      tezosFn(obj.id, tezosOpHashes[index], state.upgraded.uploaded);
    }
    const [tx, txNet] = String(txHashesResult[index]).split(':')
    const txNetwork = txNet || process.env.OTS_ETH_NETWORK
    return fn(obj.id, tx, state.upgraded.uploaded, txNetwork)
  }))

  return result
}

let histEthPendingTransactionWorker = async () => {
  log.info('***HistEthPendingTransactionWorker starting***')

  let histories = await History.listPendingEthTransactions()
  histories.map(async (history) => {
    let receipt = await rootEtherSender.getTransactionReceipt(history.txHash, process.env.OTS_ETH_NETWORK)
    if (receipt && receipt.confirmations >= config.ethConfirmThreshold && receipt.status === 1) {
      console.log('completed:', history._id)
      History.completeOts(history._id)
    }
  })
  log.info('***HistEthPendingTransactionWorker ended***')
}

let fileEthPendingTransactionWorker = async () => {
  log.info('***FileEthPendingTransactionWorker starting***')

  let files = await File.listPendingEthTransactions()
  files.map(async (file) => {
    let receipt = await rootEtherSender.getTransactionReceipt(file.txHash, process.env.OTS_ETH_NETWORK)
    if (receipt && receipt.confirmations >= config.ethConfirmThreshold && receipt.status === 1) {
      console.log('completed:', file._id)
      File.completeOts(file._id)
    }
  })
  log.info('***FileEthPendingTransactionWorker ended***')
}

let stampSupervisor = async () => {
  let start = Date()

  let tezosUpdateFileFn = null
  let tezosUpdateHistoryFn = null

  if (config.tezos.enable) {
    tezosUpdateFileFn = (id, tx, status) => File.updateTezosOpHash(id, tx, status)
    tezosUpdateHistoryFn = (id, tx, status) => History.updateTezosOpHash(id, tx, status)
  }

  // await fileStampingWorker() // 0 -> 1 // TODO: fix for schema changes on versionning of files
  await fileUpgradeOtsWorker() // 1 -> 2
  await objectRootsToHashes(await File.listAttestedOts(), (id, tx, status, txNetwork) => File.updateTxHash(id, tx, status, txNetwork), tezosUpdateFileFn) // 2 -> 3

  await histStampingWorker()
  await histUpgradeOtsWorker()
  await objectRootsToHashes(await History.listAttestedOts(), (id, tx, status, txNetwork) => History.updateTxHash(id, tx, status, txNetwork), tezosUpdateHistoryFn)

  await fileEthPendingTransactionWorker() //3 -> 4
  await histEthPendingTransactionWorker()
  log.info('stampSupervisor', start, Date())
}

let start = async () => {
  const job = new CronJob('0 */10 * * * *', stampSupervisor)
  job.start()
  stampSupervisor()
}

module.exports = {
  start,
}
