const chai = require('chai');
const { expect } = chai;
const FilesApi = require('../api/files-api-units')
const { reservedPaths, initialNumFiles, archivedFullpath }= require('../constants')
const shared = require('../util/shared')

module.exports = function(jwt, param){
  const filesApi = new FilesApi(jwt)

  describe(`Files features`, function() {

    it('🎯 should list documents', function() {
      return filesApi.listFiles()
      .expect('Content-Type', /json/)
      .expect(200)
      .then(res => {
        expect(res.body).to.be.a('array').and.have.lengthOf(initialNumFiles)
      })
    });

    it('🎯 should rename documents', async function() {
      const fileList = await filesApi.listFiles()
      expect(fileList).have.property('status', 200);
      expect(fileList.body).to.be.a('array').and.have.lengthOf(initialNumFiles)

      const file = fileList.body.filter(i => reservedPaths.indexOf(i.fullpath) === -1)[0]
      const newName =  `${file.name}-${Date.now()}`
      const newFileRes = await filesApi.renameFile(file.id, newName)
      expect(newFileRes).have.property('status', 200);
      expect(newFileRes.body.name).to.equal(newName);
      expect(newFileRes.body.extension).to.equal(file.extension);
      expect(newFileRes.body.path).to.equal(file.path);
      expect(newFileRes.body.fullpath).to.not.equal(file.fullpath);
    });

    it('🎯 should archive files and folder with all of the files within', async function() {
      const folderAlice = '/alice'
      const folderAlicePhotos = '/alice/photos'
      await shared.shouldArchiveFileAndFolderBranch(filesApi, initialNumFiles, folderAlice, folderAlicePhotos)
    });

    it('🎯 should restore files to its original path', async function() {
      const folderAlice = '/alice'
      const folderAlicePhotos = '/alice/photos'
      await shared.shouldArchiveFileAndFolderBranch(filesApi, initialNumFiles, folderAlice, folderAlicePhotos)

      const fileList = await filesApi.listFiles()
      expect(fileList).have.property('status', 200);
      const readmeFile = fileList.body.find(i => i.isFolder === false )

      const parentFolderId = fileList.body.filter(i => i.fullpath === `/archived${folderAlice}` ).map(i => i.id) // just take parent folder
      const archiveRes = await filesApi.batchArchiveFiles(false, [readmeFile.id, ...parentFolderId])
      expect(archiveRes).have.property('status', 200);
      expect(archiveRes.body.success).to.equal(true);

      const fileListNew = await filesApi.listFiles()
      expect(fileListNew).have.property('status', 200);
      const filePathNew = fileListNew.body.map(i => i.fullpath)
      const expectedArchivedFilePath = [folderAlice, folderAlicePhotos, readmeFile.fullpath.replace(archivedFullpath, '')]
      expect(filePathNew).to.include.all.members(expectedArchivedFilePath)

    });

  });
}


