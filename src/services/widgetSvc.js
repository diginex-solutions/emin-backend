const mongoose = require('mongoose')
const Widget = mongoose.model('Widget')
const templateSvc = require('./templateSvc')
const fileSvc = require('./fileSvc')
const cError = require('../helper/customError')
const _ = require('lodash')

async function createWidget(USID, optionsRaw) {
  const options = _.pickBy(optionsRaw)
  if (options.docId) {
    const file = await fileSvc.retrieveMyAccessById(options.docId, USID)
    if (!file) {
      throw new cError.ResourceNotFoundException('Document not found')
    }
  }

  const template = await templateSvc.getTemplate(USID, options.templateId)
  if (!template) {
    throw new cError.ResourceNotFoundException('Template not found')
  } else {
    const field = template.inputs.find((i) => String(i._id) == options.fieldId)
    if (field || options.type == 'count') {
      let widget = await Widget.createWidget(USID, options)
      if (widget) {
        return widgetGroupsJsonParse(widget)
      } else {
        throw new cError.InternalServerError('Widget cannot be created')
      }
    } else {
      throw new cError.ResourceNotFoundException('Field not found')
    }
  }
}

async function listWidget(USID) {
  const widgets = await Widget.listByUSID(USID)
  return widgets.map((widget) => {
    return widgetGroupsJsonParse(widget)
  })
}

async function modifyWidget(USID, widgetId, options) {
  const widget = await Widget.modifyWidget(USID, widgetId, options)
  if (widget) {
    return widgetGroupsJsonParse(widget)
  } else {
    throw new cError.InternalServerError('Widget cannot be updated')
  }
}

async function deleteWidget(USID, widgetId) {
  const widget = await Widget.deleteWidget(USID, widgetId)
  if (widget) {
    return widgetGroupsJsonParse(widget)
  } else {
    throw new cError.InternalServerError('Widget not found')
  }
}

function widgetGroupsJsonParse(widget) {
  const groups = widget.groups.map((group) => {
    return { min: JSON.parse(group.min), max: JSON.parse(group.max) }
  })
  return {
    ...widget.toObject(),
    groups,
  }
}

async function getWidgetById(USID, widgetId) {
  const widget = await Widget.getWidgetById(USID, widgetId)
  if (widget) {
    return widgetGroupsJsonParse(widget)
  } else {
    throw new cError.InternalServerError('Widget not found')
  }
}

module.exports = {
  createWidget,
  listWidget,
  modifyWidget,
  deleteWidget,
  getWidgetById,
}
