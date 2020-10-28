const mongoose = require('mongoose')
const { jsonStringifyNullable } = require('../helper/util')

const InputsSchema = new mongoose.Schema(
  {
    _id: { type: String, require: true },
    label: { type: String },
    value: { type: String, set: jsonStringifyNullable, get: JSON.parse, default: null },
    type: { type: String },
    options: {
      type: [
        {
          _id: String,
          label: String,
        },
      ],
      default: undefined,
    },
  },
  {
    versionKey: false,
  }
)

InputsSchema.set('toObject', { getters: true })
InputsSchema.set('toJSON', { getters: true })

module.exports = InputsSchema
