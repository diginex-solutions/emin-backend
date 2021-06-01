const _ = require('lodash')
var mongoose = require('mongoose')
var model = 'Sharing'
var SharingSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', index: true },
    name: String,
    surname: String,
    email: { type: String, require: true, index: true }, //TODO email validator
    company: String,
    link: String,
    valid: Boolean,
    formId: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Form' }], index: true }, //i composite with fileId
  },
  {
    toObject: { virtuals: true, getter: true },
    toJSON: { virtuals: true, getter: true },
    versionKey: false,
  }
)

SharingSchema.virtual('form', {
  ref: 'Form',
  localField: 'formId',
  foreignField: '_id',
})

let sharingProject = { name: 1, surname: 1, email: 1, company: 1 }

SharingSchema.statics.share = function (sharing) {
  let formId = sharing.formId ? { $ne: null } : null
  let query = { fileId: sharing.fileId, email: sharing.email, formId }
  var options = { upsert: true, new: true }

  var sharingOld = this.findOne(query).exec()
  return [sharingOld, this.findOneAndUpdate(query, sharing, options)]
}

SharingSchema.statics.unshare = function (id) {
  return this.findByIdAndUpdate(id, { valid: false }, { new: false })
}

SharingSchema.statics.unshareByFileIds = function (fileIds) {
  let query = { fileId: { $in: fileIds } }
  let doc = { $set: { valid: false } }
  let sharings = this.updateMany(query, doc)
  return sharings
}

SharingSchema.statics.getValidSharesByFileId = function (id) {
  return this.find({ fileId: id, valid: true, formId: null }, sharingProject).sort({ _id: -1 })
}

SharingSchema.statics.getShareWithForm = async function (id) {
  const sharesWForms = await this.find({ fileId: id, formId: { $ne: null } }, { ...sharingProject, formId: 1 })
    .populate({
      path: 'form',
      populate: { path: 'templateId', model: 'Template' },
    })
    .sort({ _id: -1 })
    .exec()
  return sharesWForms
    .map((i) => i.toObject())
    .map((swfs) => {
      const form = swfs.form.map((form) => {
        const template = _.pick(form.templateId, ['_id', 'name', 'inputs', 'languages'])
        return {
          ...form,
          templateId: undefined,
          template: _.isEmpty(template) ? null : template,
        }
      })
      return {
        ...swfs,
        form,
      }
    })
}

SharingSchema.statics.pushForm = function (fileId, formId, email, name, surname, company) {
  let options = { new: true }
  return this.findOneAndUpdate(
    { fileId: fileId, email, formId: { $ne: null } },
    { $push: { formId }, name, surname, company },
    options
  ).exec()
}

SharingSchema.statics.getSharingById = function (sharingId) {
  return this.findOne({ _id: sharingId, valid: true }).populate('fileId').exec()
}

SharingSchema.statics.getFormIdsByFileId = function (fileId) {
  return this.find({ fileId }, { formId: 1 }).lean()
}

const Sharing = mongoose.model(model, SharingSchema)
module.exports = Sharing
