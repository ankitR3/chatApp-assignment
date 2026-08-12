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

                case MessageType.MESSAGE_READ:
                    return this.handleMessageRead(socketMessage, socket);
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

                    // Auto-deliver all SENT messages in user's rooms when they come online
                    this.deliverPendingMessages(userId).catch((err) =>
                        console.log('deliverPendingMessages error:', err)
                    );
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

            // Check if any other user in the room is online
            const roomMembers = await prisma.roomMember.findMany({
                where: { roomId },
                select: { userId: true }
            }).catch(() => []);

            const otherOnlineMembers = roomMembers.filter(
                (m) => m.userId !== payload.senderId && this.userSocketsCount.has(m.userId)
            );

            // Determine initial status: DELIVERED if any recipient is online, else SENT
            const initialStatus = otherOnlineMembers.length > 0 ? 'DELIVERED' : 'SENT';

            const sendMessage: SocketType = {
                type: MessageType.CHAT,
                roomId,
                payload: {
                    ...payload,
                    timestamp: payload?.timestamp || new Date().toISOString(),
                    status: initialStatus,
                }
            };

            try {
                await invalidateCache(roomId);
                publisher.publish('broadcast_room', JSON.stringify(sendMessage)).catch(() => {});
            } catch (redisErr) {
                console.log('redis cache/pub error:', redisErr);
            }

            this.broadcastToRoom(sendMessage);

            console.log(`Message sent to room ${roomId} with status ${initialStatus}`);
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
                await invalidateCache(roomId).catch(() => {});
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
                await invalidateCache(roomId).catch(() => {});
            }
            this.broadcastToRoom(message);
            socket.leave(roomId);
        } catch (err) {
            console.log('handleRoomExit error: ', err);
        }
    }

    private async deliverPendingMessages(userId: string) {
        try {
            // Find all rooms the user is a member of
            const memberships = await prisma.roomMember.findMany({
                where: { userId },
                select: { roomId: true }
            });

            const roomIds = memberships.map((m) => m.roomId);
            if (roomIds.length === 0) return;

            // Find all SENT messages in those rooms that were NOT sent by this user
            const pendingMessages = await prisma.message.findMany({
                where: {
                    roomId: { in: roomIds },
                    status: 'SENT',
                    authorId: { not: userId },
                },
                select: { id: true, roomId: true }
            });

            if (pendingMessages.length === 0) return;

            const messageIds = pendingMessages.map((m) => m.id);

            // Bulk update to DELIVERED
            await prisma.message.updateMany({
                where: { id: { in: messageIds } },
                data: { status: 'DELIVERED' }
            });

            // Group by roomId and broadcast delivery notifications
            const byRoom = new Map<string, string[]>();
            for (const msg of pendingMessages) {
                const ids = byRoom.get(msg.roomId) || [];
                ids.push(msg.id);
                byRoom.set(msg.roomId, ids);
            }

            for (const [roomId, ids] of byRoom) {
                this.broadcastToRoom({
                    type: MessageType.MESSAGE_DELIVERED,
                    roomId,
                    payload: { messageIds: ids }
                });
            }

            console.log(`Delivered ${messageIds.length} pending messages for user ${userId}`);
        } catch (err) {
            console.log('deliverPendingMessages error:', err);
        }
    }

    private async handleMessageRead(
        message: Extract<SocketType, { type: MessageType.MESSAGE_READ }>,
        socket: Socket
    ) {
        try {
            const { roomId, payload } = message;
            const { messageIds, readBy } = payload;

            if (!roomId || !messageIds || messageIds.length === 0) return;

            // Update messages to READ in DB (only if not already READ)
            await prisma.message.updateMany({
                where: {
                    id: { in: messageIds },
                    status: { not: 'READ' },
                    authorId: { not: readBy },
                },
                data: { status: 'READ' }
            });

            // Broadcast to the room so sender sees blue ticks
            this.broadcastToRoom({
                type: MessageType.MESSAGE_READ,
                roomId,
                payload: { messageIds, readBy }
            });

            console.log(`${readBy} read ${messageIds.length} messages in room ${roomId}`);
        } catch (err) {
            console.log('handleMessageRead error:', err);
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