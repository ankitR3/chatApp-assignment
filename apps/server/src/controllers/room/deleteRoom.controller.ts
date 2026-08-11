import { Request, Response } from 'express';
import prisma from '@repo/db';

export default async function deleteRoomController(req: Request, res: Response) {
    const { roomId } = req.body;

    if (!roomId) {
        return res.status(400).json({
            message: 'roomId is required'
        });
    }

    try {
        const room = await prisma.room.findUnique({
            where: {
                id: roomId
            }
        });

        if (!room) {
            return res.status(404).json({
                message: 'room not found'
            });
        }

        await prisma.room.delete({
            where: {
                id: roomId
            }
        });

        return res.status(200).json({
            message: 'room deleted successfully'
        });
    } catch (err) {
        console.log('delete room error: ', err);
        return res.status(500).json({
            message: 'room deletion failed'
        });
    }
}