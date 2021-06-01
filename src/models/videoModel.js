var mongoose = require('mongoose')
var model = 'Video'
var VideoSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId },
    url: {type: String},
    title: {type: String},
    description: {type: String},
    thumbnailUrl: {type: String},
    uploadDate: {type: Number},
    viewCount : {type: Number},
    duration : {type: Number},
    audience : {type: String},
    language: {type: String},
    extension: {type: String},
    factory : {type: String},
    supplier: {type: String},
    brand : {type: String},
    spotlight: {type: String}
  },
  {
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false,
  }
)

VideoSchema.statics.newVideo = function (video) {
  return this.create(video)
}

VideoSchema.statics.getById = function (id) {
  return this.findOne({ _id: id }).exec()
}

VideoSchema.statics.getByUrl = function (url) {
  return this.findOne({ url: url }).exec()
}

VideoSchema.statics.getAll = function () {
  return this.find({}).exec()
}

VideoSchema.statics.deleteById = function (videoId) {
  return this.findOneAndDelete({ _id: videoId}).exec()
}

VideoSchema.statics.updateViewCount = function (id) {
  return this.findOneAndUpdate({ _id: id }, { $inc: {viewCount: 1}}).lean()
}

VideoSchema.statics.deleteAll = function () {
  return this.deleteMany({}).exec()
}

VideoSchema.statics.upsertByUrl = async function (video){
  const options = { upsert: true, new: true }
  return this.findOneAndUpdate(
      { url: video.url }, 
      { url: video.url, 
        title: video.title, 
        description: video.description, 
        thumbnailUrl: video.thumbnailUrl, 
        uploadDate: video.uploadDate, 
        viewCount: video.viewCount, 
        duration: video.duration, 
        audience: video.audience, 
        language: video.language, 
        extension: video.extension, 
        factory: video.factory, 
        supplier: video.supplier, 
        brand: video.brand, 
        spotlight: video.spotlight }, 
      options)
}

VideoSchema.statics.getPopularVideos = function (params){
  var query = {}
  //language - multiple value
  if (params.language) {
    let subq = {};
    subq["$in"] = [];
    let arr = params.language.split(',');
    var optRegexp = [];
    arr.forEach(function(opt){
        optRegexp.push(new RegExp("^" + opt, "i"));
    });
    subq["$in"] = optRegexp;
    query["language"]= subq;
  }
  // extension - multiple values
  if (params.extension){
    let subq = {};
    subq["$in"] = [];
    let arr = params.extension.split(',');
    var optRegexp = [];
    arr.forEach(function(opt){
        optRegexp.push(new RegExp("^" + opt, "i"));
    });
    subq["$in"] = optRegexp;
    query["extension"]= subq;
  }
  // factory- multiple values
  if (params.factory){
    let subq = {};
    subq["$in"] = [];
    let arr = params.factory.split(',');
    var optRegexp = [];
    arr.forEach(function(opt){
        optRegexp.push(new RegExp("^" + opt, "i"));
    });
    subq["$in"] = optRegexp;
    query["factory"]= subq;
  }
  // supplier- multiple values
  if (params.supplier){
    let subq = {};
    subq["$in"] = [];
    let arr = params.supplier.split(',');
    var optRegexp = [];
    arr.forEach(function(opt){
        optRegexp.push(new RegExp("^" + opt, "i"));
    });
    subq["$in"] = optRegexp;
    query["supplier"]= subq;
  }
  // brand- multiple values
  if (params.brand){
    let subq = {};
    subq["$in"] = [];
    let arr = params.brand.split(',');
    var optRegexp = [];
    arr.forEach(function(opt){
        optRegexp.push(new RegExp("^" + opt, "i"));
    });
    subq["$in"] = optRegexp;
    query["brand"]= subq;
  }
  // spotlight- multiple values
  if (params.spotlight){
    let subq = {};
    subq["$in"] = [];
    let arr = params.spotlight.split(',');
    var optRegexp = [];
    arr.forEach(function(opt){
        optRegexp.push(new RegExp("^" + opt, "i"));
    });
    subq["$in"] = optRegexp;
    query["spotlight"]= subq;
  }

  return this.find(query).sort({viewCount: -1}).exec()
}

VideoSchema.statics.getRecentVideos = function (params){
  var query = {}
  //language - multiple value
  if (params.language) {
    let subq = {};
    subq["$in"] = [];
    let arr = params.language.split(',');
    var optRegexp = [];
    arr.forEach(function(opt){
        optRegexp.push(new RegExp("^" + opt, "i"));
    });
    subq["$in"] = optRegexp;
    query["language"]= subq;
  }
  // extension - multiple values
  if (params.extension){
    let subq = {};
    subq["$in"] = [];
    let arr = params.extension.split(',');
    var optRegexp = [];
    arr.forEach(function(opt){
        optRegexp.push(new RegExp("^" + opt, "i"));
    });
    subq["$in"] = optRegexp;
    query["extension"]= subq;
  }
  // factory- multiple values
  if (params.factory){
    let subq = {};
    subq["$in"] = [];
    let arr = params.factory.split(',');
    var optRegexp = [];
    arr.forEach(function(opt){
        optRegexp.push(new RegExp("^" + opt, "i"));
    });
    subq["$in"] = optRegexp;
    query["factory"]= subq;
  }
  // supplier- multiple values
  if (params.supplier){
    let subq = {};
    subq["$in"] = [];
    let arr = params.supplier.split(',');
    var optRegexp = [];
    arr.forEach(function(opt){
        optRegexp.push(new RegExp("^" + opt, "i"));
    });
    subq["$in"] = optRegexp;
    query["supplier"]= subq;
  }
  // brand- multiple values
  if (params.brand){
    let subq = {};
    subq["$in"] = [];
    let arr = params.brand.split(',');
    var optRegexp = [];
    arr.forEach(function(opt){
        optRegexp.push(new RegExp("^" + opt, "i"));
    });
    subq["$in"] = optRegexp;
    query["brand"]= subq;
  }
  // spotlight- multiple values
  if (params.spotlight){
    let subq = {};
    subq["$in"] = [];
    let arr = params.spotlight.split(',');
    var optRegexp = [];
    arr.forEach(function(opt){
        optRegexp.push(new RegExp("^" + opt, "i"));
    });
    subq["$in"] = optRegexp;
    query["spotlight"]= subq;
  }
  
  // const now = new Date()
  // query["uploadDate"] = { $gte: now.setMonth(now.getMonth() -3)}

  return this.find(query).sort({uploadDate: -1}).exec()
}

const Video = mongoose.model(model, VideoSchema)
module.exports = Video
