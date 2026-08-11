import { NextFunction, Request, Response } from 'express';
import prisma from '@repo/db';

export default async function ownerAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const userId = req.headers['userid'] as string;
    const roomId = req.headers['roomid'] as string;

    if (!userId) {
        return res.status(401).json({
            message: 'Authentication failed'
        });
    }

    if (!roomId) {
        return res.status(400).json({
            message: 'Room ID is required'
        });
    }

    try {
        const room = await prisma.room.findUnique({
            where: {
                id:  String(roomId)
            }
        });

        if (!room) {
            return res.status(404).json({
                message: 'Room not found'
            });
        }

        if (room!.ownerId !== userId) {
            return res.status(403).json({
                message: 'You are not the owner'
            });
        }
        next();
    } catch (err) {
        console.log('owner auth error: ', err);
        return res.status(500).json({
            message: 'unauthorized'
        });
    }
}