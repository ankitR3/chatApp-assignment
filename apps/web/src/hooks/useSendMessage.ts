'use client'

import { useSession } from 'next-auth/react';
import { SEND_MESSAGE_URL } from '@/routes/api-routes';
import axios from 'axios';

export function useSendMessage(roomId: string) {
    const { data: session } = useSession();

    async function saveMessage(content: string) {
        if (!session || !content.trim()) return;
        try {
            await axios.post(SEND_MESSAGE_URL, {
                roomId,
                content,
                userId: (session as any).user?.id,
            }, {
                headers: {
                    Authorization: `Bearer ${(session as any).user?.token}`,
                }
            });
        } catch (err) {
            console.log('send message error: ', err);
        }
    }
    return { saveMessage };
}