const config = require('../config')
const bcrypt = require('bcryptjs')
const azureStorageSvc = require('../services/azureStorageSvc')

const startsWith = (pathLeft, pathRight) => {
  const [pathRightNorm, ,] = normalizePath(pathRight)
  const [pathLeftNorm, ,] = normalizePath(pathLeft)
  return (pathLeft + '/').startsWith(pathRight + '/')
}

const normalizePath = (path) => {
  // pathNorm: handle multiple slash, trim leading/trailing space
  const pathNorm =
    '/' +
    path
      .split('/')
      .map((i) => i.trim())
      .filter((i) => i.length)
      .join('/')
  let parentPath = pathNorm.slice(0, pathNorm.lastIndexOf('/'))
  parentPath = parentPath.length === 0 ? '/' : parentPath
  const folderName = pathNorm.slice(pathNorm.lastIndexOf('/') + 1)
  return [pathNorm, parentPath, folderName]
}

const getExtension = (name, extension) => {
  const ext = extension ? `.${extension}` : ''
  const filename = `${name}${ext}`
  return filename
}

const extractFilename = (filename) => {
  let name = filename.lastIndexOf('.') == -1 ? filename : filename.substring(0, filename.lastIndexOf('.'))
  const extension = filename.lastIndexOf('.') == -1 ? '' : filename.substring(filename.lastIndexOf('.') + 1)
  name = filename.lastIndexOf('.') + 1 == filename.length ? name.concat('.') : name
  return [name, extension]
}

const genLink = (sharingType, params) => {
  // var key = String(config.hmacSecret);
  // var hmac = crypto.createHmac('sha1', key).update(sharingId).digest('hex')
  const qs = params
    ? Object.keys(params)
      .map((key) => key + '=' + encodeURIComponent(params[key]))
      .join('&')
    : ''
  return `${config.downloadDomain}/${sharingType}?${qs}`
}

const getDriveDownloadableLink = (userId, fileId, fname, extension) => {
  const blobPath = `${userId}/${fileId}`
  const filename = getExtension(fname, extension)
  const uriSas = azureStorageSvc.getBlobLinkSas(config.azure.containerName, blobPath, 'r', filename)
  return uriSas.uri
}

function hashSalt(secret, round = 10) {
  const salt = bcrypt.genSaltSync(round)
  const hashed = bcrypt.hashSync(secret, salt)
  return hashed
}

function checkboxNullToFalse(input) {
  let value
  if (input.type == 'checkbox' && input.value == null) {
    value = false
  } else {
    value = input.value
  }
  return {
    ...input,
    value,
  }
}

function numberTypeToNumber(input) {
  let value
  if (input.type == 'number' && Number(input.value)) {
    value = Number(input.value)
  } else {
    value = input.value
  }
  return {
    ...input,
    value,
  }
}

function checkboxBooleanToYesNo(input) {
  let value
  if (input.type == 'checkbox') {
    value = input.value ? 'Yes' : 'No'
  } else {
    value = input.value
  }
  return {
    ...input,
    value,
  }
}

let jsonStringifyNullable = (ele) => {
  if (ele == null) {
    return null
  }
  return JSON.stringify(ele)
}

function dateToYears(dateStr) {
  const d = new Date(dateStr).getFullYear()
  if (d) {
    return String(new Date().getFullYear() - d)
  } else {
    return dateStr
  }
}

function yearsToDate(years) {
  let now = new Date()
  now.setFullYear(now.getFullYear() - years)
  return now
}

module.exports = {
  startsWith,
  normalizePath,
  getExtension,
  extractFilename,
  genLink,
  getDriveDownloadableLink,
  hashSalt,
  checkboxNullToFalse,
  numberTypeToNumber,
  checkboxBooleanToYesNo,
  jsonStringifyNullable,
  dateToYears,
  yearsToDate,
}
