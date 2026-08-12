'use client'

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/src/hooks/useSocket';
import { MessageType } from '@/src/types/socket.types';
import { useMessages } from '@/src/hooks/useMessages';
import { useSendMessage } from '@/src/hooks/useSendMessage';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import DeleteRoom from '../room/DeleteRoom';
import GroupDetailsModal from '../room/GroupDetailsModal';
import { useDashboardStore } from '@/src/store/useDashboardStore';
import { Check, CheckCheck } from 'lucide-react';
import { Room } from '@/src/hooks/useRooms';
import { Message } from '@/src/hooks/useMessages';

interface ChatWindowProps {
    room: Room;
    onRoomDeleted: () => void;
}

const USER_COLORS = [
    { bg: 'bg-blue-500',    text: 'text-white', bubble: 'bg-blue-100',    bubbleText: 'text-blue-900'    },
    { bg: 'bg-emerald-500', text: 'text-white', bubble: 'bg-emerald-100', bubbleText: 'text-emerald-900' },
    { bg: 'bg-violet-500',  text: 'text-white', bubble: 'bg-violet-100',  bubbleText: 'text-violet-900'  },
    { bg: 'bg-rose-500',    text: 'text-white', bubble: 'bg-rose-100',    bubbleText: 'text-rose-900'    },
    { bg: 'bg-amber-500',   text: 'text-white', bubble: 'bg-amber-100',   bubbleText: 'text-amber-900'   },
    { bg: 'bg-cyan-500',    text: 'text-white', bubble: 'bg-cyan-100',    bubbleText: 'text-cyan-900'    },
];

const senderColorMap = new Map<string, (typeof USER_COLORS)[number]>();
let colorIndex = 0;

function getColorForSender(senderId: string) {
    if (!senderColorMap.has(senderId)) {
        senderColorMap.set(
            senderId,
            USER_COLORS[colorIndex % USER_COLORS.length]!
        );
        colorIndex++;
    }
    return senderColorMap.get(senderId)!;
}

function getInitials(nameOrId: string) {
    const parts = nameOrId.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
    }
    return nameOrId.slice(0, 2).toUpperCase();
}

