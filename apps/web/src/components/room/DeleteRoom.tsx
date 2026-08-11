'use client'

import { DELETE_ROOM_URL, EXIT_ROOM_URL } from '@/routes/api-routes';
import { useDashboardStore } from '@/src/store/useDashboardStore';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { SocketManager } from '@/src/hooks/useSocket';
import { MessageType } from '@/src/types/socket.types';

interface DeleteRoomProps {
    roomId: string;
    roomName: string;
    ownerId: string;
    onRoomDeleted: () => void;
}

export default function DeleteRoom({ roomId, roomName, ownerId, onRoomDeleted}: DeleteRoomProps) {
    const { data: session } = useSession();
    const { setSelectedRoom, triggerRefresh } = useDashboardStore();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const userId = (session as any)?.user?.id;
    const isOwner = ownerId === userId;

    async function handleDeleteRoom() {
        if (!session) return;
        setLoading(true);
        try {
            if (isOwner) {
                await axios.delete(DELETE_ROOM_URL, {
                    headers: {
                        Authorization: `Bearer ${(session as any).user?.token}`,
                        'Content-Type': 'application/json',
                        'userid': userId,
                        'roomid': roomId,
                    },
                    data: {
                        roomId
                    }
                });
            } else {
                await axios.delete(EXIT_ROOM_URL, {
                    headers: {
                        Authorization: `Bearer ${(session as any).user?.token}`,
                        "Content-Type": 'application/json',
                    },
                    data: {
                        roomId,
                        userId,
                    }
                });
                const socket = SocketManager.connect();
                if (socket.connected) {
                    const exitPayload = {
                        type: MessageType.ROOM_EXIT,
                        roomId,
                        payload: {
                            roomId,
                            userId,
                            username: (session as any).user?.name,
                        }
                    };
                    socket.emit('message', exitPayload);
                    socket.emit(MessageType.ROOM_EXIT, exitPayload);
                }
            }
            setSelectedRoom(null);
            triggerRefresh();
            onRoomDeleted();
            setOpen(false);
        } catch(err) {
            console.log('delete room error:', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className='w-full text-left text-red-500 text-sm px-2 py-1 hover:bg-gray-100 rounded cursor-pointer'>
                    {isOwner ? 'Delete room' : 'Exit room'}
                </button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-sm bg-white'>
                <DialogHeader>
                    <DialogTitle className='text-gray-900'>
                        {isOwner ? 'Delete room' : 'Exit room'}
                    </DialogTitle>
                </DialogHeader>
                <p className='text-sm text-gray-500'>
                    {isOwner
                        ? <>Are you sure you want to delete <span className='font-medium text-gray-900'>{roomName}</span>? This cannot be undone.</>
                        : <>Are you sure you want to exit <span className='font-medium text-gray-900'>{roomName}</span>?</>
                    }
                </p>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant='outline'>Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={handleDeleteRoom}
                        disabled={loading}
                        className='bg-red-500 text-white hover:bg-red-600'
                    >
                        {loading
                            ? (isOwner ? 'Deleting...' : 'Exiting...')
                            : (isOwner ? 'Delete' : 'Exit')
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}