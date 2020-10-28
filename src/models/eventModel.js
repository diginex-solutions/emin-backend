const { EVENT_TYPE } = require('../constants')
const mongoose = require('mongoose')
const model = 'Event'

const EventSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    createdAt: { type: Number, required: true },
    updatedAt: { type: Number },
    caseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Case' },
    USID: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'userSpace' },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'userSpace' },
    action: { type: String, required: true },
    status: { type: Number, default: 0, require: true }, // -1: deleted, 0 default
    data: { type: String },
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
    filename: { type: String },
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
    versionKey: false,
  }
)

EventSchema.statics.createEvent = function (event) {
  return this.create(event)
}

EventSchema.statics.listEventByCases = function (caseIds) {
  return this.find({ caseId: caseIds, status: 0 }).lean()
}

EventSchema.statics.getEventById = function (_id) {
  return this.findOne({ _id }).lean()
}

EventSchema.statics.deleteEvent = function (USID, _id, ts) {
  const options = { new: true }
  const query = { _id, USID, action: EVENT_TYPE.COMMENT, status: { $ne: -1 } }
  const update = { status: -1, updatedAt: ts }
  return this.findOneAndUpdate(query, update, options).lean()
}

EventSchema.statics.updateEvent = function (USID, _id, comment, ts) {
  const options = { new: true }
  const query = { _id, USID, action: EVENT_TYPE.COMMENT, status: { $ne: -1 } }
  const update = { data: comment, updatedAt: ts }
  return this.findOneAndUpdate(query, update, options).lean()
}

const Event = mongoose.model(model, EventSchema)
module.exports = Event
