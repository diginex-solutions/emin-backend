module.exports = {}
var mongoose = require('mongoose')
const Feed = mongoose.model('Feed')


const addFeed = async (feed) => {
  return await Feed.newFeed(feed)
}


module.exports.addFeed = addFeed