var azureStorageSvc = require('../services/azureStorageSvc')
var config = require('../config')
const { normalizePath, getExtension, getDriveDownloadableLink } = require('../helper/util')
var mongoose = require('mongoose')
const escape = require('escape-string-regexp')
const constants = require('../constants')

var model = 'File'
var fileProject = { storage: 0 }
var userProject = { name: 1, surname: 1, email: 1 }

var FileSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    archived: Boolean, //TODO: REMOVE this, cal the status from access.path
    isFolder: { type: Boolean, required: true, default: false },
    txNetwork: { type: String },
    category: { type: String, default: constants.FILE_CATEGORY.FILE },
    versionId: { type: mongoose.Schema.Types.ObjectId },
    versions: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId },
        uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        uploaded: { type: Number }, // TODO: Remove this, should fetch it from createdAt
        size: Number,
        storage: String,
        hash: String,
        blockHash: String,
        txHash: String,
        tezosOpHash: String,
        status: { type: Number, required: true }, //0 init state, 1 stamped, 2 upgraded, 3 uploaded, 4 success, -1 not stampable
        ots: Buffer,
      },
    ],
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
    versionKey: false,
  }
)

FileSchema.statics.pushNewVersion = function (fileId, version) {
  let options = { new: true }
  return this.findOneAndUpdate(
    { _id: fileId },
    { $push: { versions: version }, versionId: version._id },
    options
  ).lean()
}

FileSchema.statics.getFilesByIds = function (fileIds) {
  const query = { _id: { $in: fileIds } }
  return this.find(query, "versionId versions").lean()
}

FileSchema.statics.getFileById = function (fileId) {
  return this.findOne({ _id: fileId }, fileProject).exec()
}

FileSchema.statics.addFile = async function (file) {
  let fileSaved = await this.create(file)
  return this.getFileById(fileSaved._id)
}

FileSchema.statics.listFilesNotStamped = function () {
  return this.find({ $or: [{ status: null }, { status: false }, { status: 0 }] }).exec()
}

FileSchema.statics.updateFileHash = function (fileId, hash) {
  var options = { new: true }
  return this.findOneAndUpdate({ _id: fileId }, { hash }, options).exec()
}

FileSchema.statics.updateOts = function (fileId, ots, status) {
  var options = { new: true }
  return this.findOneAndUpdate({ _id: fileId }, { ots, status }, options).exec()
}

FileSchema.statics.listPendingOts = function () {
  return this.find({
    $and: [{ status: 1 }, { ots: { $ne: null } }, { hash: { $ne: null } }],
  }).exec()
}

FileSchema.statics.listAttestedOts = function () {
  return this.find({
    $and: [{ status: 2 }, { ots: { $ne: null } }, { hash: { $ne: null } }],
  }).exec()
}

FileSchema.statics.updateTxHash = function(fileId, txHash, status = 3, txNetwork) {
  var options = {new: true}
  return this.findOneAndUpdate({'_id': fileId}, {txHash, status, txNetwork}, options)
    .exec();
};

FileSchema.statics.updateTezosOpHash = function (fileId, opHash, status = 3) {
  var options = { new: true }
  return this.findOneAndUpdate({ _id: fileId }, { tezosOpHash: opHash, status }, options).exec()
}

FileSchema.statics.listPendingEthTransactions = function () {
  return this.find({
    $and: [{ status: 3 }, { ots: { $ne: null } }, { hash: { $ne: null } }],
  }).exec()
}

FileSchema.statics.completeOts = function (fileId, status = 4) {
  var options = { new: true }
  return this.findOneAndUpdate({ _id: fileId }, { status }, options).exec()
}

FileSchema.statics.deleteFolderById = function (folderId) {
  return this.findOneAndDelete({ _id: folderId, isFolder: true }).exec()
}

FileSchema.statics.deleteById = function (fileId) {
  return this.findOneAndDelete({ _id: fileId}).exec()
}

const File = mongoose.model(model, FileSchema)
module.exports = File
