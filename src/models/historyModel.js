var mongoose = require('mongoose')
var model = 'History'
var userProject = { name: 1, surname: 1, email: 1 }
var sharingProject = { name: 1 }

var HistorySchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', index: true, require: true },
    action: { type: String, required: true },
    date: { type: Number, required: true },
    ipAddress: String,
    txHash: String,
    notes: String,
    tezosOpHash: String,
    blockHash: String,
    hash: String,
    status: { type: Number, required: true, index: true }, // low cardinaility index. Infrequent values should be able to benefit from index. So as status not equal to Completed(4)
    ots: Buffer,
    USID: { type: mongoose.Schema.Types.ObjectId, ref: 'userSpace', index: true },
    shared: { type: mongoose.Schema.Types.ObjectId, ref: 'Access' },
    sharedEmail: { type: String, index: true },
    meta: { type: String },
    txNetwork: { type: String },
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
    versionKey: false,
  }
)

HistorySchema.statics.saveHistory = function (
  action,
  eventTime,
  fileId,
  USID,
  shareId,
  ipAddress,
  sharedEmail,
  options,
  notes
) {
  var history = {
    _id: mongoose.Types.ObjectId(),
    action: action,
    fileId: fileId,
    date: eventTime,
    ipAddress: ipAddress,
    status: 0,
    USID,
    shared: shareId,
    sharedEmail: sharedEmail,
    notes,
    ...options,
  }
  return this.create(history)
}

//TODO: index on user/initiator needed for frequent query
HistorySchema.statics.getHistoryByUSID = function (USID) {
  return this.find({ $or: [{ USID: USID }] })
    .sort({ _id: -1 })
    .limit(4)
    .populate('shared')
    .lean()
}

HistorySchema.statics.getHistoryByFileId = function (fileId) {
  return this.find({ fileId: fileId }).sort({ date: -1 }).populate('shared').lean()
}

HistorySchema.statics.listHistoriesNotStamped = function () {
  return this.find({ $or: [{ status: null }, { status: false }, { status: 0 }] })
    .populate({
      path: 'fileId',
      select: 'hash size fullpath',
    })
    .populate({
      path: 'user',
      select: 'email -_id',
    })
    .populate({
      path: 'shared',
      select: 'email -_id',
    })
    .lean()
}

HistorySchema.statics.updateFileHash = function (id, hash) {
  var options = { new: true }
  return this.findOneAndUpdate({ _id: id }, { hash }, options).exec()
}

HistorySchema.statics.updateOts = function (id, ots, status) {
  var options = { new: true }
  return this.findOneAndUpdate({ _id: id }, { ots, status }, options).exec()
}

HistorySchema.statics.listPendingOts = function () {
  return this.find({
    $and: [{ status: 1 }, { ots: { $ne: null } }, { hash: { $ne: null } }],
  }).exec()
}

HistorySchema.statics.listAttestedOts = function () {
  return this.find({
    $and: [{ status: 2 }, { ots: { $ne: null } }, { hash: { $ne: null } }],
  }).exec()
}

HistorySchema.statics.updateTxHash = function(id, txHash, status = 3, txNetwork) {
  var options = {new: true}
  return this.findOneAndUpdate({'_id': id}, {txHash, status, txNetwork}, options)
    .exec();
};

HistorySchema.statics.updateTezosOpHash = function (fileId, opHash, status = 3) {
  var options = { new: true }
  return this.findOneAndUpdate({ _id: fileId }, { tezosOpHash: opHash, status }, options).exec()
}

HistorySchema.statics.listPendingEthTransactions = function () {
  return this.find({
    $and: [{ status: 3 }, { ots: { $ne: null } }, { hash: { $ne: null } }],
  }).exec()
}

HistorySchema.statics.completeOts = function (fileId, status = 4) {
  var options = { new: true }
  return this.findOneAndUpdate({ _id: fileId }, { status }, options).exec()
}

const History = mongoose.model(model, HistorySchema)
module.exports = History
