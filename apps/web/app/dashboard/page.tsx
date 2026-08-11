'use client'

import LeftSidebar from '@/src/components/layout/LeftSidebar';
import MiddleContentbar from '@/src/components/layout/MiddleContentbar';
import RightChatContent from '@/src/components/layout/RightChatContent';
import { useDashboardStore } from '@/src/store/useDashboardStore';

export default function DashboardPage() {
    const { selectedRoom } = useDashboardStore();

    return (
        <div className='flex h-screen w-screen overflow-hidden bg-gray-50'>
            {/* Left sidebar: hidden on mobile when a chat is selected */}
            <div className={`${selectedRoom ? 'hidden md:flex' : 'flex'} h-full flex-shrink-0`}>
                <LeftSidebar />
            </div>

            {/* Middle panel (chat list/settings/explore): hidden on mobile when a chat is selected */}
            <div className={`${selectedRoom ? 'hidden md:flex' : 'flex-1 md:flex-none'} h-full min-w-0`}>
                <MiddleContentbar />
            </div>

            {/* Right chat panel: full screen on mobile when a chat is selected, hidden on mobile if no chat is selected */}
            <div className={`${selectedRoom ? 'flex-1' : 'hidden md:flex md:flex-1'} h-full min-w-0`}>
                <RightChatContent />
            </div>
        </div>
    )
}