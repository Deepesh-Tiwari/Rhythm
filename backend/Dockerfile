# backend/Dockerfile

# 1. Use Node.js Alpine (Lightweight)
FROM node:18-alpine

# 2. Install System Dependencies (FFmpeg, Python, Curl for yt-dlp)
RUN apk add --no-cache python3 py3-pip ffmpeg curl

# 3. Install yt-dlp manually (to get the latest version)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# 4. Setup App Directory
WORKDIR /app

# 5. Install Dependencies
COPY package*.json ./
RUN npm install --production

# 6. Copy Source Code
COPY . .

# 7. Create Cache Directory
RUN mkdir -p music_cache && chmod 777 music_cache

# 8. Expose Port
EXPOSE 3000

# 9. Start Server
CMD ["node", "server.js"]