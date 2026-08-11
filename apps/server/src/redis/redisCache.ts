import { publisher } from './redisClient';

const CACHE_EXPIRY = 60 * 60;

export async function getCachedMessages(roomId: string) {
    const cached = await publisher.get(`messages:${roomId}`);
    if (cached) {
        return JSON.parse(cached);
    }
    return null;
}

export async function setCachedMessages(roomId: string, messages: any[]) {
    await publisher.set(
        `messages:${roomId}`,
        JSON.stringify(messages),
        'EX',
        CACHE_EXPIRY
    );
}

export async function invalidateCache(roomId: string) {
    await publisher.del(`messages:${roomId}`);
}