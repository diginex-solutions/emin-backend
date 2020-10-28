
const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const { expect } = chai
const FormTemplateApi = require('../api/form-template-api-units')
const shared = require('../util/shared')
const _ = require('lodash')
const { sampleTemplate }= require('../constants')

module.exports = function(jwt, param) {
  const formTemplateApi = new FormTemplateApi(jwt)

  const template = sampleTemplate()

  describe(`Template features`, function() {
    it('🎯 should create templates', async function() {
      const templateCreated = await shared.shouldCreateATemplate(formTemplateApi, template)
      const listRes = await formTemplateApi.listTemplate()
      expect(listRes).have.property('status', 200)
      expect(listRes.body).to.be.a('array').and.have.lengthOf(1)
      expect(listRes.body[0]).deep.equal(templateCreated)
    })

    it('🎯 should delete templates', async function() {
      const templateCreated = await shared.shouldCreateATemplate(formTemplateApi, template)
      const templateDeletedRes = await formTemplateApi.deleteTemplate(templateCreated.id)
      expect(templateDeletedRes).have.property('status', 200)
      expect(templateDeletedRes.body).deep.equal(templateCreated)
    })

    it('🎯 should modify templates', async function() {
      const templateCreated = await shared.shouldCreateATemplate(formTemplateApi, template)
      const inputId1New = '7a14ddd4-64ff-11ea-bc55-0242ac130003'
      const templateNew = sampleTemplate(inputId1New)

      const templateUpdatedRes = await formTemplateApi.updateTemplate(templateCreated.id, templateNew)
      expect(templateUpdatedRes).have.property('status', 200)
      await shared.validateTemplateRes(templateNew, templateUpdatedRes)
    })

    describe("If Id in `input` does not match Id in `languages`", function () {
      let templateNew = _.cloneDeep(template)
      templateNew.inputs[0].id = 'zzz'

      it('🎯 should reject create template', async function() {
        const templateCreated = await formTemplateApi.createTemplate(formTemplateApi, templateNew)
        expect(templateCreated).have.property('status', 422)
        expect(templateCreated.body.message).to.have.string('Request contains conflict(s)');
      })

      it('🎯 should reject modify template', async function() {
        const templateCreated = await shared.shouldCreateATemplate(formTemplateApi, template)

        const templateUpdatedRes = await formTemplateApi.updateTemplate(templateCreated.id, templateNew)
        expect(templateUpdatedRes).have.property('status', 422)
        expect(templateUpdatedRes.body.message).to.have.string('Request contains conflict(s)');
      })
    })


    describe("If Id of options in `inputs` does not match in `languages`", function () {
      let templateNew = _.cloneDeep(template)
      const original = templateNew.inputs[1].options[0].id
      templateNew.inputs[1].options[0].id = '999'

      it('🎯 should reject create template', async function() {
        const templateCreatedRes = await formTemplateApi.createTemplate(templateNew)
        expect(templateCreatedRes).have.property('status', 422)
        expect(templateCreatedRes.body.message).to.have.string('Request contains conflict(s)');
      })

      it('🎯 should reject modify template', async function() {
        const templateCreated = await shared.shouldCreateATemplate(formTemplateApi, template)

        const templateUpdatedRes = await formTemplateApi.updateTemplate(templateCreated.id, templateNew)
        expect(templateUpdatedRes).have.property('status', 422)
        expect(templateUpdatedRes.body.message).to.have.string('Request contains conflict(s)');
      })

    })

    // describe("If # of items in inputs does not match languages", function () { // need fix before test, proper check additional items in inputs, languages, languages[].options
    //   let templateNew = _.cloneDeep(template)
    //   templateNew.inputs.push()
    //   it('🎯 should reject create template', async function() {

    //   })
    // })

  })
}
