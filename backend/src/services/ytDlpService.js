const { spawn } = require('child_process');

/**
 * Spawns a yt-dlp process to get the direct audio URL.
 * Requires 'yt-dlp' to be installed on the system PATH.
 */
const getAudioStream = (videoId) => {
    return new Promise((resolve, reject) => {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        console.log(`🎧 [yt-dlp] Spawning process for: ${videoId}`);

        // Command: yt-dlp -f bestaudio -g <url>
        // -f bestaudio: Select best audio quality
        // -g: Get URL only (do not download file)
        const ytDlpProcess = spawn('yt-dlp', [
            '-f', 'bestaudio', 
            '-g', 
            videoUrl
        ]);

        let outputData = '';
        let errorData = '';

        // Capture the output (The URL)
        ytDlpProcess.stdout.on('data', (chunk) => {
            outputData += chunk.toString();
        });

        // Capture errors
        ytDlpProcess.stderr.on('data', (chunk) => {
            errorData += chunk.toString();
        });

        // Handle process finish
        ytDlpProcess.on('close', (code) => {
            if (code === 0 && outputData) {
                // The output might contain newlines, trim it
                const streamUrl = outputData.trim().split('\n')[0];
                resolve(streamUrl);
            } else {
                console.error(`❌ [yt-dlp] Error (Code ${code}):`, errorData);
                reject(new Error("Failed to extract audio stream via yt-dlp"));
            }
        });
    });
};

module.exports = { getAudioStream };