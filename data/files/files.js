var mongoose = require('mongoose');
const files = [
  {
    "_id" : mongoose.Types.ObjectId("5e68a9a860fd9c6e849d88b9"),
    "isFolder" : false,
    "category" : "file",
    "archived" : false,
    "versionId": mongoose.Types.ObjectId("5e745b828bc24803a8ad9647"),
    "versions" : [
        {
            "current" : true,
            "_id" : mongoose.Types.ObjectId("5e745b828bc24803a8ad9647"),
            "uploaded" : 1584683905777.0,
            "size" : 501,
            "storage" : "https://diginextrustdev.blob.core.windows.net/files/5d4328945a5110ee4ed30267/5e745b818bc24803a8ad9645",
            "status" : 0,
            "hash" : "ce3e53257a1ad67a5e523207b869e89dc08f61e86ae0620bb8ec496d3184ce31"
        }
    ]
  },
  {
      "_id" : mongoose.Types.ObjectId("5e69a8c86359550cc9db0038"),
      "isFolder" : true,
      "category" : "file",
      "archived" : false,
      "versionId": mongoose.Types.ObjectId("5e745b998bc24803a8ad964a"),
      "versions" : [
          {
              "current" : true,
              "_id" : mongoose.Types.ObjectId("5e745b998bc24803a8ad964a"),
              "size" : 0,
              "storage" : "",
              "status" : -1
          }
      ]
  },
  {
      "_id" : mongoose.Types.ObjectId("5e69a8c86359550cc9db003a"),
      "isFolder" : true,
      "category" : "file",
      "archived" : false,
      "versionId": mongoose.Types.ObjectId("5e745b998bc24803a8ad964b"),
      "versions" : [
          {
              "current" : true,
              "_id" : mongoose.Types.ObjectId("5e745b998bc24803a8ad964b"),
              "size" : 0,
              "storage" : "",
              "status" : -1
          }
      ]
  }
];


module.exports = files
