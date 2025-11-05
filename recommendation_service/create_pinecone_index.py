import os
import pinecone
from dotenv import load_dotenv

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = "rhythm-users"
# Ensure this matches the dimension in your vectorization.py file
VECTOR_DIMENSION = 20000

def main():
    print("Initializing Pinecone...")
    # Use the new Pinecone client
    pc = pinecone.Pinecone(api_key=PINECONE_API_KEY)

    # Check if the index already exists
    # The .names() method returns a list of index names
    if INDEX_NAME in pc.list_indexes().names():
        print(f"Index '{INDEX_NAME}' already exists. No action taken.")
        return

    print(f"Index '{INDEX_NAME}' not found. Creating new index...")
    # Use the new create_index method with the ServerlessSpec
    pc.create_index(
        name=INDEX_NAME,
        dimension=VECTOR_DIMENSION,
        metric="cosine",
        spec=pinecone.ServerlessSpec(
            cloud="aws",
            region="us-east-1"
        )
    )
    print(f"Successfully created index '{INDEX_NAME}' with dimension {VECTOR_DIMENSION}.")
    print("It may take a minute for the index to be ready.")

if __name__ == "__main__":
    main()