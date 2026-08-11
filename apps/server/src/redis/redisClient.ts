import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required');
}

export const publisher = new Redis(redisUrl);
export const subscriber = new Redis(redisUrl);