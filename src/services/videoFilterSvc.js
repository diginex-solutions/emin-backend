module.exports = {}
const mongoose = require('mongoose')
const VideoFilter = mongoose.model('VideoFilter')
const cError = require('../helper/customError')

const ensureDefaultVideoFilters = async() => {
    const defaultVideoFilters = [
        {
            category:"Language",
            subCategory:"English",
            categoryIcon:"language",
            subCategoryIcon:"ic_en",
            language:"english",
            selectionType :"multiple",
             },
            {
            category:"Language",
            subCategory:"Arabic",
            categoryIcon:"language",
            subCategoryIcon:"ic_ar",
            language:"english",
            selectionType :"multiple",
             },
            {
            category:"Language",
            subCategory:"Bengali",
            categoryIcon:"language",
            subCategoryIcon:"ic_bn",
            language:"english",
            selectionType :"multiple",
             },
             {
            category:"Factory",
            subCategory:"All Factories",
            categoryIcon:"factory",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
            {
            category:"Factory",
            subCategory:"Factory1",
            categoryIcon:"factory",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
            {
            category:"Factory",
            subCategory:"Factory2",
            categoryIcon:"factory",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
            {
            category:"Factory",
            subCategory:"Factory3",
            categoryIcon:"factory",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
             {
            category:"Factory",
            subCategory:"Factory4",
            categoryIcon:"factory",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
             {
            category:"Supplier",
            subCategory:"All Supplier",
            categoryIcon:"supplier",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
              {
            category:"Supplier",
            subCategory:"Supplier1",
            categoryIcon:"supplier",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
              {
            category:"Supplier",
            subCategory:"Supplier2",
            categoryIcon:"supplier",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
               {
            category:"Supplier",
            subCategory:"Supplier3",
            categoryIcon:"supplier",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
             {
            category:"Supplier",
            subCategory:"Supplier4",
            categoryIcon:"supplier",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
               {
            category:"Brand/Retailer",
            subCategory:"All Brands",
            categoryIcon:"brand",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
              {
            category:"Brand/Retailer",
            subCategory:"Brand1",
            categoryIcon:"brand",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
              {
            category:"Brand/Retailer",
            subCategory:"Brand2",
            categoryIcon:"brand",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
             
              {
            category:"Brand/Retailer",
            subCategory:"Brand3",
            categoryIcon:"brand",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
             
              {
            category:"Brand/Retailer",
            subCategory:"Brand4",
            categoryIcon:"brand",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
              {
            category:"Spotlight",
            subCategory:"Spotlight1",
            categoryIcon:"spotlight",
            subCategoryIcon:null,
            language:"english",
            selectionType :"multiple",
             },
      ]

      await VideoFilter.deleteAll()
      const lst = await VideoFilter.getAll()
      if (!lst.length){
        defaultVideoFilters.forEach(async (item) => {
            let videoFilter = {
                _id: mongoose.Types.ObjectId(),
                category: item.category,
                subCategory: item.subCategory,
                categoryIcon: item.categoryIcon,
                subCategoryIcon: item.subCategoryIcon,
                language: item.language,
                selectionType : item.selectionType,
            }
            await VideoFilter.newVideoFilter(videoFilter)
          })
      }
      return true;
}

const getVideoFilter = async (language)=>{
    return await VideoFilter.getByLanguage(language)
}

const createVideoFilter = async (videoFilter)=>{
  if(videoFilter.category != null && videoFilter.category != ""){
      videoFilter._id = mongoose.Types.ObjectId();
      return await VideoFilter.newVideoFilter(videoFilter);
  }
  else{
      throw new cError.ResourceNotFoundException('Video filter is null');
  }
} 

const deteVideoFilter = async (vidfilterId)=>{
  const checkExists = await VideoFilter.getById(vidfilterId);
  if(!checkExists){
      throw new cError.ResourceNotFoundException('Video filter not found');
  }
  else{
      return await VideoFilter.deleteAll(2,vidfilterId);
  }
}

module.exports.ensureDefaultVideoFilters = ensureDefaultVideoFilters
module.exports.getVideoFilter = getVideoFilter
module.exports.createVideoFilter = createVideoFilter
module.exports.deteVideoFilter = deteVideoFilter