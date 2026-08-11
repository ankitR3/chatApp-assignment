import { create } from 'zustand';
import { DashboardEnum } from '../types/DashboardEnum';

interface Room {
    id: string;
    name: string;
    code: string;
    ownerId: string;
    lastMessage?: string;
    updatedAt?: string;
}

interface LastMessageUpdate {
    roomId: string;
    message: string;
    ts: number;
}

interface DashboardStore {
    activeTab: DashboardEnum;
    setActiveTab: (tab: DashboardEnum) => void;
    selectedRoom: Room | null;
    setSelectedRoom: (room: Room | null) => void;
    refreshRooms: number;
    triggerRefresh: () => void;
    lastMessageUpdate: LastMessageUpdate | null;
    updateRoomLastMessage: (roomId: string, message: string) => void;
    activeUsers: {
        id: string,
        name: string
    }[];
    addActiveUser: (user: {
        id: string;
        name: string;
    }) => void;
    removeActiveUser: (userId: string) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
    activeTab: DashboardEnum.CHATS,
    setActiveTab: (tab) => set({ activeTab: tab }),
    selectedRoom: null,
    setSelectedRoom: (room) => set({
        selectedRoom: room
    }),
    refreshRooms: 0,
    triggerRefresh: () => set((state) => ({
        refreshRooms: state.refreshRooms + 1
    })),
    lastMessageUpdate: null,
    updateRoomLastMessage: (roomId, message) => set({
        lastMessageUpdate: {
            roomId,
            message,
            ts: Date.now()
        }
    }),
    activeUsers: [],
    addActiveUser: (user) => set((state) => ({
        activeUsers: [...state.activeUsers.filter(u => u.id !== user.id), user]
    })),
    removeActiveUser: (userId) => set((state) => ({
        activeUsers: state.activeUsers.filter(u => u.id !== userId)
    })),
}));