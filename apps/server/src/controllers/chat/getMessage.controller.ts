import { Request, Response } from 'express';
import prisma from '@repo/db';
import { getCachedMessages, setCachedMessages } from '../../redis/redisCache';

export default async function getMessageController(req: Request, res: Response) {
    const { roomId } = req.params;
    const userId = req.query.userId as string;

    if (!roomId || typeof roomId != 'string') {
        return res.status(400).json({
            message: 'insufficient or invalid roomId'
        });
    }

    try {
        const membership = await prisma.roomMember.findUnique({
            where: {
                userId_roomId: {
                    userId,
                    roomId,
                }
            },
            select: {
                joinedAt: true
            }
        });

        if (!membership) {
            return res.status(403).json({
                message: 'You are not a member of this room'
            });
        }

        const cachedMessages = await getCachedMessages(roomId);
        if (cachedMessages) {
            console.log(`Cache hit for room ${roomId}`);
            return res.status(200).json({
                messages: cachedMessages,
                message: 'fetched message successfully'
            });
        }

        console.log(`Cache miss for ${roomId} - hitting PostgresSql`);
        const message = await prisma.message.findMany({
            where: {
                roomId,
                createdAt: {
                    gte: membership.joinedAt
                }
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc'
            },
        });
        await setCachedMessages(roomId, message);
        
        return res.status(200).json({
            messages: message,
            message: 'fetched message successfully'
        });
    } catch (err) {
        console.log('get-message error: ', err);
        return res.status(500).json({
            message: 'failed to get message'
        });
    }
}