import { Request, Response } from 'express';
import prisma from '@repo/db';
import { generateRoomCode } from '../../utils/generateCode';

export default async function directRoomController(req: Request, res: Response) {
    const { userId, targetUserId } = req.body;

    if (!userId || !targetUserId) {
        return res.status(400).json({
            success: false,
            message: 'userId and targetUserId are required'
        });
    }

    try {
        // Check if direct room already exists between these 2 users
        const userRooms = await prisma.room.findMany({
            where: {
                isPrivate: true,
                members: {
                    some: { userId: userId },
                },
            },
            include: {
                owner: true,
                members: {
                    include: { user: true }
                },
                message: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
        });

        const existingDirectRoom = userRooms.find(
            (r) => r.members.length === 2 && r.members.some((m) => m.userId === targetUserId)
        );

        if (existingDirectRoom) {
            return res.status(200).json({
                success: true,
                room: existingDirectRoom,
                message: 'Found existing direct room'
            });
        }

        // Create new direct room
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId }
        });

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Target user not found'
            });
        }

        const code = `DM${generateRoomCode(6)}`;

        const room = await prisma.room.create({
            data: {
                name: targetUser.username || targetUser.email || 'Direct Chat',
                isPrivate: true,
                code,
                ownerId: userId,
                members: {
                    create: [
                        { userId: userId, role: 'OWNER' },
                        { userId: targetUserId, role: 'MEMBER' },
                    ],
                },
            },
            include: {
                owner: true,
                members: {
                    include: { user: true }
                },
                message: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        return res.status(201).json({
            success: true,
            room,
            message: 'Created direct room'
        });
    } catch (err) {
        console.error('directRoom error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to start direct room'
        });
    }
}
