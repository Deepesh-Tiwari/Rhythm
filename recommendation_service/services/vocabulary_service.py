from .mongo_client import artist_vocab_collection, genre_vocab_collection, track_vocab_collection, counters_collection

async def get_or_create_artist_index(artist_id: str, artist_name: str) -> int:
    """
    Finds an artist in the vocabulary or creates a new entry atomically.
    Returns the index for the artist.
    """
    # 1. Try to find the existing artist
    artist_doc = artist_vocab_collection.find_one({"spotifyId": artist_id})
    
    if artist_doc:
        return artist_doc["index"]
    else:
        # 2. If not found, it's a new artist. We need to get a new index.
        try:
            # Atomically increment the counter and get the new value
            counter_update = counters_collection.find_one_and_update(
                {"_id": "vocab_counters"},
                {"$inc": {"artist_index": 1}},
                return_document=True # In PyMongo, this is an enum
            )
            new_index = counter_update["artist_index"]

            # 3. Create the new artist document with the new index
            # We use insert_one inside a try-except to handle the rare race condition
            # where two processes try to insert the same artist at the same time.
            artist_vocab_collection.insert_one({
                "spotifyId": artist_id,
                "name": artist_name,
                "index": new_index
            })
            print(f"Added new artist '{artist_name}' to vocabulary at index {new_index}")
            return new_index
        except Exception as e:
            # This handles the race condition. If insert_one fails because another
            # process just inserted it, we re-query to get the correct index.
            print(f"Race condition handled for artist {artist_name}. Re-fetching index.")
            retry_doc = artist_vocab_collection.find_one({"spotifyId": artist_id})
            if retry_doc:
                return retry_doc["index"]
            else:
                # If it still fails, something is seriously wrong.
                raise e

async def get_or_create_genre_index(genre_name: str) -> int:
    """
    Finds a genre in the vocabulary or creates a new entry atomically.
    Returns the index for the genre.
    """
    # This logic is identical to the artist function, just with different fields
    genre_doc = genre_vocab_collection.find_one({"name": genre_name})
    
    if genre_doc:
        return genre_doc["index"]
    else:
        try:
            counter_update = counters_collection.find_one_and_update(
                {"_id": "vocab_counters"},
                {"$inc": {"genre_index": 1}},
                return_document=True
            )
            new_index = counter_update["genre_index"]
            
            genre_vocab_collection.insert_one({
                "name": genre_name,
                "index": new_index
            })
            print(f"Added new genre '{genre_name}' to vocabulary at index {new_index}")
            return new_index
        except Exception as e:
            print(f"Race condition handled for genre {genre_name}. Re-fetching index.")
            retry_doc = genre_vocab_collection.find_one({"name": genre_name})
            if retry_doc:
                return retry_doc["index"]
            else:
                raise e
            
async def get_or_create_track_index(track_id: str, track_name: str) -> int:
    """
    Finds a track in the vocabulary or creates a new entry atomically.
    Returns the index for the track.
    """
    track_doc = track_vocab_collection.find_one({"spotifyId": track_id})
    
    if track_doc:
        return track_doc["index"]
    else:
        try:
            # Atomically increment the track counter
            counter_update = counters_collection.find_one_and_update(
                {"_id": "vocab_counters"},
                {"$inc": {"track_index": 1}},
                return_document=True # Or ReturnDocument.AFTER
            )
            new_index = counter_update["track_index"]
            
            track_vocab_collection.insert_one({
                "spotifyId": track_id,
                "name": track_name,
                "index": new_index
            })
            print(f"Added new track '{track_name}' to vocabulary at index {new_index}")
            return new_index
        except Exception as e:
            # Handle race condition
            print(f"Race condition handled for track {track_name}. Re-fetching index.")
            retry_doc = track_vocab_collection.find_one({"spotifyId": track_id})
            if retry_doc:
                return retry_doc["index"]
            else:
                raise e