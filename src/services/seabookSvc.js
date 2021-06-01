module.exports = {}
var mongoose = require('mongoose')
const ChecklistCategory = mongoose.model('ChecklistCategory')
const ChecklistDocument = mongoose.model('ChecklistDocument')
const DocumentPath = mongoose.model('DocumentPath')
const constants = require('../constants')
const cError = require('../helper/customError')

const getAllChecklistCategory = async () => {
  const data = await ChecklistCategory.getAll()
  return data
}

const getChecklistCategoryById = async (id) => {
  const data = await ChecklistCategory.getById(id)
  return data
}

const ensureChecklistCategory = async () => {
    const lst = await ChecklistCategory.getAll()
    if (!lst.length){
      constants.MASTER_DATA.checklistCategory.forEach(async (item) => {
          let data = {
              _id: mongoose.Types.ObjectId(),
              name: item.name,
              department: item.department,
              address: item.address,
              description: item.description,
              instruction: item.instruction,
              documentPath : item.documentPath,
              requiredCriteria : item.requiredCriteria,
              order: item.order
          }
          await ChecklistCategory.createNew(data)
        })
    }
}

const createChecklistCategory = async(chkLstCategory)=>{
  if(chkLstCategory.name != null && chkLstCategory.name != ""){
    chkLstCategory._id = mongoose.Types.ObjectId();
    return await ChecklistCategory.createNew(chkLstCategory);
  }
  else{
    throw new cError.ResourceNotFoundException('Check list category is null');
  }
}

const deleteChecklistCategoryById = async(chkLstCatId) => {
  const checkExists = await ChecklistCategory.getById(chkLstCatId);
  if(!checkExists){
      throw new cError.ResourceNotFoundException('Check list category not found');
  }
  else{
      return await ChecklistCategory.deleteOne(chkLstCatId);
  }
}

const deleteAllChecklistCategory = async () => {
    await ChecklistCategory.deleteAll()
}

const getAllChecklistDocument = async () => {
    const data = await ChecklistDocument.getAll()
    return data
  }
  
  const getChecklistDocumentById = async (id) => {
    const data = await ChecklistDocument.getById(id)
    return data
  }
  
  const ensureChecklistDocument = async () => {
      const lst = await ChecklistDocument.getAll()
      if (!lst.length){
        //await ChecklistDocument.deleteAll()
        constants.MASTER_DATA.checklistDocument.forEach(async (item) => {
            let data = {
                _id: mongoose.Types.ObjectId(),
                docId: item.docId,
                documentType: item.documentType,
                description: item.description,
                status: item.status,
                files: item.files,
                expiredAt : item.expiredAt,
                locations : item.locations,
            }
            await ChecklistDocument.createNew(data)
          })
      }
  }

  const createChecklistDocument = async(chkLstDocument) =>{
    chkLstDocument._id = mongoose.Types.ObjectId();
    return await ChecklistDocument.createNew(chkLstDocument);
  }

  const deleteChecklistDocumentById = async(chkLstDocId) =>{
    const checkExists = await ChecklistDocument.getById(chkLstDocId);
    if(!checkExists){
      throw new cError.ResourceNotFoundException('Check list doccument not found');
    }
    else{
      return await ChecklistDocument.deleteOne(chkLstDocId);
    }
  }  

const deleteAllChecklistDocument = async () => {
    await ChecklistDocument.deleteAll()
}

const getAllDocumentPath = async () => {
    const data = await DocumentPath.getAll()
    return data
  }
  
  const getDocumentPathById = async (id) => {
    const data = await DocumentPath.getById(id)
    return data
  }
  
  const ensureDocumentPath = async () => {
      const lst = await DocumentPath.getAll()
      if (!lst.length){
        //await DocumentPath.deleteAll()
        constants.MASTER_DATA.documentPath.forEach(async (item) => {
            let data = {
                _id: mongoose.Types.ObjectId(),
                name: item.name,
                order: item.order
            }
            await DocumentPath.createNew(data)
          })
      }
  }

  const createDocumentPath = async(documentPath)=>{
    if(documentPath.name != null && documentPath.name != ""){
      documentPath._id = mongoose.Types.ObjectId();
      return await DocumentPath.createNew(documentPath);
    }
    else{
      throw new cError.ResourceNotFoundException("Document path is null");
    }
  }
  
  const deleteDocumentPathById = async(docId)=>{
    const checkExists = await DocumentPath.getById(docId);
    if(!checkExists){
      throw new cError.ResourceNotFoundException("Document path not found");
    }
    else{
      return await DocumentPath.deleteOne(docId);
    }
  }  

const deleteAllDocumentPath = async () => {
    await DocumentPath.deleteAll()
}

module.exports.getAllChecklistCategory = getAllChecklistCategory
module.exports.getChecklistCategoryById = getChecklistCategoryById
module.exports.ensureChecklistCategory = ensureChecklistCategory
module.exports.deleteAllChecklistCategory = deleteAllChecklistCategory
module.exports.createChecklistCategory = createChecklistCategory
module.exports.deleteChecklistCategoryById = deleteChecklistCategoryById

module.exports.getAllChecklistDocument = getAllChecklistDocument
module.exports.getChecklistDocumentById = getChecklistDocumentById
module.exports.ensureChecklistDocument = ensureChecklistDocument
module.exports.deleteAllChecklistDocument = deleteAllChecklistDocument
module.exports.createChecklistDocument = createChecklistDocument
module.exports.deleteChecklistDocumentById = deleteChecklistDocumentById

module.exports.getAllDocumentPath = getAllDocumentPath
module.exports.getDocumentPathById = getDocumentPathById
module.exports.ensureDocumentPath = ensureDocumentPath
module.exports.deleteAllDocumentPath = deleteAllDocumentPath
module.exports.createDocumentPath = createDocumentPath
module.exports.deleteDocumentPathById = deleteDocumentPathById