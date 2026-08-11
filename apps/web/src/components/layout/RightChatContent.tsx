'use client'

import { useDashboardStore } from '@/src/store/useDashboardStore';
import ChatWindow from '../chat/ChatWindow';

export default function RightChatContent() {
    const { selectedRoom, setSelectedRoom } = useDashboardStore();

    if (!selectedRoom) {
        return (
            <div className='flex-1 flex items-center justify-center bg-gray-50'>
                <p className='text-gray-400 text-sm'>Select a chat to start messaging</p>
            </div>
        )
    }

    return <ChatWindow room={selectedRoom} onRoomDeleted={() => setSelectedRoom(null)}/>
}