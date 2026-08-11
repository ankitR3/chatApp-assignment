import { Request, Response } from 'express';
import prisma from '@repo/db';
import { nanoid } from 'nanoid';

export default async function createRoomController(req: Request, res: Response) {
    const { userId, name, description, isPrivate } = req.body;

    if (!userId) {
        return res.status(401).json({
            message: 'authentication failed'
        });
    }

    if (!name) {
        return res.status(400).json({
            message: 'room name is required'
        });
    }

    try {
        const code = nanoid(6).toUpperCase();
        const room = await prisma.room.create({
            data: {
                name,
                description,
                isPrivate,
                code,
                owner: {
                    connect: {
                        id: userId
                    }
                },
                members: {
                    create: {
                        user: {
                            connect: {
                                id: userId
                            }
                        },
                        role: 'OWNER'
                    },
                },
            },
        });

        return res.status(201).json({
            success: true,
            room,
            roomUrl: `/room/${room.id}`,
            message: 'room created successfully'
        });
    } catch (err) {
        console.log('create room error: ', err);
        return res.status(500).json({
            success: false,
            message: 'room creation failed'
        });
    }
}