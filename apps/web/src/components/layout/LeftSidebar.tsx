'use client'

import { useDashboardStore } from '@/src/store/useDashboardStore';
import { DashboardEnum } from '@/src/types/DashboardEnum';
import { useSession } from 'next-auth/react';
import { MagnifyingGlassIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/solid';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/hover-card';

export default function leftSidebar() {
    const { activeTab, setActiveTab } = useDashboardStore();
    const { data:session } = useSession();

    function handleTabChange(tab: DashboardEnum) {
        const params = new URLSearchParams(window.location.search);
        params.set('tab', tab);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
        setActiveTab(tab);
    }

    const menuItems = [
        { value: DashboardEnum.CHATS, icon: ChatBubbleBottomCenterTextIcon, tooltip: 'CHATS'},
        { value: DashboardEnum.EXPLORE, icon: MagnifyingGlassIcon, tooltip: 'EXPLORE'}
    ]

    return (
        <aside className='h-screen bg-white border-r border-gray-200 flex flex-col px-3 py-4'>
            <nav className='flex flex-col items-center gap-2 w-full'>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab == item.value;
                    return (
                       <div
                            key={item.value}
                            onClick={() => handleTabChange(item.value)}
                            className={`flex items-center p-3 rounded-3xl cursor-pointer transition-all
                                ${active
                                    ? 'bg-gray-200 text-gray-900 font-medium'
                                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                }
                            `}
                       >
                        <Icon className='w-6 h-6 text-black'></Icon>
                       </div> 
                    );
                })}
            </nav>

            <div className='mt-auto'>
                {session?.user?.image && (
                    <img
                        src={session.user.image}
                        alt='Profile'
                        title={session.user.name ?? 'Profile'}
                        onClick={() => handleTabChange(DashboardEnum.SETTINGS)}
                        className={`w-10 h-10 rounded-full cursor-pointer transition-all mt-auto
                            ${activeTab === DashboardEnum.SETTINGS
                                ? 'ring-2 ring-gray-900'
                                : 'hover:ring-2 hover:ring-gray-300'
                            }
                        `}
                    />
                )}
            </div>
        </aside>
    )
}