'use-client';

import { apiClient } from '@/lib/api-client';
import { CreateTaskRequest, Task, UpdateTaskRequest } from 'shared-types';
import { create } from 'zustand';

interface TaskState {
    tasks: Task[];
    currentTask: Task | null;
    isLoading: boolean;
    error: string | null;

    // Optimistic updates tracking
    pendingUpdates: Map<string, UpdateTaskRequest>;

    fetchTasks: (projectId?: string) => Promise<void>;
    fetchTask: (id: string) => Promise<void>;
    createTask: (data: CreateTaskRequest) => Promise<void>;
    updateTask: (id: string, data: UpdateTaskRequest) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    updateTaskOptimistic: (id: string, updates: Partial<Task>) => void;
    revertOptimisticUpdate: (id: string) => void;
    setCurrentTask: (task: Task | null) => void;
    addTask: (task: Task) => void;
    removeTask: (id: string) => void;
    clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    currentTask: null,
    isLoading: false,
    error: null,
    pendingUpdates: new Map(),

    fetchTasks: async (projectId?: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.getTasks(projectId);
            if (response.sucess && response.data) {
                set({ tasks: response.data.data, isLoading: false });
            }
        } catch (error) {
            set({
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to fetch tasks',
                isLoading: false,
            });
        }
    },

    fetchTask: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.getTask(id);
            if (response.sucess && response.data) {
                set({ currentTask: response.data, isLoading: false });
            }
        } catch (error) {
            set({
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to fetch task',
                isLoading: false,
            });
        }
    },

    createTask: async (data: CreateTaskRequest) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.createTask(data);
            if (response.sucess && response.data) {
                set((state) => ({
                    tasks: [response.data!, ...state.tasks],
                    isLoading: false,
                }));
            }
        } catch (error) {
            set({
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to create task',
                isLoading: false,
            });
        }
    },

    updateTask: async (id: string, data: UpdateTaskRequest) => {
        try {
            const response = await apiClient.updateTask(id, data);
            if (response.sucess && response.data) {
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id ? response.data! : task
                    ),
                    currentTask:
                        state.currentTask?.id === id
                            ? response.data!
                            : state.currentTask,
                }));

                const pendingUpdates = new Map(get().pendingUpdates);
                pendingUpdates.delete(id);
                set({ pendingUpdates });
            }
        } catch (error) {
            get().revertOptimisticUpdate(id);
            set({
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to update task',
            });
        }
    },

    deleteTask: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.deleteTask(id);
            set((state) => ({
                tasks: state.tasks.filter((task) => task.id !== id),
                currentTask:
                    state.currentTask?.id === id ? null : state.currentTask,
                isLoading: false,
            }));
        } catch (error) {
            set({
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to delete task',
                isLoading: false,
            });
        }
    },

    updateTaskOptimistic: (id: string, updates: Partial<Task>) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const pendingUpdates = new Map(get().pendingUpdates);
        if (!pendingUpdates.has(id)) {
            pendingUpdates.set(id, {
                version: task.version,
                ...updates,
            } as UpdateTaskRequest);
        }

        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, ...updates } : t
            ),
            currentTask:
                state.currentTask?.id === id
                    ? { ...state.currentTask, ...updates }
                    : state.currentTask,
            pendingUpdates,
        }));
    },

    revertOptimisticUpdate: (id: string) => {
        const pendingUpdate = get().pendingUpdates.get(id);
        if (!pendingUpdate) return;

        get().fetchTask(id);

        const pendingUpdates = new Map(get().pendingUpdates);
        pendingUpdates.delete(id);
        set({ pendingUpdates });
    },

    setCurrentTask: (task: Task | null) => {
        set({ currentTask: task });
    },

    addTask: (task: Task) => {
        set((state) => ({
            tasks: [task, ...state.tasks],
        }));
    },

    removeTask: (id: string) => {
        set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
        }));
    },

    clearError: () => {
        set({ error: null });
    },
}));
