'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { JOIN_ROOM_URL, SEARCH_USERS_URL, DIRECT_ROOM_URL } from '@/routes/api-routes';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import axios from 'axios';
import { SocketManager } from '@/src/hooks/useSocket';
import { MessageType } from '@/src/types/socket.types';
import { useDashboardStore } from '@/src/store/useDashboardStore';
import { Search, Mail, MessageSquare, Users, KeyRound, Check } from 'lucide-react';

interface JoinRoomProps {
    onRoomJoined: () => void;
}

interface UserSearchResult {
    id: string;
    username: string;
    email: string;
}

export default function JoinRoom({ onRoomJoined }: JoinRoomProps) {
    const { data: session } = useSession();
    const { setSelectedRoom, triggerRefresh } = useDashboardStore();

    const [subTab, setSubTab] = useState<'people' | 'group'>('people');

    // Group Join State
    const [code, setCode] = useState('');
    const [loadingGroup, setLoadingGroup] = useState(false);
    const [groupError, setGroupError] = useState<string | null>(null);
    const [groupSuccess, setGroupSuccess] = useState(false);

    // People Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [isSelf, setIsSelf] = useState(false);
    const [searching, setSearching] = useState(false);
    const [directLoadingId, setDirectLoadingId] = useState<string | null>(null);
    const [inviteSent, setInviteSent] = useState(false);

    const userId = (session as any)?.user?.id;
    const token = (session as any)?.user?.token;

    // Search users on backend
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setIsSelf(false);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await axios.get(
                    `${SEARCH_USERS_URL}?q=${encodeURIComponent(searchQuery)}&userId=${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                if (res.data.success) {
                    setSearchResults(res.data.users || []);
                    setIsSelf(res.data.isSelf || false);
                }
            } catch (err) {
                console.error('Search users failed:', err);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, userId, token]);

    // Handle starting a 1-on-1 Direct Chat
    async function handleStartDirectChat(targetUser: UserSearchResult) {
        if (!userId || !token) return;
        setDirectLoadingId(targetUser.id);
        try {
            const res = await axios.post(
                DIRECT_ROOM_URL,
                {
                    userId,
                    targetUserId: targetUser.id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.data.success && res.data.room) {
                const room = res.data.room;

                // Set user-friendly title for the 1-on-1 direct room
                const formattedRoom = {
                    ...room,
                    name: targetUser.username || targetUser.email || 'Direct Chat',
                };

                triggerRefresh();
                setSelectedRoom(formattedRoom);
                onRoomJoined();
            }
        } catch (err) {
            console.error('Failed to start direct room:', err);
        } finally {
            setDirectLoadingId(null);
        }
    }

    // Handle Join Group by Code
    async function handleJoinRoom() {
        if (!code.trim() || !session) return;
        setLoadingGroup(true);
        setGroupError(null);
        try {
            const res = await axios.post(
                JOIN_ROOM_URL,
                {
                    code: code.toUpperCase(),
                    userId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.data.success) {
                const roomId = res.data.room.id;
                const username = (session as any).user?.name;

                const sendJoinEvent = (socket: any) => {
                    const joinPayload = {
                        type: MessageType.ROOM_JOINED,
                        roomId,
                        payload: {
                            roomId,
                            userId,
                            username,
                        },
                    };
                    socket.emit('message', joinPayload);
                    socket.emit(MessageType.ROOM_JOINED, joinPayload);
                };

                const socket = SocketManager.connect();
                if (socket.connected) {
                    sendJoinEvent(socket);
                } else {
                    socket.once('connect', () => sendJoinEvent(socket));
                }
                setGroupSuccess(true);
                setCode('');
                triggerRefresh();
                setSelectedRoom(res.data.room);
                onRoomJoined();
            } else {
                setGroupError(res.data.message || 'Failed to join room');
            }
        } catch (err: any) {
            setGroupError(
                err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.'
            );
        } finally {
            setLoadingGroup(false);
        }
    }

    const [copiedInvite, setCopiedInvite] = useState(false);
    const isEmailFormat = searchQuery.includes('@') && searchQuery.includes('.');

    function handleSendEmailInvite() {
        const subject = encodeURIComponent('Join me on ChatApp!');
        const body = encodeURIComponent(
            `Hey!\n\nI'm using ChatApp to message. Sign up and chat with me here:\n${window.location.origin}`
        );
        // Opens Gmail Compose in web browser directly
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(searchQuery)}&su=${subject}&body=${body}`;
        window.open(gmailUrl, '_blank');
        setInviteSent(true);
        setTimeout(() => setInviteSent(false), 4000);
    }

    function handleCopyInviteLink() {
        const text = `Hey! Join me on ChatApp here: ${window.location.origin}`;
        navigator.clipboard.writeText(text);
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 3000);
    }

    return (
        <div className='h-screen flex flex-col bg-white w-full md:w-80 lg:w-96 border-r border-gray-200'>
            {/* Top Navigation */}
            <div className='px-4 py-4 border-b border-gray-100'>
                <h2 className='text-xl font-semibold text-gray-900 mb-3'>Explore & Connect</h2>

                {/* Sub Tab Switcher */}
                <div className='flex bg-gray-100 p-1 rounded-xl gap-1'>
                    <button
                        onClick={() => setSubTab('people')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            subTab === 'people'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Users className='w-3.5 h-3.5' />
                        Find People
                    </button>

                    <button
                        onClick={() => setSubTab('group')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            subTab === 'group'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <KeyRound className='w-3.5 h-3.5' />
                        Group Code
                    </button>
                </div>
            </div>

            {/* Sub Tab Content */}
            <div className='flex-1 overflow-y-auto p-4'>
                {subTab === 'people' ? (
                    <div className='space-y-4'>
                        {/* Search Input */}
                        <div className='relative'>
                            <Search className='absolute left-3 top-2.5 w-4 h-4 text-gray-400' />
                            <Input
                                type='text'
                                placeholder='Search username or email...'
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className='pl-9 bg-gray-50 border-gray-200 text-sm placeholder:text-gray-400 rounded-xl focus:bg-white'
                            />
                        </div>

                        {/* Search Results / Default State */}
                        {searching ? (
                            <div className='py-8 text-center text-xs text-gray-400 animate-pulse'>
                                Searching registered users...
                            </div>
                        ) : searchQuery.trim() === '' ? (
                            <div className='py-12 text-center text-gray-400 space-y-2'>
                                <Users className='w-8 h-8 mx-auto opacity-30' />
                                <p className='text-xs'>Type a username or email to start a private 1-on-1 chat</p>
                            </div>
                        ) : isSelf ? (
                            <div className='py-8 text-center space-y-2 bg-blue-50/70 border border-blue-100 rounded-xl p-4'>
                                <p className='text-xs text-blue-900 font-semibold'>This is your own account (You)</p>
                                <p className='text-[11px] text-blue-600'>
                                    Search for another person's name or email to start a private 1-on-1 chat!
                                </p>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className='space-y-2'>
                                <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider px-1'>
                                    Found Users ({searchResults.length})
                                </p>
                                {searchResults.map((user) => (
                                    <div
                                        key={user.id}
                                        className='flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all'
                                    >
                                        <div className='flex items-center gap-3 min-w-0 pr-2'>
                                            <div className='w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold text-sm shrink-0'>
                                                {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div className='min-w-0'>
                                                <p className='text-sm font-semibold text-gray-900 truncate leading-tight'>
                                                    {user.username}
                                                </p>
                                                <p className='text-xs text-gray-400 truncate'>{user.email}</p>
                                            </div>
                                        </div>

                                        <Button
                                            size='sm'
                                            onClick={() => handleStartDirectChat(user)}
                                            disabled={directLoadingId === user.id}
                                            className='bg-gray-900 hover:bg-gray-800 text-white text-xs px-3 py-1.5 h-8 rounded-lg shrink-0 flex items-center gap-1.5'
                                        >
                                            <MessageSquare className='w-3.5 h-3.5' />
                                            {directLoadingId === user.id ? 'Opening...' : 'Message'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='py-8 text-center space-y-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4'>
                                <p className='text-xs text-gray-500'>
                                    No registered user found for <strong className='text-gray-900'>"{searchQuery}"</strong>
                                </p>

                                {isEmailFormat ? (
                                    <div className='space-y-2'>
                                        <Button
                                            onClick={handleSendEmailInvite}
                                            className='w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm'
                                        >
                                            <Mail className='w-4 h-4' />
                                            Send Invite via Gmail Web
                                        </Button>

                                        <Button
                                            variant='outline'
                                            onClick={handleCopyInviteLink}
                                            className='w-full text-xs py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-gray-700 hover:bg-gray-100'
                                        >
                                            {copiedInvite ? 'Link Copied!' : 'Copy Invite Link'}
                                        </Button>

                                        {inviteSent && (
                                            <p className='text-[11px] text-emerald-600 font-medium flex items-center justify-center gap-1 mt-1'>
                                                <Check className='w-3 h-3' /> Opened Gmail Compose in new tab!
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className='text-[11px] text-gray-400'>
                                        Tip: Enter a full email address (e.g. friend@gmail.com) to send an invite!
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Group Room Code Form */
                    <div className='space-y-4 pt-2'>
                        <div>
                            <h3 className='text-sm font-semibold text-gray-900 mb-1'>Join Group Room</h3>
                            <p className='text-xs text-gray-400 mb-4'>Enter the 6-character room code to join an existing group chat.</p>

                            <div className='flex flex-col gap-3'>
                                <Label htmlFor='code' className='text-xs font-medium text-gray-700'>
                                    Room code
                                </Label>
                                <Input
                                    id='code'
                                    placeholder='e.g. ABC123'
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    className='text-gray-900 placeholder:text-gray-400 tracking-widest font-mono text-center text-lg uppercase'
                                    maxLength={8}
                                />

                                {groupError && <p className='text-xs text-red-500'>{groupError}</p>}
                                {groupSuccess && <p className='text-xs text-emerald-600 font-medium'>Joined room successfully!</p>}

                                <Button
                                    onClick={handleJoinRoom}
                                    disabled={loadingGroup || !code.trim()}
                                    className='w-full bg-gray-900 hover:bg-gray-800 text-white mt-2'
                                >
                                    {loadingGroup ? 'Joining...' : 'Join Group Room'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}