export default function ChatWindow({ room, onRoomDeleted }: ChatWindowProps) {
    const { data: session } = useSession();
    const { messages, setMessages } = useMessages(room.id);
    const { saveMessage } = useSendMessage(room.id);
    const [copied, setCopied] = useState(false);
    const [input, setInput] = useState('');
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { updateRoomLastMessage, addActiveUser, removeActiveUser, setSelectedRoom, activeUsers } = useDashboardStore();

    const userId = (session as any)?.user?.id ?? '';
    const username = (session as any)?.user?.name ?? 'someone';

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const shouldScrollRef = useRef(true);

    const handleScroll = () => {
        const container = messagesContainerRef.current;

        if (!container) return;
        const isNearBottom =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
            100;
        shouldScrollRef.current = isNearBottom;
    };

    useEffect(() => {
        const container = messagesContainerRef.current;

        if (!container || messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];

        const isMyMessage = lastMessage.senderId === userId;

        if (isMyMessage || shouldScrollRef.current) {
            container.scrollTop = container.scrollHeight;
        }
    }, [messages, userId]);

    const handleMessage = useCallback((data: any) => {
        if (data.type === MessageType.CHAT) {
            setMessages((prev) => {
                const msgId = data.payload?.id;
                if (msgId && prev.some((m) => m.id === msgId)) {
                    return prev;
                }
                return [...prev, {
                    ...data.payload,
                    id: msgId || `msg-${Date.now()}-${Math.random()}`,
                    status: data.payload.status || 'SENT',
                }];
            });
            updateRoomLastMessage(room.id, data.payload.message);
        }

        if (data.type === MessageType.USER_PRESENCE) {
            const { userId: presUserId, isOnline } = data.payload || {};
            if (presUserId) {
                setOnlineUserIds((prev) =>
                    isOnline
                        ? Array.from(new Set([...prev, presUserId]))
                        : prev.filter((id) => id !== presUserId)
                );
            }
        }

        if (data.type === MessageType.GET_ONLINE_USERS) {
            if (data.payload?.onlineUserIds) {
                setOnlineUserIds(data.payload.onlineUserIds);
            }
        }

        if (data.type === MessageType.TYPING) {
            if (data.payload?.userId !== userId) {
                setTypingUser(data.payload?.username || 'Someone');
            }
        }

        if (data.type === MessageType.STOP_TYPING) {
            if (data.payload?.userId !== userId) {
                setTypingUser(null);
            }
        }

        if (data.type === MessageType.ROOM_JOINED) {
            setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                senderId: 'system',
                message: `${data.payload.username} joined the room`,
                timestamp: new Date().toISOString(),
                type: 'system'
            }]);
            addActiveUser({
                id: data.payload.userId,
                name: data.payload.username
            });
        }

        if (data.type === MessageType.ROOM_EXIT) {
            setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                senderId: 'system',
                message: `${data.payload.username} left the room`,
                timestamp: new Date().toISOString(),
                type: 'system'
            }]);
            removeActiveUser(data.payload.userId);
        }

        // Handle delivery status updates
        if (data.type === MessageType.MESSAGE_DELIVERED) {
            const deliveredIds = new Set(data.payload?.messageIds || []);
            setMessages((prev) =>
                prev.map((msg) =>
                    deliveredIds.has(msg.id) && msg.status !== 'READ'
                        ? { ...msg, status: 'DELIVERED' as const }
                        : msg
                )
            );
        }

        // Handle read status updates
        if (data.type === MessageType.MESSAGE_READ) {
            const readIds = new Set(data.payload?.messageIds || []);
            setMessages((prev) =>
                prev.map((msg) =>
                    readIds.has(msg.id)
                        ? { ...msg, status: 'READ' as const }
                        : msg
                )
            );
        }
    }, [updateRoomLastMessage, addActiveUser, removeActiveUser, userId, room.id, setMessages]);

    const { sendMessage, sendTyping, sendReadReceipt } = useSocket({
        roomId: room.id,
        userId,
        username,
        onMessage: handleMessage,
    });

    // Send read receipts for unread messages from other users
    useEffect(() => {
        const unreadIds = messages
            .filter((msg) => msg.senderId !== userId && msg.type !== 'system' && msg.status && msg.status !== 'READ' && msg.id)
            .map((msg) => msg.id);

        if (unreadIds.length > 0) {
            sendReadReceipt(unreadIds);
        }
    }, [messages, userId, sendReadReceipt]);

    function copyCode() {
        navigator.clipboard.writeText(room.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        if (sendTyping) {
            sendTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                sendTyping(false);
            }, 2000);
        }
    };

    async function handleSend() {
        const text = input.trim();
        if (!text) return;
        if (sendTyping) sendTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        shouldScrollRef.current = true;
        setInput('');
        sendMessage(text);
        await saveMessage(text);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' && !e.repeat) handleSend();
    }

    // Check if room is 1-on-1 Direct Chat
    const isDirectChat = Boolean(room.isPrivate || room.code?.startsWith('DM'));

    // For Direct Chat: find the recipient user (other person in the chat)
    let recipientUser: { id: string; name: string } | null = null;
    if (isDirectChat) {
        if (room.members && room.members.length > 0) {
            const otherMember = room.members.find((m) => m.user?.id && m.user.id !== userId);
            if (otherMember?.user) {
                recipientUser = {
                    id: otherMember.user.id,
                    name: otherMember.user.username || otherMember.user.email || 'User',
                };
            }
        }
        if (!recipientUser && room.ownerId && room.ownerId !== userId) {
            recipientUser = {
                id: room.ownerId,
                name: room.owner?.username || room.owner?.email || room.name || 'User',
            };
        }
    }

    const isRecipientOnline = recipientUser ? onlineUserIds.includes(recipientUser.id) : false;
    const headerTitle = isDirectChat && recipientUser ? recipientUser.name : room.name;

    // Calculate members and online counts for Group header
    const memberIds = new Set<string>();
    if (room.ownerId) memberIds.add(room.ownerId);
    if (room.owner?.id) memberIds.add(room.owner.id);
    if (room.members) {
        room.members.forEach((m) => {
            if (m.user?.id) memberIds.add(m.user.id);
        });
    }
    const allMemberIds = Array.from(memberIds);
    const totalMembersCount = Math.max(allMemberIds.length, 1);
    const onlineMembersCount = allMemberIds.filter((id) =>
        id === userId || onlineUserIds.includes(id)
    ).length || 1;

    return (
        <div className='flex-1 flex flex-col bg-white h-full overflow-hidden'>
            {/* Header */}
            <div className='flex items-center gap-3 px-4 py-3 border-b border-gray-200'>
                {/* Back button (visible only on mobile) */}
                <button
                    onClick={() => setSelectedRoom(null)}
                    className='md:hidden p-1 rounded-full hover:bg-gray-100 transition-all mr-1'
                >
                    <svg className='w-6 h-6 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth={2}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7'/>
                    </svg>
                </button>

                {/* Clickable Header Info */}
                <div
                    onClick={() => setIsGroupModalOpen(true)}
                    className='flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity'
                    title={isDirectChat ? 'Click for info' : 'Click for group info'}
                >
                    <div className='relative w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center font-medium text-sm shrink-0'>
                        {headerTitle.charAt(0).toUpperCase()}
                        <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                isDirectChat
                                    ? isRecipientOnline
                                        ? 'bg-emerald-500'
                                        : 'bg-gray-300'
                                    : 'bg-emerald-500'
                            }`}
                            title={isDirectChat ? (isRecipientOnline ? 'Online' : 'Offline') : 'Online'}
                        />
                    </div>
                    <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                            <p className='text-sm font-semibold text-gray-900 truncate'>{headerTitle}</p>
                            {isDirectChat ? (
                                isRecipientOnline ? (
                                    <span className='inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0'>
                                        <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />
                                        Online
                                    </span>
                                ) : (
                                    <span className='inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0'>
                                        <span className='w-1.5 h-1.5 rounded-full bg-gray-400' />
                                        Offline
                                    </span>
                                )
                            ) : (
                                <span className='inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0'>
                                    <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />
                                    {`${onlineMembersCount}/${totalMembersCount} Online`}
                                </span>
                            )}
                        </div>

                        {/* Room Code with Copy button (ONLY shown for Group Chats, hidden for 1-on-1 Direct Chats) */}
                        {!isDirectChat && (
                            <div className='flex items-center gap-1 mt-0.5' onClick={(e) => e.stopPropagation()}>
                                <p className='text-xs text-gray-400 font-mono'>{room.code.slice(0, 3)}***</p>
                                <button
                                    onClick={copyCode}
                                    title='Copy room code'
                                    className='text-gray-400 hover:text-gray-600 transition-all'
                                >
                                    <svg className='w-3 h-3' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
                                        <rect x='9' y='9' width='13' height='13' rx='2' ry='2'/>
                                        <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'/>
                                    </svg>
                                </button>
                                {copied && (
                                    <span className='text-xs text-blue-500'>copied</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant='ghost' className='p-2 rounded-full hover:bg-gray-100 transition-all'>
                            <EllipsisVerticalIcon className='w-5 h-5 text-black' />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='bg-white' align='end'>
                        <DeleteRoom
                            roomId={room.id}
                            roomName={room.name}
                            ownerId={room.ownerId}
                            onRoomDeleted={onRoomDeleted}
                        />
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Messages area */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className='flex-1 overflow-y-auto p-4 flex flex-col gap-2'
            >
                {messages.map((msg, index) => {
                    const isMe = msg.senderId === userId;
                    const isSystem = msg.type === 'system';

                    if (isSystem) {
                        return (
                            <div key={index} className='flex justify-center'>
                                <span className='text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full'>
                                    {msg.message}
                                </span>
                            </div>
                        );
                    }

                    const color = isMe ? null : getColorForSender(msg.senderId);
                    const initials = getInitials(msg.senderName ?? msg.senderId);

                    return (
                        <div
                            key={index}
                            className={`flex items-end gap-2 ${
                                isMe ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            {!isMe && (
                                <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${color!.bg} ${color!.text}`}
                                >
                                    {initials}
                                </div>
                            )}

                            <div
                                className={`px-4 py-2 rounded-2xl max-w-xs text-sm wrap-break-word ${
                                    isMe
                                        ? 'bg-gray-900 text-white rounded-br-sm'
                                        : `${color!.bubble} ${color!.bubbleText} rounded-bl-sm`
                                }`}
                            >
                                {!isMe && (
                                    <p
                                        className={`text-xs font-semibold mb-0.5 ${color!.bubbleText} opacity-70`}
                                    >
                                        {msg.senderName ?? msg.senderId}
                                    </p>
                                )}

                                <div>{msg.message}</div>

                                {/* Timestamp and Read/Delivered Ticks */}
                                <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-gray-300' : 'text-gray-500'}`}>
                                    <span>
                                        {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMe && (
                                        msg.status === 'READ' ? (
                                            <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />
                                        ) : msg.status === 'DELIVERED' ? (
                                            <CheckCheck className="w-3.5 h-3.5 text-gray-400 inline" />
                                        ) : (
                                            <Check className="w-3.5 h-3.5 text-gray-400 inline" />
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Live Typing Indicator */}
            {typingUser && (
                <div className="px-4 py-1.5 text-xs text-gray-500 italic flex items-center gap-1.5 bg-gray-50 border-t border-gray-100">
                    <span>{typingUser} is typing</span>
                    <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </span>
                </div>
            )}

            {/* Input */}
            <div className='flex items-center gap-3 px-4 py-3 border-t border-gray-200'>
                <input
                    type='text'
                    placeholder='Type a message...'
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className='flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-black outline-none placeholder:text-gray-400'
                />
                <button
                    onClick={handleSend}
                    className='w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center shrink-0 hover:bg-gray-800 transition-all'
                >
                    <svg className='w-4 h-4 stroke-white fill-none' viewBox='0 0 24 24' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
                        <line x1='22' y1='2' x2='11' y2='13'/><polygon points='22 2 15 22 11 13 2 9 22 2' fill='white'/>
                    </svg>
                </button>
            </div>

            {/* Group Details Modal */}
            <GroupDetailsModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                room={room}
                onlineUserIds={onlineUserIds}
                currentUserId={userId}
            />
        </div>
    );
}