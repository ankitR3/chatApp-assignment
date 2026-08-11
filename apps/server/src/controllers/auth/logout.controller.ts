import { Request, Response } from 'express';
import { deleteSession } from '../../redis/redisSession';

export default async function logoutController(req: Request, res: Response) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const userId = req.user?.id;

        if (!token) {
            return res.status(400).json({
                message: 'token not found'
            });
        }

        if (!userId) {
            return res.status(401).json({
                message: 'unauthorized'
            });
        }

        await deleteSession(userId, token);

        return res.status(200).json({
            message: 'logged out successfully'
        });

    } catch (err) {
        console.log('logout error: ', err);
        return res.status(500).json({
            message: 'logout failed'
        });
    }
}