const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const EXCHANGE_NAME = 'rhythm_exchange';
const ROUTING_KEY = 'user.taste.updated';

let channel = null;

async function connectToRabbitMQ() {
    if (channel) return;
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
        console.log('✅ RabbitMQ connection established and exchange asserted.');
    } catch (error) {
        console.error('❌ Failed to connect to RabbitMQ:', error.message);
    }
}

async function publishTasteUpdate(userId, musicTaste) {
    if (!channel) {
        console.error('RabbitMQ channel not available. Cannot publish message.');
        return;
    }
    const payload = { userId, musicTaste };
    console.log('Publishing taste update to RabbitMQ for user:', userId);
    channel.publish(
        EXCHANGE_NAME,
        ROUTING_KEY,
        Buffer.from(JSON.stringify(payload))
    );
}

module.exports = { connectToRabbitMQ, publishTasteUpdate };