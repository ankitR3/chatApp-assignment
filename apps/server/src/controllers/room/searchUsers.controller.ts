import { Request, Response } from 'express';
import prisma from '@repo/db';

export default async function searchUsersController(req: Request, res: Response) {
    const query = req.query.q as string;
    const userId = (req.query.userId as string) || (req as any).user?.id;

    if (!query || query.trim().length === 0) {
        return res.status(200).json({
            success: true,
            users: []
        });
    }

    try {
        const currentUser = userId
            ? await prisma.user.findUnique({
                  where: { id: userId },
                  select: { id: true, email: true, username: true },
              })
            : null;

        const cleanQuery = query.trim().toLowerCase();
        const isSearchingSelf = Boolean(
            currentUser &&
                ((currentUser.email && currentUser.email.toLowerCase() === cleanQuery) ||
                    (currentUser.username && currentUser.username.toLowerCase() === cleanQuery))
        );

        const users = await prisma.user.findMany({
            where: {
                NOT: userId ? { id: userId } : undefined,
                OR: [
                    { username: { contains: query.trim(), mode: 'insensitive' } },
                    { email: { contains: query.trim(), mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                username: true,
                email: true,
            },
            take: 10,
        });

        return res.status(200).json({
            success: true,
            users,
            isSelf: isSearchingSelf,
        });
    } catch (err) {
        console.error('searchUsers error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to search users'
        });
    }
}
