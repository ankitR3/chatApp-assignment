import { publisher } from './redisClient';

const SESSION_EXPIRY = 60 * 60 * 24 * 7;

export async function createSession(userId: string, token: string) {
    await publisher.set(
        `session:${userId}:${token}`,
        userId,
        'EX',
        SESSION_EXPIRY
    );
}

export async function validateSesison(userId: string, token: string): Promise<boolean> {
    const session = await publisher.get(`session:${userId}:${token}`);
    return session !== null;
}

export async function deleteSession(userId: string, token: string) {
    await publisher.del(`session:${userId}:${token}`);
}

export async function deleteAllSessions(userId: string) {
    const keys = await publisher.keys(`session:${userId}:*`);
    if (keys.length > 0) {
        await publisher.del(...keys);
    }
}