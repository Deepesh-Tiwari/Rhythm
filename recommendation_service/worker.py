import os
import pika
import json
import asyncio
from dotenv import load_dotenv

# Import the core components we've built
from core.vectorization import create_user_vector
from services.pinecone_service import pinecone_service

# Load environment variables from .env file
load_dotenv()

# --- RabbitMQ Configuration ---
RABBITMQ_URL = os.getenv("RABBITMQ_URL")
EXCHANGE_NAME = 'rhythm_exchange'
QUEUE_NAME = 'user_taste_queue'
ROUTING_KEY = 'user.taste.updated'

def process_message_payload(payload: dict):
    """
    The main logic for processing a message.
    This function is called from the RabbitMQ callback.
    """
    print(" [x] Processing message payload...")
    try:
        # 1. Extract necessary data from the message payload
        user_id = payload.get("userId")
        music_taste = payload.get("musicTaste")

        if not user_id or not music_taste:
            print(" [!] Invalid message format. Missing userId or musicTaste. Skipping.")
            return

        # 2. Run the asynchronous vectorization function
        # We use asyncio.run() to execute our async function in this sync callback
        user_vector = asyncio.run(create_user_vector(music_taste))

        # 3. Upsert the resulting vector to Pinecone using our service
        pinecone_service.upsert_user_vector(user_id=user_id, vector=user_vector)
        
        print(f" [✔] Successfully processed and upserted vector for user: {user_id}")

    except Exception as e:
        print(f" [!] An error occurred while processing message for user {user_id}: {e}")
        # In a production system, you might want to re-queue the message or send it to a dead-letter queue.
        # For now, we'll just log the error.

def main():
    """
    Connects to RabbitMQ and starts consuming messages from the queue.
    """
    print("--- Starting Recommendation Worker ---")
    try:
        # Establish a connection to RabbitMQ
        connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
        channel = connection.channel()

        # Ensure the exchange and queue exist and are bound together
        channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type='direct', durable=True)
        channel.queue_declare(queue=QUEUE_NAME, durable=True)
        channel.queue_bind(exchange=EXCHANGE_NAME, queue=QUEUE_NAME, routing_key=ROUTING_KEY)

        # Define the callback function for when a message is received
        def callback(ch, method, properties, body):
            print("\n [x] Received new message from RabbitMQ.")
            payload = json.loads(body)
            process_message_payload(payload)
            # Acknowledge the message to remove it from the queue
            ch.basic_ack(delivery_tag=method.delivery_tag)

        # Tell the channel to start consuming messages from the queue
        channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)

        print(' [*] Worker is waiting for messages. To exit press CTRL+C')
        channel.start_consuming()

    except pika.exceptions.AMQPConnectionError as e:
        print(f" [!] Could not connect to RabbitMQ. Please ensure it is running and the URL is correct. Error: {e}")
    except KeyboardInterrupt:
        print(' [*] Worker shutting down.')
    except Exception as e:
        print(f" [!] An unexpected error occurred: {e}")

if __name__ == '__main__':
    main()