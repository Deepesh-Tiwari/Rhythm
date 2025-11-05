import numpy as np
from services import vocabulary_service

# --- Updated Configuration ---
ARTIST_VOCAB_SIZE = 9000
GENRE_VOCAB_SIZE = 1000
TRACK_VOCAB_SIZE = 10000
TOTAL_VECTOR_DIMENSION = ARTIST_VOCAB_SIZE + GENRE_VOCAB_SIZE + TRACK_VOCAB_SIZE

TRACK_WEIGHT = 2.0
ARTIST_WEIGHT = 1.5
GENRE_WEIGHT = 1.0

async def create_user_vector(music_taste: dict) -> np.ndarray:
    """
    Creates a weighted, hybrid vector from a user's music taste, including tracks.
    """
    user_vector = np.zeros(TOTAL_VECTOR_DIMENSION, dtype=np.float32)

    # --- 1. Process Artists ---
    top_artists = music_taste.get("topArtists", [])
    if top_artists:
        for artist in top_artists:
            artist_index = await vocabulary_service.get_or_create_artist_index(
                artist_id=artist["id"], 
                artist_name=artist["name"]
            )
            if artist_index < ARTIST_VOCAB_SIZE:
                user_vector[artist_index] = ARTIST_WEIGHT
            else:
                print(f"Warning: Artist index {artist_index} exceeds allocated size {ARTIST_VOCAB_SIZE}.")

    # --- 2. Process Genres ---
    # The genre section starts after the artist section
    genre_section_start_index = ARTIST_VOCAB_SIZE
    top_genres = music_taste.get("topGenres", [])
    if top_genres:
        for genre in top_genres:
            genre_index = await vocabulary_service.get_or_create_genre_index(genre_name=genre)
            vector_position = genre_section_start_index + genre_index
            if genre_index < GENRE_VOCAB_SIZE:
                user_vector[vector_position] = GENRE_WEIGHT
            else:
                print(f"Warning: Genre index {genre_index} exceeds allocated size {GENRE_VOCAB_SIZE}.")

    # --- 3. Process Tracks (NEW SECTION) ---
    # The track section starts after artists and genres
    track_section_start_index = ARTIST_VOCAB_SIZE + GENRE_VOCAB_SIZE
    top_tracks = music_taste.get("topTracks", [])
    if top_tracks:
        for track in top_tracks:
            track_index = await vocabulary_service.get_or_create_track_index(
                track_id=track["id"],
                track_name=track["name"]
            )
            vector_position = track_section_start_index + track_index
            if track_index < TRACK_VOCAB_SIZE:
                user_vector[vector_position] = TRACK_WEIGHT
            else:
                print(f"Warning: Track index {track_index} exceeds allocated size {TRACK_VOCAB_SIZE}.")

    return user_vector