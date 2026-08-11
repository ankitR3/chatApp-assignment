import { Request, Response } from 'express';
import prisma from '@repo/db';

export default async function getRoomController(req: Request, res: Response) {
    const userId = req.query.userId as string;

    if (!userId) {
        return res.status(400).json({
            message: 'user-id is required'
        });
    }

    try {
        const ownerRooms = await prisma.room.findMany({
            where: {
                ownerId: userId
            },
            include: {
                owner: true,
                members: {
                    include: {
                        user: true
                    },
                },
                message: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1,
                },
            },
        });

        const memberRooms = await prisma.roomMember.findMany({
            where: {
                userId: userId
            },
            include: {
                room: {
                    include: {
                        owner: true,
                        members: {
                            include: {
                                user: true,
                            },
                        },
                        message: {
                            orderBy: {
                                createdAt: 'desc'
                            },
                            take: 1,
                        },
                    },
                },
            },
        });

        const joinedRooms = memberRooms
            .map((member) => member.room)
            .filter((room) => room.owner.id !== userId)
        
        return res.status(200).json({
            ownerRooms,
            joinedRooms,
            message: 'listed rooms successfully'
        });
    } catch (err) {
        console.log('Failed to fetch user room: ', err);
        return res.status(500).json({
            message: 'internal server error'
        });
    }
}