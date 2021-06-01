const { MODEL, RIGHT_TYPE } = require('../constants')
const mongoose = require('mongoose')
const model = 'Access'
const { normalizePath, getExtension } = require('../helper/util')
const _ = require('lodash')
const escape = require('escape-string-regexp')
const AccessSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', index: true },
    USID: { type: mongoose.Schema.Types.ObjectId, ref: 'userSpace', required: true },
    type: { type: String, required: true },
    active: { type: Boolean, required: true },
    name: { type: String },
    extension: { type: String },
    category: { type: String },
    documentType: { type: String },
    documentTypeOther: { type: String },
    path: { type: String, required: true },
    fullpath: { type: String, required: true },
    originalPath: { type: String },
    createdAt: { type: Number },
    modifiedAt: { type: Number },
    deletedAt: { type: Number },
    permissions: [
      {
        _id: false,
        type: { type: String, required: true },
        ref: { type: mongoose.Schema.Types.ObjectId, required: true }, // index
        right: { type: Number, required: true, default: 0 },
        versionId: { type: mongoose.Schema.Types.ObjectId },
      },
    ],
  },
  {
    versionKey: false,
  }
)

AccessSchema.index({ USID: 1, fullpath: 1 })

AccessSchema.set('toObject', { virtuals: true, getters: true })
AccessSchema.set('toJSON', { virtuals: true, getters: true })

const accessProject = { modifiedAt: 0, deletedAt: 0 }

const fileAccessProject = '-ots -hash -txHash'
const userAccessProject = '_id email name surname'

AccessSchema.statics.getAccessShared = function (fileIds) {
  return this.find({
    fileId: { $in: fileIds },
    active: true,
    type: MODEL.ACCESS.sharing,
    'permissions.type': RIGHT_TYPE.SHARE,
  }).lean()
}

AccessSchema.statics.getSharingAccesses = function (fileId) {
  return this.find({ fileId, type: MODEL.ACCESS.sharing }, accessProject)
    .sort({ _id: -1 })
    .populate('fileId', fileAccessProject)
    .lean()
}

AccessSchema.statics.createAccess = async function (access) {
  const accessSaved = await this.create(access)
  return this.getAccessById(accessSaved._id)
}

//TODO: fix name. listSharedAccessesWithFiles is now fetching all accesses
AccessSchema.statics.listSharedAccessesWithFiles = function (USID) {
  return this.find({ USID }, accessProject)
    .sort({ _id: -1 })
    .populate('fileId', fileAccessProject)
    .populate('form')
    .lean()
}

AccessSchema.statics.listChecklistAccessesWithFiles = function (USID) {
  return this.find({ USID, path: '/Checklist' }, accessProject)
    .sort({ _id: -1 })
    .populate('fileId', fileAccessProject)
    .populate('form')
    .lean()
}

AccessSchema.statics.findChecklistAccess = function (USID, documentType) {
  return this.findOne({ USID, path: '/Checklist', category: documentType }, accessProject).lean()
}

AccessSchema.statics.findOwner = function (fileId) {
  return this.findOne({ fileId, type: MODEL.ACCESS.owner }).lean()
}

AccessSchema.statics.findOwnerByFileIds = function (fileIds) {
  return this.find({ fileId: { $in: fileIds }, type: MODEL.ACCESS.owner, USID: { $ne: null } }).lean()
}

AccessSchema.statics.getAccessWithForm = function (fileIds, fileIdName = 'fileId') {
  return this.aggregate([
    { $match: { fileId: { $in: _.flatten([fileIds]) }, 'permissions.type': 'FORM' } },
    {
      $project: {
        permissions: {
          $filter: {
            input: '$permissions',
            as: 'item',
            cond: { $eq: ['$$item.type', 'FORM'] },
          },
        },
        [fileIdName]: '$fileId',
      },
    },
  ]).exec()
}

AccessSchema.statics.getAccessByFormId = function (formId) {
  return this.findOne({ 'permissions.type': RIGHT_TYPE.FORM, 'permissions.ref': formId }, accessProject).lean()
}

AccessSchema.statics.getAccess = function (fileId, USID) {
  return this.findOne({ fileId, USID }, accessProject).populate('fileId', fileAccessProject).populate('form').lean()
}

AccessSchema.statics.updateAccess = function (access) {
  const options = { new: true }
  return this.findOneAndUpdate({ _id: access._id }, { ...access }, options).exec()
}

AccessSchema.statics.updatePath = async function (USID, pathOld, pathNew) {
  const pathReg = `^${escape(pathOld.toLowerCase())}([\/].+)?$` // absolute path: directory itself or its sub-objects only
  const accesses = await this.find({ USID, fullpath: { $regex: pathReg } }).exec()
  const filesUpdateOp = accesses.map((access) => {
    const newPath = access.path.replace(pathOld, pathNew)
    const [pathNormNew, ,] = normalizePath(`${newPath}/${getExtension(access.name, access.extension)}`)
    return {
      updateOne: {
        filter: { _id: access._id },
        update: { path: newPath, fullpath: pathNormNew.toLowerCase() },
      },
    }
  })
  if (filesUpdateOp && filesUpdateOp.length) {
    return await this.bulkWrite(filesUpdateOp)
  } else {
    return null
  }
}

