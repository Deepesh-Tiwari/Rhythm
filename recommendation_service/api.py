import os
from flask import Flask, jsonify, request
from dotenv import load_dotenv

# Import the service that does all the work
from services.pinecone_service import pinecone_service

# Load environment variables from .env file
load_dotenv()

# Initialize the Flask app
app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """A simple health check endpoint to confirm the service is running."""
    return jsonify({"status": "ok"}), 200

@app.route('/recommend/<string:user_id>', methods=['GET'])
def get_recommendations(user_id):
    """
    The main recommendation endpoint.
    Takes a user_id and returns a list of recommended user IDs and their scores.
    """
    # Get the 'limit' query parameter, with a default of 50
    try:
        limit = int(request.args.get('limit', 50))
    except ValueError:
        return jsonify({"error": "Invalid 'limit' parameter. Must be an integer."}), 400

    if not user_id:
        return jsonify({"error": "user_id parameter is required."}), 400

    print(f"Received recommendation request for user: {user_id} with limit: {limit}")

    try:
        # 1. Use our existing Pinecone service to get the recommendations
        recommendations = pinecone_service.query_similar_users(
            user_id=user_id,
            top_k=limit + 1 # Fetch one extra in case the user themselves is in the results
        )

        # 2. Filter out the user themselves from the recommendation list
        # The most similar user to 'user_id' will always be 'user_id' with a score of 1.0
        filtered_recommendations = [rec for rec in recommendations if rec["userId"] != user_id]

        # Ensure we only return the number of results requested by the limit
        final_recommendations = filtered_recommendations[:limit]

        # 3. Return the clean list as a JSON response
        return jsonify(final_recommendations), 200

    except Exception as e:
        print(f"An error occurred during recommendation query for user {user_id}: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

if __name__ == '__main__':
    # Get port from environment variable or default to 8000
    port = int(os.environ.get('PORT', 8000))
    # Run the app. 'debug=True' is helpful for development.
    # Use a production-ready server like Gunicorn for deployment.
    app.run(host='0.0.0.0', port=port, debug=True)