import Redis from 'ioredis';

export const publisher = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');