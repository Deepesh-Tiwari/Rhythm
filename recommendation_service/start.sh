# 1. Start the Worker in the background (& symbol does this)
echo "Starting Background Worker"
python worker.py &

# 2. Start the API in the foreground (This keeps the container alive)
echo "Starting API Server..."
gunicorn api:app