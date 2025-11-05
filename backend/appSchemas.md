## Schemas used in Application

# User
- _id (given by mongoDB directly)
- username
- email
- passwordHash
- displayName
- bio
- photoURL
- isSpotifyConnecteD
- spotify
    {
        spotifyId, accessToken, refreshToken, scopes, connectedAt
    }
- musicTaste
    {
        topTracks: [{id, name, artists}], topArtists: [...], topGenres: [...], createdAt
    }
- recommendations

- follower Count
- following Count

- role

- emailVerfied
- emailVerifiedAt
- resetPasswordToken
- resetPasswordExpires

- lastSeenAt
- roomsCreatedCount

- created, updated ( given by mongoDB)


# follow

# rooms

# message

