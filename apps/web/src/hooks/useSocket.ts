import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageType } from '../types/socket.types';

const rawUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3030';
const SOCKET_URL = rawUrl.replace(/^ws:\/\//, 'http://').replace(/^wss:\/\//, 'https://');

export class SocketManager {
    private static instance: Socket | null = null;

    static connect(): Socket {
        if (!this.instance || !this.instance.connected) {
            if (!this.instance) {
                console.log('creating new socket connection');
                this.instance = io(SOCKET_URL, {
                    autoConnect: true,
                    transports: ['websocket', 'polling'],
                });
            } else {
                this.instance.connect();
            }
        }
        return this.instance;
    }

    static disconnect() {
        if (this.instance) {
            this.instance.disconnect();
            this.instance = null;
        }
    }
}

export function disconnectSocket() {
    SocketManager.disconnect();
}

interface UseSocketProps {
    roomId: string;
    userId: string;
    username: string;
    onMessage: (message: any) => void;
}

export function useSocket({ roomId, userId, username, onMessage}: UseSocketProps) {
    const socketRef = useRef<Socket | null>(null);
    const onMessageRef = useRef(onMessage);

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    const sendMessage = useCallback((message: string) => {
        const socket = socketRef.current;
        if (!socket || !socket.connected) return;

        const payload = {
            type: MessageType.CHAT,
            roomId,
            payload: {
                message,
                senderId: userId,
                senderName: username,
                timestamp: new Date().toISOString(),
            }
        };

        socket.emit('message', payload);
    }, [roomId, userId, username]);

    const sendTyping = useCallback((isTyping: boolean) => {
        const socket = socketRef.current;
        if (!socket || !socket.connected) return;

        const type = isTyping ? MessageType.TYPING : MessageType.STOP_TYPING;
        const payload = {
            type,
            roomId,
            payload: {
                userId,
                username,
            }
        };

        socket.emit('message', payload);
    }, [roomId, userId, username]);

    useEffect(() => {
        const socket = SocketManager.connect();
        socketRef.current = socket;

        const subscribeToRoom = () => {
            const payload = {
                type: MessageType.SUBSCRIBE,
                roomId,
                payload: {
                    userId,
                    username
                }
            };
            socket.emit('message', payload);
        };

        const handleIncomingMessage = (data: any) => {
            try {
                const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                onMessageRef.current(parsed);
            } catch (err) {
                console.log('Failed to parse message: ', err);
            }
        };

        socket.on('message', handleIncomingMessage);

        if (socket.connected) {
            subscribeToRoom();
        } else {
            socket.once('connect', subscribeToRoom);
        }

        return () => {
            socket.off('message', handleIncomingMessage);

            if (socket.connected) {
                const unsubscribePayload = {
                    type: MessageType.UNSUBSCRIBE,
                    roomId
                };
                socket.emit('message', unsubscribePayload);
            }
        };
    }, [roomId, userId, username]);

    return { sendMessage, sendTyping };
}