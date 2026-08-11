import { publisher } from './redisClient';

const MAX_MESSAGES = 30;
const WINDOW_SECONDS = 60;

export async function isRateLimited(userId: string): Promise<boolean> {
    const key = `rateLimit:${userId}`;
    const count = await publisher.incr(key);

    if (count === 1) {
        await publisher.expire(key, WINDOW_SECONDS);
    }

    if (count > MAX_MESSAGES) {
        return true;
    }
    return false;
}