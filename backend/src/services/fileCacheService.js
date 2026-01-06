const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const CACHE_DIR = path.join(__dirname, '../../music_cache');
const COOKIES_PATH = path.join(__dirname, '../cookies.txt');

const ensureDir = async () => {
    try {
        await fsPromises.access(CACHE_DIR);
    } catch {
        await fsPromises.mkdir(CACHE_DIR, { recursive: true });
    }
};

const getFilePath = (videoId) => path.join(CACHE_DIR, `${videoId}.mp3`);

const getCachedAudio = async(videoId) => {
    await ensureDir();
    const filePath = getFilePath(videoId);

    try {
        const stats = await fsPromises.stat(filePath);
        
        if (stats.size > 0) {
            console.log(`✅ Cache Hit: Serving ${videoId} from disk.`);
            
            // Update "Access Time" (atime) for future cleanup logic
            const now = new Date();
            await fsPromises.utimes(filePath, now, now);

            return fs.createReadStream(filePath);
        } else {
            // File exists but is empty (corrupt), delete it
            await fsPromises.unlink(filePath);
        }
    } catch (err) {
        // File does not exist, proceed to download
    }

    return new Promise((resolve, reject) => {
        console.log(`⬇️ Cache Miss: Downloading ${videoId}...`);

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        const args = [
            '-f', 'bestaudio',
            '--no-playlist',

            // 1. Impersonate Android App (Bypasses Web 429 blocks)
            // '--extractor-args', 'youtube:player_client=android',

            // 2. Force IPv4 (Cloud IPv6 is often dirty)
            '--force-ipv4',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            '-o', filePath,
            videoUrl
        ];

        if (fs.existsSync(COOKIES_PATH)) {
            console.log("🍪 Passing cookies to yt-dlp...");
            args.push('--cookies', COOKIES_PATH);
        }

    //    const ytDlp = spawn('yt-dlp', [
    //         '-f', 'bestaudio',   // Best Quality
    //         '--no-playlist',     // Single video only
    //         '-o', filePath,      // Save to Disk (Critical for Cache)
    //         videoUrl
    //     ]);

        const ytDlp = spawn('yt-dlp', args);

        ytDlp.stderr.on('data', (data) => console.error(`[yt-dlp stderr]: ${data}`));

        ytDlp.on('close', async (code) => {
            if (code === 0) {
                console.log(`✅ Download Complete: ${videoId}`);
                try {
                    await fsPromises.access(filePath);
                    resolve(fs.createReadStream(filePath));
                } catch (e) {
                    reject(new Error("File missing after download"));
                }
            } else {
                reject(new Error(`yt-dlp exited with code ${code}`));
            }
        });

        ytDlp.stderr.on('data', (data) => {
            // Uncomment to debug download issues
            // console.log(`yt-dlp: ${data}`); 
        });
    });

}

module.exports = { getCachedAudio };