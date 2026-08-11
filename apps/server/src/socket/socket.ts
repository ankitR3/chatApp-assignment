import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { MessageType, SocketType } from './socket.types';
import prisma from '@repo/db';
import { publisher, subscriber } from '../redis/redisClient';
import { invalidateCache } from '../redis/redisCache';

class WebSocketClass {
    private io: SocketIOServer;
    private socketIdToUserId = new Map<string, string>();
    private userSocketsCount = new Map<string, number>();

    constructor(server: HTTPServer) {
        const clientUrl = process.env.CLIENT_URL;
        this.io = new SocketIOServer(server, {
            cors: {
                origin: clientUrl ? [clientUrl, 'http://localhost:3000', 'http://localhost:5173'] : '*',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });
        this.init();
        this.initRedis();
    }

    private init() {
        this.io.on('connection', (socket: Socket) => {
            console.log(`Socket connected: ${socket.id}`);

            // Process all incoming socket messages through handleMessage router
            socket.on('message', (data: any) => {
                this.handleMessage(data, socket);
            });

            socket.on('disconnect', (reason) => {
                console.log(`Socket disconnected (${socket.id}): ${reason}`);
                const userId = this.socketIdToUserId.get(socket.id);
                if (userId) {
                    this.socketIdToUserId.delete(socket.id);
                    const currentCount = (this.userSocketsCount.get(userId) || 1) - 1;
                    if (currentCount <= 0) {
                        this.userSocketsCount.delete(userId);
                        this.broadcastGlobal({
                            type: MessageType.USER_PRESENCE,
                            roomId: '',
                            payload: { userId, isOnline: false }
                        } as any);
                    } else {
                        this.userSocketsCount.set(userId, currentCount);
                    }
                }
            });
        });
    }

    private initRedis() {
        try {
            subscriber.subscribe('broadcast_room', 'broadcast_global', (err) => {
                if (err) {
                    console.log('Redis subscribe error: ', err);
                }
            });

            subscriber.on('message', (channel, message) => {
                try {
                    const parsed: SocketType = typeof message === 'string' ? JSON.parse(message) : message;

                    if (channel === 'broadcast_room') {
                        this.broadcastToRoom(parsed);
                    }

                    if (channel === 'broadcast_global') {
                        this.io.emit('message', parsed);
                    }
                } catch (err) {
                    console.log('Redis message parse error: ', err);
                }
            });
        } catch (err) {
            console.log('Redis initialization error: ', err);
        }
    }

    private handleMessage(message: any, socket: Socket) {
        try {
            const socketMessage: SocketType = typeof message === 'string' ? JSON.parse(message) : message;

            switch (socketMessage.type) {
                case MessageType.SUBSCRIBE:
                    return this.handleSubscribe(socketMessage, socket);

                case MessageType.UNSUBSCRIBE:
                    return this.handleUnsubscribe(socketMessage, socket);

                case MessageType.CHAT:
                    return this.handleChat(socketMessage, socket);

                case MessageType.ROOM_CREATED:
                    return this.broadcastGlobal(socketMessage);

                case MessageType.ROOM_JOINED:
                    return this.handleRoomJoined(socketMessage, socket);

                case MessageType.ROOM_EXIT:
                    return this.handleRoomExit(socketMessage, socket);

                case MessageType.ROOM_DELETED:
                    return this.broadcastGlobal(socketMessage);

                case MessageType.TYPING:
                    return this.broadcastToRoom(socketMessage);

                case MessageType.STOP_TYPING:
                    return this.broadcastToRoom(socketMessage);

                case MessageType.GET_ONLINE_USERS:
                    socket.emit('message', {
                        type: MessageType.GET_ONLINE_USERS,
                        payload: { onlineUserIds: Array.from(this.userSocketsCount.keys()) }
                    });
                    return;
            }
        } catch (err) {
            console.log('Failed to handle message:', err);
        }
    }

    private handleSubscribe(
        subscribe: Extract<SocketType, { type: MessageType.SUBSCRIBE }>,
        socket: Socket
    ) {
        try {
            const { roomId, payload } = subscribe;

            if (payload?.userId) {
                const userId = payload.userId;
                this.socketIdToUserId.set(socket.id, userId);
                const count = this.userSocketsCount.get(userId) || 0;
                this.userSocketsCount.set(userId, count + 1);

                if (count === 0) {
                    this.broadcastGlobal({
                        type: MessageType.USER_PRESENCE,
                        roomId: '',
                        payload: { userId, isOnline: true }
                    } as any);
                }
            }

            if (!roomId) {
                console.log('room-id not found');
                return;
            }

            socket.join(roomId);
            console.log(`User ${payload?.userId || socket.id} subscribed to room ${roomId}`);

            const response = {
                type: MessageType.SUBSCRIBE,
                roomId,
                success: true
            };

            socket.emit('message', response);
            socket.emit(MessageType.SUBSCRIBE, response);
        } catch (err) {
            console.log('room-join error: ', err);
        }
    }

    private handleUnsubscribe(
        unsubscribe: Extract<SocketType, { type: MessageType.UNSUBSCRIBE }>,
        socket: Socket
    ) {
        try {
            const { roomId } = unsubscribe;
            if (!roomId) {
                console.log('room-id not found');
                return;
            }

            socket.leave(roomId);
            console.log(`Socket ${socket.id} unsubscribed from room ${roomId}`);

            const response = {
                type: MessageType.UNSUBSCRIBE,
                roomId,
                success: true
            };

            socket.emit('message', response);
            socket.emit(MessageType.UNSUBSCRIBE, response);
        } catch (err) {
            console.log('room disconnection failed: ', err);
        }
    }

    private async handleChat(
        chat: Extract<SocketType, { type: MessageType.CHAT }>,
        socket: Socket
    ) {
        try {
            const { roomId, payload } = chat;

            if (!roomId) {
                console.log('roomId is required for chat message');
                return;
            }

            const sendMessage: SocketType = {
                type: MessageType.CHAT,
                roomId,
                payload: {
                    ...payload,
                    timestamp: payload?.timestamp || new Date().toISOString()
                }
            };

            try {
                await invalidateCache(roomId);
                await publisher.publish('broadcast_room', JSON.stringify(sendMessage));
            } catch (redisErr) {
                this.broadcastToRoom(sendMessage);
            }

            console.log(`Message sent to room ${roomId}`);
        } catch (err) {
            console.log('chat message err: ', err);
        }
    }

    private async handleRoomJoined(
        message: Extract<SocketType, { type: MessageType.ROOM_JOINED }>,
        socket: Socket
    ) {
        try {
            const { roomId, payload } = message;

            if (payload?.userId) {
                await prisma.message.create({
                    data: {
                        roomId,
                        authorId: payload.userId,
                        content: `${payload.username} joined the room`,
                        type: 'SYSTEM',
                    }
                }).catch((e: any) => console.log('Prisma create error:', e));
            }
            socket.join(roomId);
            this.broadcastToRoom(message);
        } catch (err) {
            console.log('handleRoomJoined error:', err);
        }
    }

    private async handleRoomExit(
        message: Extract<SocketType, { type: MessageType.ROOM_EXIT }>,
        socket: Socket
    ) {
        try {
            const { roomId, payload } = message;
            if (payload?.userId) {
                await prisma.message.create({
                    data: {
                        roomId,
                        authorId: payload.userId,
                        content: `${payload.username} left the room`,
                        type: 'SYSTEM'
                    }
                }).catch((e: any) => console.log('Prisma create error:', e));
            }
            this.broadcastToRoom(message);
            socket.leave(roomId);
        } catch (err) {
            console.log('handleRoomExit error: ', err);
        }
    }

    private broadcastGlobal(message: SocketType) {
        try {
            publisher.publish('broadcast_global', JSON.stringify(message)).catch(() => {
                this.io.emit('message', message);
            });
        } catch {
            this.io.emit('message', message);
        }
    }

    private broadcastToRoom(message: SocketType) {
        if (!message.roomId) return;
        this.io.to(message.roomId).emit('message', message);
    }
}

export default WebSocketClass;