import os
import pinecone
import numpy as np
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = "rhythm-users"

class PineconeService:
    """
    A service class to encapsulate all interactions with the Pinecone vector database.
    """
    def __init__(self):
        """
        Initializes the service by connecting to Pinecone and getting a handle
        to the specified index.
        """
        print("Initializing Pinecone Service...")
        if not PINECONE_API_KEY:
            raise ValueError("PINECONE_API_KEY environment variable not set.")

        # Initialize the Pinecone client
        # This uses the newer Pinecone client syntax
        pc = pinecone.Pinecone(api_key=PINECONE_API_KEY)
        
        # Check if the index exists
        if INDEX_NAME not in pc.list_indexes().names():
            raise EnvironmentError(f"Pinecone index '{INDEX_NAME}' does not exist. Please run the create_pinecone_index.py script first.")
            
        # Get a handle to the index. This object will be used for all operations.
        self.index = pc.Index(INDEX_NAME)
        print(f"Successfully connected to Pinecone index '{INDEX_NAME}'.")
        # You can print stats to confirm connection
        print(self.index.describe_index_stats())

    def upsert_user_vector(self, user_id: str, vector: np.ndarray):
        """
        Inserts or updates a user's vector in the Pinecone index.

        Args:
            user_id: The unique ID of the user (from MongoDB).
            vector: The user's music taste vector (as a NumPy array).
        """
        if not isinstance(user_id, str) or not user_id:
            raise ValueError("user_id must be a non-empty string.")
        if not isinstance(vector, np.ndarray):
            raise TypeError("vector must be a NumPy array.")

        print(f"Upserting vector for user: {user_id}")
        
        # Pinecone expects the vector as a list of floats, not a NumPy array
        vector_as_list = vector.tolist()

        # The upsert operation
        self.index.upsert(
            vectors=[
                {
                    "id": user_id,          # The unique ID for this vector
                    "values": vector_as_list # The vector data
                    # We can add metadata here if needed in the future
                    # "metadata": {"last_updated": datetime.now().isoformat()}
                }
            ]
        )
        print(f"Successfully upserted vector for user: {user_id}")

    def query_similar_users(self, user_id: str, top_k: int = 50) -> list:
        """
        Queries the Pinecone index to find the most similar users.

        Args:
            user_id: The ID of the user to find recommendations for.
            top_k: The number of similar users to return.

        Returns:
            A list of dictionaries, each containing a 'userId' and a 'score'.
        """
        if not isinstance(user_id, str) or not user_id:
            raise ValueError("user_id must be a non-empty string.")

        print(f"Querying for users similar to: {user_id}")

        try:
            # The query operation. We query by the ID of an existing vector.
            query_results = self.index.query(
                id=user_id,
                top_k=top_k,
                # We can add filters here later, e.g., to exclude users from a certain country
                # filter={"genre": {"$in": ["rock", "pop"]}}
            )

            # Format the results into a clean list
            recommendations = []
            for match in query_results.get("matches", []):
                recommendations.append({
                    "userId": match["id"],
                    "score": match["score"]
                })
            
            print(f"Found {len(recommendations)} similar users for user: {user_id}")
            return recommendations

        except Exception as e:
            # This can happen if the user_id does not exist in the index yet
            print(f"Error querying Pinecone for user {user_id}: {e}")
            # Return an empty list if the user's vector isn't in Pinecone yet
            return []

# Create a singleton instance of the service so we only initialize the connection once.
pinecone_service = PineconeService()