'use client'

import { useState } from 'react';
import CreateRoom from '../room/CreateRoom';
import { useRooms } from '../../hooks/useRooms';
import { useDashboardStore } from '@/src/store/useDashboardStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { disconnectSocket } from '@/src/hooks/useSocket';

export default function ChatPanel() {
    const { rooms, fetchRooms, loading } = useRooms();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const { setSelectedRoom } = useDashboardStore();
    const router = useRouter();

    async function handleLogout() {
        disconnectSocket();
        await signOut({ redirect: false });
        router.replace('/');
    }
    
    const filtered = rooms.filter((room) =>
        room.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className='h-screen w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white'>

            {/* Header */}
            <div className='px-4 py-4 border-gray-200'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-xl font-semibold text-gray-900 py-3'>Chats</h2>
                    <div className='flex items-center gap-1'>
                        <CreateRoom onRoomCreated={fetchRooms}/>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className='p-2 rounded-full hover:bg-gray-100 transition-all'>
                                    <EllipsisVerticalIcon className='w-5 h-5 text-gray-600'/>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='w-40 bg-white' align='end'>
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className='text-red-500 hover:text-red-600 cursor-pointer'
                                >
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Search bar */}
                <div suppressHydrationWarning className='flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2'>
                    <svg className='w-4 h-6 text-gray-400' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
                        <circle cx='11' cy='11' r='8'/><line x1='21' y1='21' x2='16.65' y2='16.65'/>
                    </svg>
                    <input
                        type='text'
                        placeholder='Search or start a new chat'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        suppressHydrationWarning
                        className='bg-transparent text-sm text-gray-600 outline-none w-full placeholder:text-gray-400'
                    />
                </div>
            </div>

            {/* Filter tabs */}
            <div className='flex items-center gap-2 px-5 py-1 border-gray-100'>
                {['All', 'Unread', 'Groups'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        suppressHydrationWarning
                        className={`px-3 py-2 rounded-full text-xs font-medium transition-all hover:cursor-pointer
                            ${activeTab === tab
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }
                        `}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Room list */}
            <div className='flex-1 overflow-y-auto'>
                {loading ? (
                    <div className='flex flex-col gap-1 px-4 pt-2'>
                        {[1,2,3].map((i) => (
                            <div key={i} className='flex items-center gap-3 py-3'>
                                <div className='w-12 h-12 rounded-full bg-gray-100 animate-pulse shrink-0'/>
                                <div className='flex-1 space-y-2'>
                                    <div className='h-3 bg-gray-100 rounded animate-pulse w-1/3'/>
                                    <div className='h-3 bg-gray-100 rounded animate-pulse w-2/3'/>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className='flex items-center justify-center h-full text-sm text-gray-400'>
                        No chats found
                    </div>
                ) : (
                    filtered.map((room) => (
                        <div
                            key={room.id}
                            onClick={() => setSelectedRoom(room)}
                            className='flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-all'
                        >
                            {/* Avatar */}
                            <div className='w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm shrink-0'>
                                {room.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Room info */}
                            <div className='flex-1 min-w-0'>
                                <div className='flex items-center justify-between mb-1'>
                                    <span className='text-sm font-medium text-gray-900'>{room.name}</span>
                                    <span className='text-xs text-gray-400'>
                                        {room.updatedAt ? new Date(room.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                                <span className='text-xs text-gray-500 truncate block'>
                                    {room.lastMessage ?? 'No messages yet'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

        </div>
    )
}