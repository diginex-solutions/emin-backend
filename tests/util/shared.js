const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const { expect } = chai;
const { reservedPaths }= require('../constants')

exports.shouldMoveMFilesToFolder = async function(filesApi, folderAlice, folderBob, folderClassroom) {

  const createAlice = await filesApi.createFolder({path: folderAlice})
  expect(createAlice).have.property('status', 200);

  const createBob = await filesApi.createFolder({path: folderBob})
  expect(createBob).have.property('status', 200);

  const filesResOld = await filesApi.listFiles()
  const fileIds = filesResOld.body.filter(i => reservedPaths.indexOf(i.fullpath) === -1).map(i => i.id)

  const createClassroom = await filesApi.createFolder({path: folderClassroom})
  expect(createClassroom).have.property('status', 200);

  const expectedMoveOutput = fileIds.map(fId => {return {id: fId, success: true}})
  const finalPaths = [
    folderClassroom,
    ...reservedPaths,
    ...filesResOld.body.
      filter(i => reservedPaths.indexOf(i.fullpath) === -1).
      map(i => `${folderClassroom}${i.fullpath}`)
  ]

  const moveRes = await filesApi.moveFiles(fileIds, folderClassroom)

  expect(moveRes).have.property('status', 200);
  expect(moveRes.body.success).to.equal(true)
  expect(moveRes.body.documents).to.be.a('array').and.have.lengthOf(expectedMoveOutput.length);
  expect(moveRes.body.documents).to.include.deep.members(expectedMoveOutput);

  const filesRes = await filesApi.listFiles()
  expect(filesRes).have.property('status', 200);
  const fullpaths = filesRes.body.map(item => item.fullpath)
  expect(fullpaths).to.be.a('array').and.have.lengthOf(finalPaths.length);
  expect(fullpaths).to.include.members(finalPaths);
};

exports.shouldArchiveFileAndFolderBranch = async function(filesApi, initialNumFiles, folderAlice, folderAlicePhotos) {
  const createRes = await filesApi.createFolder({path: folderAlice})
  expect(createRes).have.property('status', 200);
  expect(createRes.body.path).equal(folderAlice)

  const createSubRes = await filesApi.createFolder({path: folderAlicePhotos})
  expect(createSubRes).have.property('status', 200);
  expect(createSubRes.body.path).equal(folderAlicePhotos)

  const fileList = await filesApi.listFiles()
  expect(fileList).have.property('status', 200);
  expect(fileList.body).to.be.a('array').and.have.lengthOf(initialNumFiles + 2)
  const archivedFlag = fileList.body.filter(i => reservedPaths.indexOf(i.fullpath) === -1).map(i => i.archived)
  expect(archivedFlag.filter(i => i === false)).to.be.a('array').and.have.have.lengthOf(initialNumFiles)

  const readmeFile = fileList.body.find(i => i.isFolder === false )

  const parentFolderId = fileList.body.filter(i => i.fullpath === folderAlice || i.isFolder === false ).map(i => i.id) // just take parent folder and readme.md
  const archiveRes = await filesApi.batchArchiveFiles(true, [readmeFile.id, ...parentFolderId])
  expect(archiveRes).have.property('status', 200);
  expect(archiveRes.body.success).to.equal(true);

  const fileListNew = await filesApi.listFiles()
  expect(fileListNew).have.property('status', 200);
  expect(fileListNew.body).to.be.a('array').and.have.lengthOf(initialNumFiles + 2)
  expect(fileListNew.body.filter(i => i.archived)).to.be.a('array').and.have.lengthOf(4)

  const filePathNew = fileListNew.body.map(i => i.fullpath)

  const expectedArchivedFilePath = [`/archived${folderAlice}`, `/archived${folderAlicePhotos}`, `/archived${readmeFile.fullpath}`]
  expect(filePathNew).to.include.all.members(expectedArchivedFilePath)
};

exports.validateTemplateRes = async function (template, templateCreatedRes ) {
  expect(templateCreatedRes).have.property('status', 200)
  const templateCreated = templateCreatedRes.body
  expect(templateCreated.name).to.equal(template.name)
  expect(templateCreated.id).to.be.a('string').and.have.lengthOf.above(0)
  expect(templateCreated.userId).to.be.a('string').and.have.lengthOf.above(0)

  for (const [i, input] of templateCreated.inputs.entries()) {
    expect(input).have.deep.property('id', template.inputs[i].id)
    expect(input).have.deep.property('type', template.inputs[i].type)
    expect(input).have.deep.property('options', template.inputs[i].options)
    expect(input).have.deep.property('value', null)
  }
  for (const [i, language] of templateCreated.languages.entries()) {
    expect(language).to.have.deep.property('lang', template.languages[i].lang)
    for (const [j, input] of language.inputs.entries()) {
      expect(input).have.deep.property('id', template.languages[i].inputs[j].id)
      expect(input).have.deep.property('label', template.languages[i].inputs[j].label)
      expect(input).have.deep.property('options', template.languages[i].inputs[j].options)
      expect(input).have.deep.property('value', null)
    }
  }
}

exports.shouldCreateATemplate = async function(formTemplateApi, template) {
  const createRes = await formTemplateApi.createTemplate(template)
  this.validateTemplateRes(template, createRes)
  return  createRes.body
}
