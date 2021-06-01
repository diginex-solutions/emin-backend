const widgetSvc = require('../services/widgetSvc')
const metricSvc = require('../services/metricSvc')
const cError = require('../helper/customError')
const _ = require('lodash')
const dateReg = /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/
const { dateToYears, yearsToDate } = require('../helper/util')
const mongoose = require('mongoose')
const TemplateModel = mongoose.model('Template')
const FormModel = mongoose.model('Form')

function toLevelComparable(min, max, label, isDate, isYearsFromNow) {
  if (isDate && !isYearsFromNow) {
    // transform min, max, label into date obj for compare
    const _min = dateReg.test(min) ? new Date(min) : min
    const _max = dateReg.test(max) ? new Date(max) : max
    const _label = dateReg.test(label) ? new Date(label) : label
    return [_min, _max, _label]
  } else if (isDate && isYearsFromNow) {
    // transform label to date obj, compare with years ago
    const _label = dateReg.test(label) ? new Date(label) : label
    return [min, max, _label]
  } else {
    // simply number format, as the label is in string and {min, max} are possible as well
    return [Number(min), Number(max), Number(label)]
  }
}

function groupItemToCaption(item, isYearsFromNow, isDate) {
  //get caption e.g. ≤50, 51-100, ≥100
  let caption
  let min = item.min
  let max = item.max
  if (isDate && isYearsFromNow) {
    min = min ? dateToYears(min) : min
    max = max ? dateToYears(max) : max
  }

  if (!min && min !== 0 && (max === 0 || max)) {
    //min is not supplied
    if (isDate && isYearsFromNow) {
      caption = `≥${max}`
    } else {
      caption = `≤${max}`
    }
  } else if (!max && max !== 0 && (min === 0 || min)) {
    // max is not supplied
    if (isDate && isYearsFromNow) {
      caption = `≤${min}`
    } else {
      caption = `≥${min}`
    }
  } else if ((min === 0 || min) && (max === 0 || max)) {
    if (item.omin == item.omax) {
      caption = `${item.omin}`
    } else if (isDate && isYearsFromNow) {
      caption = `${max}-${min}` //Date_max is now the younger one. (young-older) as age label
    } else {
      const delimiter = isDate ? ' to ' : '-'
      caption = `${min}${delimiter}${max}`
    }
  } else {
    caption = null
  }
  return caption
}

function groupsTransform(groups, isYearsFromNow, isDate) {
  const rangesGroup = groups
    .map((item, index) => {
      let min = item.min
      let max = item.max
      if (min || max) {
        //validate groups
        if (isDate && !isYearsFromNow) {
          //YYYY-MM-DD expected throw if it is not in format YYYY-MM-DD
          if ((min && !dateReg.test(min)) || (max && !dateReg.test(max))) {
            throw new cError.InvalidRequestPayloadException(`Invalid request payload, value:${JSON.stringify(item)}`)
          }
        } else {
          if ((min && isNaN(min)) || (max && isNaN(max))) {
            //number is expected, throw otherwise
            throw new cError.InvalidRequestPayloadException(`Invalid request payload, value:${JSON.stringify(item)}`)
          }
        }

        if (isDate && isYearsFromNow) {
          // years ago to date object
          max = item.min || item.min === 0 ? yearsToDate(item.min) : null
          if (item.min === item.max) {
            // tweak: for same years {y1, y1}, we do {y1, y1 + 365d}
            min = item.max || item.max === 0 ? new Date(yearsToDate(Number(item.max) + 1) - 24 * 60 * 60 * 1000) : null
          } else {
            min = item.max || item.max === 0 ? yearsToDate(item.max) : null
          }
        }
        return { min, max, omin: item.min, omax: item.max }
      }
    })
    .filter((i) => i)
  return rangesGroup
}

function groupByRange(groups, metrics, isYearsFromNow) {
  const isDate = metrics.type == 'date'
  let occurrence = { Other: 0 }
  const rangesGroup = groupsTransform(groups, isYearsFromNow, isDate)
  rangesGroup.map((rg, index) => (occurrence[index] = 0))

  metrics.values.map((item) => {
    const result = rangesGroup.reduce((acc, rg, index) => {
      // Reduce to key as the group caption or false
      const [_min, _max, _label] = toLevelComparable(rg.min, rg.max, item.label, isDate, isYearsFromNow)
      const withinInterval = _label >= _min && _label <= _max
      const rightMost = _label >= _min && !_max
      const leftMost = _label <= _max && !_min

      if (withinInterval || rightMost || leftMost) {
        return [...acc, index]
      } //add the rangeGroup index
      return acc
    }, [])
    if (result && result.length) {
      result.map((r) => {
        const existingValue = occurrence[r] ? occurrence[r] : 0
        occurrence[r] = existingValue + item.value
      })
    } else {
      occurrence.Other = occurrence.Other + item.value
    }
  })
  const values = Object.keys(occurrence).map(function (key) {
    const min = rangesGroup[key] ? rangesGroup[key].min : null
    const max = rangesGroup[key] ? rangesGroup[key].max : null
    let caption = rangesGroup[key] ? groupItemToCaption(rangesGroup[key], isYearsFromNow, isDate) : 'Other'
    return { label: caption, value: occurrence[key], min, max }
  })
  return {
    ...metrics,
    values,
  }
}

