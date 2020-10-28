const API = require("./api-unit")

class FilesAPI extends API {
  constructor(jwt) {
    super(jwt)
  }

  listFiles = () => {
    return this.withHeaders(
      this.req().
        get('/documents')
    )
  }

  createFolder = (path) => {
    return this.withHeaders(
      this.req().
        post('/folders/create').
        send(path)
    )
  }

  moveFiles = (documents, pathAfter) => {
    return this.withHeaders(
      this.req().
        put('/folders/move').
        send({
          documents,
          pathAfter
        })
    )
  }

  renameFolder = (documents, pathAfter) => {
    return this.withHeaders(
      this.req().
        put(`/folders/rename`).
        send({
          documents,
          pathAfter
        })
    )
  }

  deleteFolder = (path) => {
    return this.withHeaders(
      this.req().
        post('/folders/delete').
        send(path)
    )
  }

  renameFile = (fileId, name) => {
    return this.withHeaders(
      this.req().
        put(`/documents/${fileId}`).
        send({name})
    )
  }

  batchArchiveFiles = (archived, fileIds) => {
    return this.withHeaders(
      this.req().
        put('/documents/update-archived').
        send({
          archived,
          documents: fileIds
        })
    )
  }
}

module.exports = FilesAPI