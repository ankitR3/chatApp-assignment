'use client'

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { GET_ROOM_URL } from '@/routes/api-routes';
import axios from 'axios';
import { useDashboardStore } from '@/src/store/useDashboardStore';

export interface RoomMemberUser {
    id: string;
    username: string;
    email?: string;
}

export interface RoomMemberItem {
    id: string;
    role: string;
    user: RoomMemberUser;
}

export interface Room {
    id: string;
    name: string;
    code: string;
    ownerId: string;
    isPrivate?: boolean;
    owner?: RoomMemberUser;
    members?: RoomMemberItem[];
    lastMessage?: string;
    updatedAt?: string;
}

export function useRooms() {
    const { data: session } = useSession();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const { lastMessageUpdate, refreshRooms } = useDashboardStore();

    async function fetchRooms() {
        if (!session) return;
        const userId = (session as any).user?.id;
        try {
            const res = await axios.get(`${GET_ROOM_URL}?userId=${userId}`, {
                headers: {
                    Authorization: `Bearer ${(session as any).user?.token}`,
                }
            });
            const data = res.data;
            const allRooms = [
                ...(data.ownerRooms ?? []),
                ...(data.joinedRooms ?? []),
            ].map((room: any) => ({
                ...room,
                lastMessage: room.message?.[0]?.content ?? null,
            }));
            setRooms(allRooms);
        } catch (err) {
            console.log('get room error: ', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchRooms();
    }, [session, refreshRooms]);

    useEffect(() => {
        if (!lastMessageUpdate) return;
        setRooms(prev => prev.map(room =>
            room.id === lastMessageUpdate.roomId
                ? { ...room, lastMessage: lastMessageUpdate.message, updatedAt: new Date(lastMessageUpdate.ts).toISOString() }
                : room
        ));
    }, [lastMessageUpdate])

    return { rooms, fetchRooms, loading };
}