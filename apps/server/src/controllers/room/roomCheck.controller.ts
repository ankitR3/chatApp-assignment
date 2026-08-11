import { Request, Response } from 'express';
import prisma from '@repo/db';

export default async function roomCheckController(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: 'roomId is not found'
        });
    }

    try {
        const room = await prisma.room.findUnique({
            where: {
                id: String(id)
            },
            select: {
                id: true,
                name: true,
                description: true,
                isPrivate: true,
                owner: true
            },
        });

        if (!room) {
            return res.status(404).json({
                message: 'room not found'
            });
        }

        return res.status(200).json({
            room
        });
    } catch (err) {
        console.log('room-check error: ', err);
        return res.status(500).json({
            message: 'failed to fetch room'
        });
    }
}