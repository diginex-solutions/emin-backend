module.exports = {}
var mongoose = require('mongoose')
const Video = mongoose.model('Video')
const UserVideo = mongoose.model('UserVideo')


const updateViewCount = async(videoId) =>{
    return await Video.updateViewCount(videoId)
}

const ensureDefaultVideos = async() => {
    const defaultVideos = [
        {
            url: "https://www.youtube.com/watch?v=OienVM8HvTE&feature=youtu.be",
            title: "COVID-19 Safe Living in Dorms - Prevention",
            description: 'To promote “Safe Living in Dormitories”, this video informs employers and workers (particularly migrant workers) on steps that can be taken to prevent the spread of COVID-19 (and other viruses), keep common areas safe and ensure the well-being of dormitory residents.  Resources for residents who wish to seek mental health support and/or receive latest updates about COVID-19 are also included.',
            thumbnailUrl: "",
            uploadDate: new Date(),
            viewCount : 0,
            duration : 242,
            audience : "For Workers",
            language: "Khmer",
            extension: "mp4",
            factory : "Factory1",
            supplier: "Supplier2",
            brand : "Brand3",
            spotlight: "Spotlight1"
        },
        {
            url: "https://www.youtube.com/watch?v=TuyVK6utdgQ&feature=youtu.be",
            title: "COVID-19 Safe Living in Dorms - Reaction",
            description: 'To promote “Safe Living in Dormitories” this video informs workers (particularly migrant workers) on what to do if they experience symptoms of COVID-19 or have been in close contact with someone with symptoms.  This is to minimize the spread of COVID-19 and ensure safety for all dormitory residents.  Resources for dormitory residents who wish to seek medical help and/or receive latest updates about COVID-19 are also included.',
            thumbnailUrl: "",
            uploadDate: new Date(),
            viewCount : 0,
            duration : 208,
            audience : "For Workers",
            language: "Khmer",
            extension: "mp4",
            factory : "Factory1",
            supplier: "Supplier2",
            brand : "Brand3",
            spotlight: "Spotlight1"
        },
        {
            url: "https://www.youtube.com/watch?v=ynDFWPfVAnk&feature=youtu.be",
            title: "COVID-19 Safe Living in Dorms - Prevention",
            description: 'To promote “Safe Living in Dormitories”, this video informs employers and workers (particularly migrant workers) on steps that can be taken to prevent the spread of COVID-19 (and other viruses), keep common areas safe and ensure the well-being of dormitory residents.  Resources for residents who wish to seek mental health support and/or receive latest updates about COVID-19 are also included.',
            thumbnailUrl: "",
            uploadDate: new Date(),
            viewCount : 0,
            duration : 186,
            audience : "For Workers",
            language: "Burmese",
            extension: "mp4",
            factory : "Factory1",
            supplier: "Supplier2",
            brand : "Brand3",
            spotlight: "Spotlight1"
        },
        {
            url: "https://www.youtube.com/watch?v=IU24p6TSV5w&feature=youtu.be",
            title: "COVID-19 Safe Living in Dorms - Reaction",
            description: 'To promote “Safe Living in Dormitories” this video informs workers (particularly migrant workers) on what to do if they experience symptoms of COVID-19 or have been in close contact with someone with symptoms.  This is to minimize the spread of COVID-19 and ensure safety for all dormitory residents.  Resources for dormitory residents who wish to seek medical help and/or receive latest updates about COVID-19 are also included.',
            thumbnailUrl: "",
            uploadDate: new Date(),
            viewCount : 0,
            duration : 169,
            audience : "For Workers",
            language: "Burmese",
            extension: "mp4",
            factory : "Factory1",
            supplier: "Supplier2",
            brand : "Brand3",
            spotlight: "Spotlight1"
        },
        {
            url: "https://www.youtube.com/watch?v=p4jxOImLNgQ&feature=youtu.be",
            title: "COVID -19 Safe Living in Dorms - Prevention",
            description: 'To promote “Safe Living in Dormitories”, this video informs employers and workers (particularly migrant workers) on steps that can be taken to prevent the spread of COVID-19 (and other viruses), keep common areas safe and ensure the well-being of dormitory residents.  Resources for residents who wish to seek mental health support and/or receive latest updates about COVID-19 are also included. ',
            thumbnailUrl: "",
            uploadDate: new Date(),
            viewCount : 0,
            duration : 176,
            audience : "For Workers",
            language: "Thai",
            extension: "mp4",
            factory : "Factory1",
            supplier: "Supplier2",
            brand : "Brand3",
            spotlight: "Spotlight1"
        },
        {
            url: "https://www.youtube.com/watch?v=ki9E1kQy9NA&feature=youtu.be",
            title: "COVID-19 Safe Living in Dorms - Reaction",
            description: 'To promote “Safe Living in Dormitories” this video informs workers (particularly migrant workers) on what to do if they experience symptoms of COVID-19 or have been in close contact with someone with symptoms.  This is to minimize the spread of COVID-19 and ensure safety for all dormitory residents.  Resources for dormitory residents who wish to seek medical help and/or receive latest updates about COVID-19 are also included.',
            thumbnailUrl: "",
            uploadDate: new Date(),
            viewCount : 0,
            duration : 158,
            audience : "For Workers",
            language: "Thai",
            extension: "mp4",
            factory : "Factory1",
            supplier: "Supplier2",
            brand : "Brand3",
            spotlight: "Spotlight1"
        },
        {
            url: "https://www.youtube.com/watch?v=Hng6jPhQBVk&feature=youtu.be",
            title: "COVDID-19 Safe Living in Dorms - Prevention (EN)",
            description: 'To promote “Safe Living in Dormitories”, this video informs employers and workers (particularly migrant workers) on steps that can be taken to prevent the spread of COVID-19 (and other viruses), keep common areas safe and ensure the well-being of dormitory residents.  Resources for residents who wish to seek mental health support and/or receive latest updates about COVID-19 are also included. ',
            thumbnailUrl: "",
            uploadDate: new Date(),
            viewCount : 0,
            duration : 179,
            audience : "For Workers",
            language: "English",
            extension: "mp4",
            factory : "Factory1",
            supplier: "Supplier2",
            brand : "Brand3",
            spotlight: "Spotlight1"
        },
        {
            url: "https://www.youtube.com/watch?v=Abe24QhFEw4&feature=youtu.be",
            title: "COVID-19 Safe Living in Dorms - Reaction (EN)",
            description: 'To promote “Safe Living in Dormitories” this video informs workers (particularly migrant workers) on what to do if they experience symptoms of COVID-19 or have been in close contact with someone with symptoms.  This is to minimize the spread of COVID-19 and ensure safety for all dormitory residents.  Resources for dormitory residents who wish to seek medical help and/or receive latest updates about COVID-19 are also included.',
            thumbnailUrl: "",
            uploadDate: new Date(),
            viewCount : 0,
            duration : 163,
            audience : "For Workers",
            language: "English",
            extension: "mp4",
            factory : "Factory1",
            supplier: "Supplier2",
            brand : "Brand3",
            spotlight: "Spotlight1"
        },
           
      ]
      
    await Video.deleteAll()
    defaultVideos.forEach(async (item) => {
        const v = await Video.getByUrl(item.url)
        if (!v){
            await Video.upsertByUrl(item)
        }
    })
    return true;
}

