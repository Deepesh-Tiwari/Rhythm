import os
import certifi # <-- Make sure you have run 'pip install certifi'
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

# --- FIX 1: Pass the certifi CA bundle to the client for SSL ---
ca = certifi.where()
client = MongoClient(MONGODB_URI, tlsCAFile=ca)
# --- END OF FIX 1 ---

# --- FIX 2: Use your correct database name 'Rhythm' ---
db = client.get_database("Rhythm")
# --- END OF FIX 2 ---

print("Attempting to connect to MongoDB and set up vocab collections...")

# Get handles to the collections. MongoDB will create them on first use.
artist_vocab_collection = db.get_collection("artist_vocab")
genre_vocab_collection = db.get_collection("genre_vocab")
track_vocab_collection = db.get_collection("track_vocab")
counters_collection = db.get_collection("vocab_counters")

# Ensure unique indexes exist. This will create the collections if they don't.
print("Ensuring indexes on vocabulary collections...")
artist_vocab_collection.create_index("spotifyId", unique=True)
genre_vocab_collection.create_index("name", unique=True)
track_vocab_collection.create_index("spotifyId", unique=True)
print("Indexes ensured.")

# Initialize the counter document if it doesn't exist. This is an atomic operation.
print("Ensuring vocabulary counter exists...")
counters_collection.find_one_and_update(
    {"_id": "vocab_counters"},
    # $setOnInsert will only apply these fields if the document is being created (upserted)
    {"$setOnInsert": {
        "artist_index": 0,
        "genre_index": 0,
        "track_index": 0
    }},
    upsert=True
)
print("Counter ensured.")

print("✅ MongoDB connection for Python service established and vocabularies are set up.")