AccessSchema.statics.getAccessByAccessId = function (accessId) {
  return this.findOne({ _id: accessId }, accessProject).lean()
}

AccessSchema.statics.getAccessById = function (accessId) {
  return this.findOne({ _id: accessId }, accessProject).populate('fileId', fileAccessProject).populate('form').lean()
}

AccessSchema.statics.getAccessByFullpath = function (USID, path, name, extension) {
  const [pathNorm, ,] = normalizePath(`${path}/${getExtension(name, extension)}`)
  return this.findOne({ USID, fullpath: pathNorm.toLowerCase() }).lean()
}

AccessSchema.statics.listMyAccessByPath = function (USID, path) {
  const pathRegex = `^${escape(path.toLowerCase())}([\/].+)?$` // absolute path: directory itself or its sub-objects only
  return this.find({ USID, fullpath: { $regex: pathRegex } }).lean()
}

AccessSchema.statics.deleteByPath = function (USID, path) {
  const option = { projection: { createdAt: 0 } }
  return this.findOneAndDelete({ USID, fullpath: path.toLowerCase() }, option)
    .populate('fileId', fileAccessProject)
    .lean()
}

AccessSchema.statics.getMyAccessesByFileIds = function (USID, fileIds) {
  return this.find({ USID, fileId: { $in: fileIds } }, accessProject)
    .populate('fileId', fileAccessProject)
    .lean()
}

AccessSchema.statics.getMyAccessesByAccessIds = function (USID, accessIds) {
  return this.find({ USID, _id: { $in: accessIds } }, accessProject)
    .populate('fileId', fileAccessProject)
    .lean()
}

AccessSchema.statics.listByPathU = function (USID, path) {
  let pathReg = `^${escape(path.toLowerCase())}([\/].+)?$` // absolute path: directory itself or its sub-objects only
  return this.find({ USID, fullpath: { $regex: pathReg } }, accessProject).lean()
}

AccessSchema.statics.listByPathUWithFile = function (USID, path) {
  let pathReg = `^${escape(path.toLowerCase())}([\/].+)?$` // absolute path: directory itself or its sub-objects only
  return this.find({ USID, fullpath: { $regex: pathReg } }, accessProject)
    .populate('fileId', fileAccessProject)
    .lean()
}

AccessSchema.statics.pushPermissions = function (accessId, USID, permissions) {
  let options = { new: true }
  return this.findOneAndUpdate({ _id: accessId, USID }, { $push: { permissions } }, options)
    .populate('fileId', fileAccessProject)
    .lean()
}

AccessSchema.statics.pullPermissions = function (accessId, USID, permissions) {
  // Deprecating as no unshare logic right now
  const options = { new: true }
  return this.findOneAndUpdate(
    { _id: accessId, USID, 'permissions.type': permissions.type, 'permissions.ref': permissions.ref },
    { $pull: { permissions: { type: permissions.type, ref: permissions.ref } } },
    options
  )
    .populate('fileId', fileAccessProject)
    .lean()
}

AccessSchema.statics.getFormIdsByFileId = function (fileId) {
  return this.find({ fileId, 'permissions.type': 'FORM' }, { permissions: 1 }).lean()
}

AccessSchema.statics.getOwnerAccessWithFile = function (USIDs) {
  return this.find({ USID: USIDs, type: MODEL.ACCESS.owner }).populate('fileId', fileAccessProject).lean()
}

AccessSchema.statics.deleteByFileId = function (fileId) {
  return  this.findOneAndUpdate(
    { _id: fileId },
    { $set: { deletedAt: new Date(), fullpath: '' }},
  ).lean()
}

AccessSchema.statics.uploadNewVersion = function (fileId, fullPath, fileName, fileExtension) {
  return  this.findOneAndUpdate(
    { _id: fileId },
    { $set: { deletedAt: 0, fullpath: fullPath, name: fileName, extension: fileExtension }},
  ).lean()
}

AccessSchema.statics.uploadNewVersionForAccess = function (fileId, fullPath, fileName, fileExtension) {
  return  this.updateMany(
    { fileId: fileId },
    { $set: { deletedAt: 0, fullpath: fullPath, name: fileName, extension: fileExtension }},
  ).lean()
}

AccessSchema.statics.countUpload = function (type) {
  return  this.aggregate([
    // First Stage
    {
      $match : { "type": { $eq: type} }
    },
    // Second Stage
    {
      $group : {
         _id : "$category",
         count: { $sum: 1 }
      }
    },
   ]).exec()
}

const Access = mongoose.model(model, AccessSchema)
module.exports = Access
