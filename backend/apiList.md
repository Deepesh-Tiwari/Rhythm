# API ANALYSIS

# Authentication ( authRoutes )
- POST /auth/signup
- POST /auth/login
- POST /auth/logout
- GET /auth/spotify
- GET /auth/spotify/callback
- POST /auth/password-reset
- POST /auth/password-reset/verify

# Users and Profiles ( userRoutes )
- GET /users/me
- PUT /users/me
- DELETE /users/me
- POST /users/me/sync-spotify
- POST /users/me/profile/music
- GET /users/me/profile/music
- PATCH /users/me/profile/music
- GET /users/:username
- GET /users/:username/profile/music

# Socials and Matching ( socialRoutes )
- GET /users/requests
- POST /users/requests
- PATCH /users/requests/:requestId
- GET /users/connections
- DELETE /users/:username/unfriend
- GET /users/recommendations

# Spotify API ( musicRoutes )
- GET /music/search?q={...}&type={...}
- GET /music/discover
- GET /music/tracks/:trackId

# Music Room Management ( roomRoutes )
- POST /rooms
- GET /rooms
- GET /rooms/:code
- PUT /rooms/:code
- DELETE /rooms/:code

# Room Membership ( roomRoutes )
- POST /rooms/:roomId/join
- POST /rooms/:roomId/leave
- GET /rooms/:roomId/members
- POST /rooms/:roomId/invite

# Room Playback & Queue ( playbackRoutes )
- GET /rooms/:roomId/queue
- POST /rooms/:roomId/queue
- DELETE /rooms/:roomId/queue/:queueItemId
- POST /rooms/:roomId/playback/play
- POST /rooms/:roomId/playback/pause
- GET /rooms/:roomId/playback/status
- POST /rooms/:roomId/playback/next

# Room chat ( chatRoutes )
- GET /rooms/:roomId/messages
- POST /rooms/:roomId/messages
- GET /rooms/:roomId/messages/:messageId

# Skip playback appeals( VOTING WILL USE WEBSOCKETS THESE ARE FOR IF USER DISCONNECTS ) ( playbackRoutes )
- POST /rooms/:roomId/appeals
- GET /rooms/:roomId/appeals
- POST /rooms/:roomId/appeals/:appealId/vote
- POST /rooms/:roomId/permissions
- GET /rooms/:roomId/permissions

