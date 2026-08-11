import { Request, Response } from 'express';
import prisma from '@repo/db';

export default async function exitRoomController(req: Request, res: Response) {
    const { userId, roomId } = req.body;

    if (!userId || !roomId) {
        return res.status(400).json({
            message: 'userId and roomId are required'
        });
    }

    try {
        await prisma.roomMember.delete({
            where: {
                userId_roomId: {
                    userId: String(userId),
                    roomId: roomId,
                }
            }
        });

        return res.status(200).json({
            message: 'room left successfully'
        });
    } catch (err) {
        console.log('exit room error: ', err);
        return res.status(500).json({
            message: 'exit room failed'
        });
    }
}