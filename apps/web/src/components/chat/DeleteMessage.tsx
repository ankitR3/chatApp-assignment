'use client'

import { DELETE_MESSAGE_URL } from '@/routes/api-routes';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Button } from '../ui/button';
import { TrashIcon } from '@heroicons/react/24/solid';

interface DeleteMessageProps {
    messageId: string;
    senderId: string;
    onMessageDeleted: (messageId: string) => void;
}

export default function DeleteMessage({ messageId, senderId, onMessageDeleted}: DeleteMessageProps) {
    const { data: session } = useSession();
    const userId = (session as any)?.user?.id;

    if (userId !== senderId) return null;

    async function handleDelete() {
        if (!session) return;
        try {
            await axios.delete(DELETE_MESSAGE_URL, {
                data: {
                    messageId
                },
                headers: {
                    Authorization: `Bearer ${(session as any).user?.token}`,
                }
            });

            onMessageDeleted(messageId);
        } catch (err) {
            console.log('delete message error: ', err);
        }
    }

    return (
        <Button
            variant='ghost'
            onClick={handleDelete}
        >
            <TrashIcon />
        </Button>
    )
}