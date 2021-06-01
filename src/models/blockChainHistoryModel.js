var mongoose = require('mongoose')
var model = 'BlockChainHistory'

var BlockChainHistorySchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', index: true, require: true },
    action: { type: String, required: true },
    date: { type: Number, required: true },
    tezosOpHash: { type: String },
    status: { type: String }, // low cardinaility index. Infrequent values should be able to benefit from index. So as status not equal to Completed(4)
    shareTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String },
    name: { type: String },
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
    versionKey: false,
  }
)

BlockChainHistorySchema.statics.saveBlockChainHistory = function (model) {
  return this.create(model);
}

//TODO: index on user/initiator needed for frequent query
BlockChainHistorySchema.statics.getHistoryById = function(id) {
  return this.find({_id: id}).lean();
}

BlockChainHistorySchema.statics.getHistoryByUser = function(userId) {
    return this.find({shareTo: userId}).lean()
}

BlockChainHistorySchema.statics.getHistoryByUploadUser = function(userId) {
    return this.find({uploadedBy: userId}).lean()
}

BlockChainHistorySchema.statics.getHistoryByDocId = function(id) {
    return this.find({documentId: id}).populate('documentId').lean();
  }

BlockChainHistorySchema.statics.getByExpireDate = function(start, end) {
  return this.find({ date: { $gte: start, $lte: end }}).lean()
}

BlockChainHistorySchema.statics.updateHashOpTezos = function(id, hashOpTezos) {
  return this.findOneAndUpdate({ _id: id },{tezosOpHash: hashOpTezos}).lean();
}

const BlockChainHistory = mongoose.model(model, BlockChainHistorySchema)
module.exports = BlockChainHistory
