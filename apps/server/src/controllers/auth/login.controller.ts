import prisma from '@repo/db';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { createSession } from '../../redis/redisSession';

export default async function loginController(req: Request, res: Response) {
    const bodyUser = req.body?.user || req.body;
    const email = bodyUser?.email;
    const name = bodyUser?.name || email?.split('@')[0] || 'User';
    const image = bodyUser?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    if (!email) {
        return res.status(400).json({
            message: 'user email required'
        });
    }

    try {
        let myUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (!myUser) {
            myUser = await prisma.user.create({
                data: {
                    name: name,
                    email: email,
                    image: image
                }
            });
        } else {
            myUser = await prisma.user.update({
                where: {
                    email: email
                },
                data: {
                    name: name,
                    image: image || myUser.image
                }
            });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({
                message: 'JWT_SECRET is missing'
            });
        }

        const token = jwt.sign(
            {
                id: myUser.id,
                email: myUser.email
            },
            secret,
            {
                expiresIn: '7d'
            }
        );

        await createSession(myUser.id, token);

        return res.status(200).json({
            success: true,
            user: myUser,
            token,
        });
    } catch (err) {
        console.log('login error: ', err);
        return res.status(500).json({
            message: 'authentication failed'
        });
    }
}