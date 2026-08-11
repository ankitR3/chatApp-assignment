import { Request, Response } from 'express';
import prisma from '@repo/db';

export default async function editMessageController(req: Request, res: Response) {
    const { userId, content, roomId, messageId } = req.body;

    if (!roomId || !content || !userId || !messageId) {
        return res.status(400).json({
            message: 'insufficient data'
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
                message: 'Room not found'
            });
        }

        const existingMessage = await prisma.message.findUnique({
            where: {
                id: messageId
            }
        });

        if (!existingMessage) {
            return res.status(404).json({
                message: 'message not found'
            });
        }

        if (existingMessage.authorId !== userId) {
            return res.status(403).json({
                message: 'you can only edit your own message'
            });
        }

        const message = await prisma.message.update({
            where: {
                id: messageId
            },
            data: {
                content
            }
        });

        return res.status(200).json({
            data: message,
            message: 'message updated successfully'
        });
    } catch (err) {
        console.log('update message error: ', err);
    }
}