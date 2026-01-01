const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');

// Adjust path if your structure is different
const CACHE_DIR = path.join(__dirname, '../../music_cache');
const MAX_SONGS_LIMIT = 50;

const cleanupCache = async () => {
    try {
        
        try {
            await fsPromises.access(CACHE_DIR);
        } catch {
            return; 
        }

        const files = await fsPromises.readdir(CACHE_DIR);

        const mp3Files = files.filter(file => file.endsWith('.mp3'));

        if (mp3Files.length <= MAX_SONGS_LIMIT) {
            console.log(`✅ Cache within limits: ${mp3Files.length}/${MAX_SONGS_LIMIT} songs.`);
            return;
        }

        console.log(`🧹 Cache exceeded (${mp3Files.length}/${MAX_SONGS_LIMIT}). Cleaning up...`);

        const fileStats = await Promise.all(
            mp3Files.map(async (file) => {
                const filePath = path.join(CACHE_DIR, file);
                const stats = await fsPromises.stat(filePath);
                return { 
                    file, 
                    filePath, 
                    atime: stats.atime // Access Time (Last time it was streamed)
                };
            })
        );

        fileStats.sort((a, b) => a.atime - b.atime);

        const deleteCount = fileStats.length - MAX_SONGS_LIMIT;
        const filesToDelete = fileStats.slice(0, deleteCount);

        for (const fileData of filesToDelete) {
            await fsPromises.unlink(fileData.filePath);
            console.log(`🗑️ Deleted Old Song: ${fileData.file}`);
        }

        console.log(`✨ Cleanup Complete. Removed ${deleteCount} songs.`);

    } catch (error) {
        console.error("❌ Cleanup Service Error:", error.message);
    }
}

setInterval(cleanupCache, 12 * 60 * 60 * 1000);
module.exports = { cleanupCache };

