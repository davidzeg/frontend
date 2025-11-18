'use-client';

import { useAuthStore } from '@/stores/auth-store';
import { useTaskStore } from '@/stores/task-store';
import { useCallback, useEffect, useRef } from 'react';
import { Task, WSEvent } from 'shared-types';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export function useWebSocket() {
    const socketRef = useRef<Socket | null>(null);
    const { accessToken } = useAuthStore();
    const { addTask, removeTask, updateTaskOptimistic } = useTaskStore();

    const handleEvent = useCallback(
        (event: WSEvent) => {
            console.log('WebSocket event received:', event);

            switch (event.type) {
                case 'task-created':
                    if ('task' in event.payload) {
                        addTask(event.payload.task);
                    }
                    break;
                case 'task-updated':
                    if ('task' in event.payload) {
                        const task = event.payload.task as Task;
                        updateTaskOptimistic(task.id, task);
                    }
                    break;
                case 'task-deleted':
                    if ('taskId' in event.payload) {
                        removeTask(event.payload.taskId);
                    }
                    break;
                case 'user-joined':
                    console.log(`User ${event.payload} has joined.`);
                    break;
                case 'user-left':
                    console.log(`User ${event.payload} has left.`);
                    break;
                case 'presence-updated':
                    console.log('Presence update:', event.payload);
                    break;
                case 'typing.started':
                    console.log(`User ${event.payload} started typing.`);
                    break;
                case 'typing.stopped':
                    console.log(`User ${event.payload} stopped typing.`);
                    break;
            }
        },
        [addTask, removeTask, updateTaskOptimistic]
    );

    useEffect(() => {
        if (!accessToken) return;

        const socket = io(WS_URL, {
            auth: {
                token: accessToken,
            },
            transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('WebSocket connected');
        });

        socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        socket.on('event', handleEvent);

        return () => {
            socket.off('event', handleEvent);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [accessToken, handleEvent]);

    const joinTask = useCallback((taskId: string) => {
        socketRef.current?.emit('join-task', { taskId });
    }, []);

    const leaveTask = useCallback((taskId: string) => {
        socketRef.current?.emit('leave-task', { taskId });
    }, []);

    const startTyping = useCallback((taskId: string) => {
        socketRef.current?.emit('typing-started', { taskId });
    }, []);

    const stopTyping = useCallback((taskId: string) => {
        socketRef.current?.emit('typing-stopped', { taskId });
    }, []);

    return {
        getSocket: () => socketRef.current,
        joinTask,
        leaveTask,
        startTyping,
        stopTyping,
    };
}
