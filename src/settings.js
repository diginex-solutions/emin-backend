const MORGAN_FORMAT = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'

const AZURE_BLOB_STORAGE_CONTAINER_ACCESS_LEVEL = 'blob'


module.exports = {
  MORGAN_FORMAT,
  AZURE_BLOB_STORAGE_CONTAINER_ACCESS_LEVEL
}
