import { Request, Response } from 'express';
import prisma from '@repo/db';

export default async function exploreRoomsController(req: Request, res: Response) {
    const search = req.query.search as string;

    try {
        const rooms = await prisma.room.findMany({
            where: {
                isPrivate: false,
                name: {
                    contains: search || '',
                    mode: 'insensitive'
                }
            },
            include: {
                owner: true,
                _count: {
                    select: {
                        members: true
                    }
                }
            }
        });

        if (rooms.length === 0) {
            return res.status(404).json({
                message: 'no public room found'
            });
        }

        return res.status(200).json({
            rooms,
            message: 'rooms fetched successfully'
        });

    } catch (err) {
        console.log('explore room error: ', err);
        return res.status(500).json({
            message: 'failed to fetched the room'
        });
    }
}