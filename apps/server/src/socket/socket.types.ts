export enum MessageType {
    CHAT = 'CHAT',
    SUBSCRIBE = 'SUBSCRIBE',
    UNSUBSCRIBE = 'UNSUBSCRIBE',
    ROOM_CREATED = 'ROOM_CREATED',
    ROOM_JOINED = 'ROOM_JOINED',
    ROOM_EXIT = 'ROOM_EXIT',
    ROOM_DELETED = 'ROOM_DELETED',
    TYPING = 'TYPING',
    STOP_TYPING = 'STOP_TYPING',
    USER_PRESENCE = 'USER_PRESENCE',
    GET_ONLINE_USERS = 'GET_ONLINE_USERS',
    MESSAGE_DELIVERED = 'MESSAGE_DELIVERED',
    MESSAGE_READ = 'MESSAGE_READ'
}

export interface UserPresence {
    userId: string;
    isOnline: boolean;
}

export interface OnlineUsersList {
    onlineUserIds: string[];
}

export interface Chat {
    message: string;
    timestamp: string;
    senderId: string;
    senderName: string;
    status?: 'SENT' | 'DELIVERED' | 'READ';
}

export interface Subscribe {
    userId: string;
}

export interface RoomCreated {
    id: string;
    name: string;
    createdBy: string;
}

export interface RoomJoined {
    roomId: string;
    userId: string;
    username: string;
}

export interface RoomExit {
    roomId: string;
    userId: string;
    username: string;
}

export interface RoomDeleted {
    id: string;
}

export interface Typing {
    userId: string;
    username: string;
}

export type SocketType =
    | {
        type: MessageType.CHAT;
        roomId: string;
        payload: Chat;
    }
    | {
        type: MessageType.SUBSCRIBE;
        roomId: string;
        payload: Subscribe;
    }
    | {
        type: MessageType.UNSUBSCRIBE;
        roomId: string;
    }
    | {
        type: MessageType.ROOM_CREATED;
        roomId: string;
        payload: RoomCreated;
    }
    | {
        type: MessageType.ROOM_JOINED;
        roomId: string;
        payload: RoomJoined;
    }
    | {
        type: MessageType.ROOM_EXIT;
        roomId: string;
        payload: RoomExit;
    }
    | {
        type: MessageType.ROOM_DELETED;
        roomId: string;
        payload: RoomDeleted;
    }
    | {
        type: MessageType.TYPING;
        roomId: string;
        payload: Typing;
    }
    | {
        type: MessageType.STOP_TYPING;
        roomId: string;
        payload: Typing;
    }
    | {
        type: MessageType.USER_PRESENCE;
        roomId?: string;
        payload: UserPresence;
    }
    | {
        type: MessageType.GET_ONLINE_USERS;
        roomId?: string;
        payload?: OnlineUsersList;
    }
    | {
        type: MessageType.MESSAGE_DELIVERED;
        roomId: string;
        payload: { messageIds: string[] };
    }
    | {
        type: MessageType.MESSAGE_READ;
        roomId: string;
        payload: { messageIds: string[]; readBy: string };
    };