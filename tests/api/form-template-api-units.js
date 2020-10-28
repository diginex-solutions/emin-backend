const API = require("./api-unit")

class FormTemplateApi extends API {
  constructor(jwt) {
    super(jwt)
  }

  listTemplate = () => {
    return this.withHeaders(
      this.req().
        get('/templates')
    )
  }

  createTemplate = (template) => {
    return this.withHeaders(
      this.req().
        post('/templates').
        send(template)
    )
  }

  deleteTemplate = (templateId) => {
    return this.withHeaders(
      this.req().delete(`/templates/${templateId}`)
    )
  }

  updateTemplate = (templateId, template) => {
    return this.withHeaders(
      this.req().
        put(`/templates/${templateId}`).
        send(template)
    )
  }
}

module.exports = FormTemplateApi