const mongoose = require('mongoose');
const {Schema , model} = mongoose;

const songMappingSchema = Schema({

    spotifyId : {
        type : String,
        unique : true,
        index : true
    },

    youtubeId : {
        type : String,
        unique : true,
        index : true
    },

    trackName : String,
    artistName : String,

    lastAccessed: { type: Date, default: Date.now }
})

songMappingSchema.index({lastAccessed : 1}, {expiresAfterSeconds : 259200});

module.exports = model('SongMapping', songMappingSchema);