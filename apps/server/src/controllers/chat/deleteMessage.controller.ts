import { Request, Response } from 'express';
import prisma from '@repo/db';

export default async function deleteMessageController(req: Request, res: Response) {
    const { userId, roomId, messageId } = req.body;

    if (!userId || !roomId || !messageId) {
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
                message: 'room not found'
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
                message: 'You can only delete your own messages'
            });
        }

        await prisma.message.delete({
            where: {
                id: messageId
            }
        });

        return res.status(200).json({
            message: 'message deleted successfully'
        });
    } catch (err) {
        console.log('delete message error: ', err);
        return res.status(500).json({
            message: 'failed to delete the message'
        });
    }
}