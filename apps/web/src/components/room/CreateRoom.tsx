'use client'

import { CREATE_ROOM_URL } from '@/routes/api-routes';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { PlusIcon } from '@heroicons/react/24/solid';
import { Copy, Check } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import axios from 'axios';

interface CreateRoomProps {
    onRoomCreated: () => void;
}

export default function CreateRoom({ onRoomCreated }: CreateRoomProps) {
    const [roomName, setRoomName] = useState('');
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const { data:session } = useSession();
    const [code, setCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    async function handleCreateRoom() {
        if (!roomName.trim()) return;
        if (!session) return;
        setLoading(true);
        try {
            const res = await axios.post(CREATE_ROOM_URL, {
                name: roomName,
                userId: (session as any).user?.id,
                isPrivate: false,
            }, {
                headers: {
                    Authorization: `Bearer ${(session as any).user?.token}`,
                }
            });
            setCode(res.data.room.code);
            setRoomName('');
            onRoomCreated();
        } catch (err) {
            console.log('create room error: ', err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
                setCode(null);
                setRoomName('');
                setCopied(false);
            }
        }}>
            <DialogTrigger asChild>
                <Button
                    variant='ghost'
                    className='p-2 rounded-full'
                    title='New room'
                >
                    <PlusIcon className='w-5 h-5'/>
                </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-sm bg-white'>
                <DialogHeader>
                    <DialogTitle className='text-gray-900'>Create a room</DialogTitle>
                </DialogHeader>

                {code ? (
                    <div className='flex flex-col items-center gap-3 py-4'>
                        <p className='text-sm text-gray-500'>Room created! Share this code:</p>
                        <div className='bg-gray-100 px-5 py-3 rounded-xl flex items-center gap-3 border border-gray-200'>
                            <span className='text-2xl font-bold tracking-widest text-gray-900 font-mono'>{code}</span>
                            <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={handleCopy}
                                className='h-8 px-3 text-xs flex items-center gap-1.5 rounded-lg border-gray-300 hover:bg-gray-200 text-gray-700'
                            >
                                {copied ? (
                                    <>
                                        <Check className='w-3.5 h-3.5 text-green-600' />
                                        <span className='text-green-600 font-medium'>Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className='w-3.5 h-3.5 text-gray-600' />
                                        <span>Copy</span>
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className='text-xs text-gray-400'>Anyone with this code can join the room</p>
                    </div>
                ) : (
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='room-name' className='text-gray-700' >Room name</Label>
                        <Input
                            id='room-name'
                            placeholder='e.g. General, Design, Team...'
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            className='text-black placeholder:text-gray-400'
                        />
                    </div>
                )}
                <DialogFooter>
                    {code ? (
                        <DialogClose asChild>
                            <Button variant='outline' onClick={() => setCode(null)}>Done</Button>
                        </DialogClose>
                    ) : (
                        <>
                            <DialogClose asChild>
                                <Button variant='outline'>Cancel</Button>
                            </DialogClose>
                            <Button
                            onClick={handleCreateRoom}
                            disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create'}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}