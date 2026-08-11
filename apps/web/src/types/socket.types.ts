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
    GET_ONLINE_USERS = 'GET_ONLINE_USERS'
}

export interface Chat {
    message: string;
    timestamp: string;
    senderId: string;
    senderName: string;
}

export interface Subscribe {
    userId: string;
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
        payload: { userId: string; isOnline: boolean };
    }
    | {
        type: MessageType.GET_ONLINE_USERS;
        roomId?: string;
        payload?: { onlineUserIds: string[] };
    };