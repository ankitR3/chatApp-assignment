'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Room } from '@/src/hooks/useRooms';

interface GroupDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    room: Room;
    onlineUserIds: string[];
    currentUserId?: string;
}

export default function GroupDetailsModal({
    isOpen,
    onClose,
    room,
    onlineUserIds,
    currentUserId
}: GroupDetailsModalProps) {
    const [copied, setCopied] = useState(false);

    // Compile list of unique members
    const membersMap = new Map<string, { id: string; username: string; role: string }>();

    if (room.owner) {
        membersMap.set(room.owner.id, {
            id: room.owner.id,
            username: room.owner.username || room.owner.email || 'Room Creator',
            role: 'Host'
        });
    } else if (room.ownerId) {
        membersMap.set(room.ownerId, {
            id: room.ownerId,
            username: 'Room Creator',
            role: 'Host'
        });
    }

    if (room.members && Array.isArray(room.members)) {
        room.members.forEach((m) => {
            if (m.user) {
                const isHost = m.user.id === room.ownerId;
                membersMap.set(m.user.id, {
                    id: m.user.id,
                    username: m.user.username || m.user.email || 'Member',
                    role: isHost ? 'Host' : 'Member'
                });
            }
        });
    }

    const memberList = Array.from(membersMap.values());

    const copyRoomCode = () => {
        navigator.clipboard.writeText(room.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isDirectChat = Boolean(room.isPrivate || room.code?.startsWith('DM'));

    const totalMembers = memberList.length;
    const onlineCount = memberList.filter((m) =>
        m.id === currentUserId || onlineUserIds.includes(m.id)
    ).length;

    // For 1-on-1 direct chat title
    const otherUser = isDirectChat ? memberList.find(m => m.id !== currentUserId) : null;
    const modalTitle = isDirectChat ? (otherUser?.username || room.name) : room.name;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className='bg-white sm:max-w-md rounded-2xl p-6'>
                <DialogHeader className='text-center flex flex-col items-center border-b border-gray-100 pb-4'>
                    <div className='w-16 h-16 rounded-full bg-gray-900 text-white flex items-center justify-center text-2xl font-semibold mb-2 shadow-sm'>
                        {(modalTitle || 'G').charAt(0).toUpperCase()}
                    </div>
                    <DialogTitle className='text-xl font-bold text-gray-900'>{modalTitle}</DialogTitle>
                    <p className='text-xs text-gray-500 mt-1'>
                        {isDirectChat ? 'Private 1-on-1 Chat' : `${totalMembers} ${totalMembers === 1 ? 'member' : 'members'} • ${onlineCount} online`}
                    </p>

                    {/* Room Code Card (ONLY shown for Group Chats, hidden for 1-on-1 Direct Chats) */}
                    {!isDirectChat && (
                        <div className='mt-3 flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg'>
                            <span className='text-xs text-gray-500 font-medium'>Code:</span>
                            <code className='text-xs font-mono font-bold text-gray-800'>{room.code}</code>
                            <button
                                onClick={copyRoomCode}
                                className='ml-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer'
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    )}
                </DialogHeader>

                {/* Member List */}
                <div className='mt-4'>
                    <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3'>
                        Room Members ({totalMembers})
                    </h3>

                    <div className='max-h-60 overflow-y-auto space-y-2 pr-1'>
                        {memberList.map((member) => {
                            const isUserOnline = member.id === currentUserId || onlineUserIds.includes(member.id);
                            const isYou = member.id === currentUserId;
                            const displayName = member.username || 'User';
                            const initial = (displayName.charAt(0) || 'U').toUpperCase();

                            return (
                                <div
                                    key={member.id}
                                    className='flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100'
                                >
                                    <div className='flex items-center gap-3'>
                                        {/* Avatar with status dot */}
                                        <div className='relative w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-700 text-sm'>
                                            {initial}
                                            <span
                                                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                                    isUserOnline ? 'bg-emerald-500' : 'bg-gray-300'
                                                }`}
                                            />
                                        </div>

                                        <div>
                                            <p className='text-sm font-semibold text-gray-900 leading-tight'>
                                                {displayName} {isYou && <span className='text-xs font-normal text-gray-400'>(You)</span>}
                                            </p>
                                            <span
                                                className={`text-[11px] font-medium ${
                                                    isUserOnline ? 'text-emerald-600' : 'text-gray-400'
                                                }`}
                                            >
                                                {isUserOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Role badge */}
                                    <span
                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                            member.role === 'Host'
                                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {member.role}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