function toPercentage(values) {
  let valueSum = values.reduce((sum, item) => sum + item.value, 0)
  return values.map((item) => {
    const val = (item.value / valueSum) * 100
    const value = Number(Number.isInteger(val) ? val : val.toFixed(1))
    return {
      ...item,
      value,
    }
  })
}

function sanitizeAndSort(values, valueType, isYearsFromNow) {
  if (Array.isArray(values)) {
    const byValue = (a, b) => b.value - a.value // sort value descending
    const byLabel = (a, b) => {
      if (b.min === null) return -1
      if (a.min === null) return 1
      return (a.min > b.min ? 1 : -1) * (isYearsFromNow ? -1 : 1) // sort (date chronological, years inverse chro.)
    }
    const sortFn = valueType === 'date' ? byLabel : byValue
    const pickLabelValue = i => _.pick(i, ['label', 'value'])
    return values.filter((i) => !(i.label === 'Other' && i.value === 0)).sort(sortFn).map(pickLabelValue)
  }
  return values
}

async function getWidgetsData(USID, widgets) {
  const wiOptions = await Promise.all(
    widgets.map(async (wi) => {
      const option = {
        widget: wi,
        _id: String(wi._id),
        templateId: String(wi.templateId), //String cast for later mongo objectId constructor
        fieldId: String(wi.fieldId),
        accessId: wi.docId || wi.fileId,
        type: wi.type,
      }
      const formIds = await metricSvc.filterFormIdByFile(USID, option)
      return {
        ...option,
        formIds,
      }
    })
  )

  const templateIds = widgets.map((wi) => String(wi.templateId))
  const templates = await TemplateModel.getTemplates(USID, templateIds) //
  const formIdsUniq = _.uniq(_.flatten(wiOptions.map((w) => w.formIds)))
  const forms = await FormModel.getFormsByIds(formIdsUniq) //
  return wiOptions.map((wo) => {
    const template = templates.find((t) => String(t._id) === wo.templateId)
    if (!template) throw new cError.ResourceNotFoundException(`Template not found with Id: ${wo.templateId}`)
    const formsW = forms.filter((f) => -1 !== wo.formIds.indexOf(String(f._id)))
    let metrics = metricSvc.query(wo, formsW, template)
    let groups = wo.widget.groups
    if (groups && groups.length) {
      groups = groups.filter((g) => g.min || g.max)
    }

    if (wo.widget.type !== 'count') {
      if (groups && groups.length) {
        metrics = groupByRange(groups, metrics, wo.widget.isYearsFromNow)
      }
      metrics.values = sanitizeAndSort(metrics.values, metrics.type, wo.widget.isYearsFromNow)
      if (wo.widget.isPercentage) {
        metrics.values = toPercentage(metrics.values)
      }
    }
    return {
      ...wo.widget,
      data: metrics,
    }
  })
}

async function createWidget(req, res, next) {
  const USID = req.body.RESERVED_USID
  const widgetBody = req.body
  const metricsData = await getWidgetsData(USID, [widgetBody])
  const widget = await widgetSvc.createWidget(USID, widgetBody)
  const response = {
    ...metricsData[0],
    id: widget.id
  }
  res.json(response)
}

async function listWidget(req, res, next) {
  const USID = req.body.RESERVED_USID
  let widgets = await widgetSvc.listWidget(USID)
  const widgetsDataB = await getWidgetsData(USID, widgets)
  return res.json(widgetsDataB)
}

async function getWidget(req, res, next) {
  const USID = req.body.RESERVED_USID
  const widgetId = req.params.widgetId
  const widget = await widgetSvc.getWidgetById(USID, widgetId)
  const metricsData = await getWidgetsData(USID, [widget])
  const response = {
    ...metricsData[0],
  }
  return res.json(response)
}

async function modifyWidget(req, res, next) {
  const USID = req.body.RESERVED_USID
  const widgetId = req.params.widgetId
  const widgetBody = req.body
  const oWidget = await widgetSvc.getWidgetById(USID, widgetId)
  if (oWidget) {
    const newWidget = {
      ...oWidget,
      ...widgetBody,
    }
    const metricsData = await getWidgetsData(USID, [newWidget])
    const widget = await widgetSvc.modifyWidget(USID, widgetId, widgetBody)
    const response = {
      ...metricsData[0],
    }
    return res.json(response)
  } else {
    throw new cError.ResourceNotFoundException('Widget does not exist')
  }
}

async function deleteWidget(req, res, next) {
  const USID = req.body.RESERVED_USID
  const widgetId = req.params.widgetId
  let widget = await widgetSvc.deleteWidget(USID, widgetId)
  if (widget) {
    return res.json(widget)
  } else {
    throw new cError.ResourceNotFoundException('Widget does not exist')
  }
}

module.exports = {
  createWidget,
  listWidget,
  modifyWidget,
  deleteWidget,
  getWidget,
}
