const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const { expect } = chai;
const FilesApi = require('../api/files-api-units')
const shared = require('../util/shared')
const { reservedPaths }= require('../constants')

module.exports = function(jwt, param){
  const filesApi = new FilesApi(jwt)

  describe(`Folder features`, function() {

    const rootFolder = '/'
    const folderClassroom = '/classroom'
    const folderGymroom = '/gymroom'

    const folderAlice = '/alice'
    const folderAlicePhotos = '/alice/photos'

    const folderBob = '/bob'
    const folderBobPhotos = '/bob/photos'

    it('🎯 should reject when creating folder with its parent does not exist', function() {
      return filesApi.createFolder({path: folderAlicePhotos})
      .expect("Content-Type", /json/)
      .expect(422)
    });

    it('🎯 should create folder', async function() {
      const createRes = await filesApi.createFolder({path: folderAlice})
      expect(createRes).have.property('status', 200);
      expect(createRes.body.path).equal(folderAlice)
    });

    it('🎯 should create subfolder', async function() {
      const createRes = await filesApi.createFolder({path: folderAlice})
      expect(createRes).have.property('status', 200);
      expect(createRes.body.path).equal(folderAlice)

      const createSubRes = await filesApi.createFolder({path: folderAlicePhotos})
      expect(createSubRes).have.property('status', 200);
      expect(createSubRes.body.path).equal(folderAlicePhotos)
    });

    it('🎯 should reject when create folder that already exists', async function() {
      const createSub = await filesApi.createFolder({path: folderAlice})
      expect(createSub).have.property('status', 200);

      const createSubReject = await filesApi.createFolder({path: folderAlice})
      expect(createSubReject).have.property('status', 422);
      expect(createSubReject.body.message).to.have.string('already exists');

    });

    it('🎯 should reject moving files to non-exist folder', async function() {
      const createRes = await filesApi.createFolder({path: folderAlice})
      expect(createRes).have.property('status', 200);
      const fileId = createRes.body.id

      const moveRes = await filesApi.moveFiles([fileId], '/somePathNeverCreated')
      expect(moveRes).have.property('status', 422);
      expect(moveRes.body.message).to.have.string('Target folder does not exist');

    });

    it('🎯 should move multiple files to a folder', async function() {
      await shared.shouldMoveMFilesToFolder(filesApi, folderAlice, folderBob, folderClassroom)
    });

    it('🎯 should move dir to within another dir', async function() {
      await shared.shouldMoveMFilesToFolder(filesApi, folderAlice, folderBob, folderClassroom)

      const filesResOld = await filesApi.listFiles()
      const fileIds = filesResOld.body.filter(i => i.fullpath === folderClassroom).map(i => i.id)

      const createGymroom = await filesApi.createFolder({path: folderGymroom})
      expect(createGymroom).have.property('status', 200);

      const expectedMoveOutput = fileIds.map(fId => {return {id: fId, success: true}})
      const finalPaths = [
        folderGymroom,
        ...reservedPaths,
        ...filesResOld.body.filter(i => reservedPaths.indexOf(i.fullpath) === -1).map(i => `${folderGymroom}${i.fullpath}`)]

      const moveRes = await filesApi.moveFiles(fileIds, folderGymroom)
      expect(moveRes).have.property('status', 200)
      expect(moveRes.body.success).to.equal(true)
      expect(moveRes.body.documents).to.be.a('array').and.have.lengthOf(fileIds.length)
      expect(moveRes.body.documents).to.include.deep.members(expectedMoveOutput);

      const filesRes = await filesApi.listFiles()
      expect(filesRes).have.property('status', 200);

      const fullpaths = filesRes.body.map(item => item.fullpath)
      expect(fullpaths).to.be.a('array').and.have.lengthOf(finalPaths.length);
      expect(fullpaths).to.include.members(finalPaths);
    });

    it('🎯 should reject delete folder with files within', async function() {
      await shared.shouldMoveMFilesToFolder(filesApi, folderAlice, folderBob, folderClassroom)
      const deleteRes = await filesApi.deleteFolder({path: folderClassroom})
      expect(deleteRes).have.property('status', 422);
      expect(deleteRes.body.message).to.have.string('You have to remove all the items in this folder before you can delete the folder.');
    });

    it('🎯 should delete folder without files within', async function() {
      await shared.shouldMoveMFilesToFolder(filesApi, folderAlice, folderBob, folderClassroom)
      const deleteARes = await filesApi.deleteFolder({path: `${folderClassroom}${folderAlice}`})
      expect(deleteARes).have.property('status', 200);
      expect(deleteARes.body.path).equal(`${folderClassroom}${folderAlice}`)

      const deleteBRes = await filesApi.deleteFolder({path: `${folderClassroom}${folderBob}`})
      expect(deleteBRes).have.property('status', 200);
      expect(deleteBRes.body.path).equal(`${folderClassroom}${folderBob}`)

      const filesResOld = await filesApi.listFiles()
      const fileIds = filesResOld.body.filter(i => i.name).map(i => i.id)

      const moveRes = await filesApi.moveFiles(fileIds, rootFolder)
      expect(moveRes).have.property('status', 200);
      expect(moveRes.body.success).to.equal(true)

      const deleteRes = await filesApi.deleteFolder({path: `${folderClassroom}`})
      expect(deleteRes).have.property('status', 200);
      expect(deleteRes.body.path).equal(`${folderClassroom}`)

      const filesRes = await filesApi.listFiles()
      expect(filesRes).have.property('status', 200);
      expect(filesRes.body.filter(i => reservedPaths.indexOf(i.fullpath) === -1).map(i => i.isFolder)).to.not.include(true);
    });

    it('🎯 should rename folder with files within', async function() {
      await shared.shouldMoveMFilesToFolder(filesApi, folderAlice, folderBob, folderClassroom)

      const filesRes = await filesApi.listFiles()
      expect(filesRes).have.property('status', 200);

      const fileIdsToRename = filesRes.body.filter(i => i.fullpath === folderClassroom).map(i => i.id)
      const filePathExpected = filesRes.body.filter(i => i.fullpath.startsWith(folderClassroom)).map(i => i.fullpath.replace(folderClassroom, folderGymroom))

      const renameRes = await filesApi.renameFolder(fileIdsToRename, folderGymroom)
      expect(renameRes).have.property('status', 200);

      const filesResNew = await filesApi.listFiles()
      const filePathNew = filesResNew.body.map(i => i.fullpath)
      expect(filePathNew).to.include.deep.members(filePathExpected);
    });

  });
}