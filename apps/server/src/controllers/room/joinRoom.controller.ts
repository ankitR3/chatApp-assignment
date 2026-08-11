import { Request, Response } from 'express';
import prisma from '@repo/db';

export default async function joinRoomController(req: Request, res: Response) {
    const { userId, roomId, code } = req.body;

    if (!userId) {
        return res.status(400).json({
            message: 'user_id is required'
        });
    }

    if (!code && !roomId) {
        return res.status(400).json({
            message: 'code or roomId is required'
        });
    }

    try {
        const existingRoom = await prisma.room.findUnique({
            where: code ? {
                code
            } : {
                id: roomId
            }
        });

        if (!existingRoom) {
            return res.status(404).json({
                message: 'room not found'
            });
        }

        const alreadyJoined = await prisma.roomMember.findFirst({
            where: {
                userId,
                roomId: existingRoom.id
            },
        });

        if (alreadyJoined) {
            return res.status(409).json({
                message: 'Already a member of this room'
            });
        }

        await prisma.roomMember.create({
            data: {
                user: {
                    connect: {
                        id: userId
                    }
                },
                room: {
                    connect: {
                        id: existingRoom.id
                    }
                },
                role: 'MEMBER',
            },
        });

        return res.status(201).json({
            success: true,
            room: existingRoom,
            roomUrl: `/room/${roomId}`,
            message: 'room joined successfully'
        });
    } catch (err) {
        console.log('Join Room Error: ', err);
        return res.status(500).json({
            success: false,
            message: 'Room join failed'
        });
    }
}