const getPopularVideos = async (userId, params) =>{
    let videos = await Video.getPopularVideos(params)
    const lstWatched = await UserVideo.getByUser(userId)
    const lstWatchedVideoId = lstWatched.map(x=>x.videoId)
    let result = []
    videos.forEach(video => {
        result.push({
            isWatch: lstWatchedVideoId.includes(video.id),
            id: video.id,
            url: video.url, 
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
            spotlight: video.spotlight 
        })
    });
    return result
}

const getRecentVideos = async (userId, params) =>{
    let videos = await Video.getRecentVideos(params)
    const lstWatched = await UserVideo.getByUser(userId)
    const lstWatchedVideoId = lstWatched.map(x=>x.videoId)
    let result = []
    videos.forEach(video => {
        result.push({
            isWatch: lstWatchedVideoId.includes(video.id),
            id: video.id,
            url: video.url, 
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
            spotlight: video.spotlight 
        })
    });
    return result
}

const getAll = async() =>{
    return await Video.getAll()
}

const deleteById = async(url) =>{
    await Video.deleteById(url)
}

const upsertVideo = async(params) =>{
    await Video.upsertByUrl(params)
}

module.exports.updateViewCount = updateViewCount
module.exports.ensureDefaultVideos = ensureDefaultVideos
module.exports.getPopularVideos = getPopularVideos
module.exports.getRecentVideos = getRecentVideos
module.exports.getAll = getAll
module.exports.deleteById = deleteById
module.exports.upsertVideo = upsertVideo
