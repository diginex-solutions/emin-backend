module.exports = {}
var mongoose = require('mongoose')
const UserVideo = mongoose.model('UserVideo')


const addUserVideo = async (userId, videoId) => {
  await UserVideo.create(userId, videoId)
}


module.exports.addUserVideo = addUserVideo
