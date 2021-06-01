const videoFilterSvc = require('../services/videoFilterSvc')
const videoSvc = require('../services/videoSvc')
const userVideoSvc = require('../services/userVideoSvc')
const cError = require('../helper/customError')


async function getVideoFilter(req, res, next) {
  const videoFilters = await videoFilterSvc.getVideoFilter(req.params.language)
  res.json(videoFilters)
}

async function createVideoFilter(req, res, next){
    await videoFilterSvc.createVideoFilter(req.body);
    res.json({success:true});
}

async function deleteVideoFilter(req, res, next){
    await videoFilterSvc.deteVideoFilter(req.params.vidfilterId)
    res.json({success: true})
}

async function updateViewCount(req, res, next) {
    const video = await videoSvc.updateViewCount(req.params.videoId)
    if (!video){
        throw new cError.ResourceNotFoundException('Video not found')
    }
    res.json(video.viewCount + 1)
}

async function updateWatchStatus(req, res, next) {
    await userVideoSvc.addUserVideo(req.decoded.userId, req.params.videoId)
    res.json({success: true})
}

async function getPopularVideos(req, res, next) {
    const videos = await videoSvc.getPopularVideos(req.decoded.userId, req.query)
    res.json(videos)
}

async function getRecentVideos(req, res, next) {
    const videos = await videoSvc.getRecentVideos(req.decoded.userId, req.query)
    res.json(videos)
}

async function getAllVideos(req, res, next){
    const videos = await videoSvc.getAll()
    res.json(videos)
}

async function deleteVideo(req, res, next){
    await videoSvc.deleteById(req.params.videoId)
    res.json({success: true})
}

async function upsertVideo(req, res, next){
    await videoSvc.upsertVideo(req.body)
    res.json({success: true})
}

module.exports = {
    getVideoFilter,
    createVideoFilter,
    deleteVideoFilter,
    updateViewCount,
    updateWatchStatus,
    getPopularVideos,
    getRecentVideos,
    getAllVideos,
    deleteVideo,
    upsertVideo
}
