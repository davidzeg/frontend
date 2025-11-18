'use client';

import { useTaskStore } from '@/stores/task-store';
import { Task, TaskPriority, TaskStatus } from 'shared-types';

interface TaskCardProps {
    task: Task;
}

const priorityColors: Record<TaskPriority, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
};

const statusLabels: Record<TaskStatus, string> = {
    todo: 'To Do',
    'in-progress': 'In Progress',
    review: 'In Review',
    done: 'Done',
};

export function TaskCard({ task }: TaskCardProps) {
    const { updateTask, deleteTask } = useTaskStore();

    const handleStatusChange = async (newStatus: TaskStatus) => {
        await updateTask(task.id, {
            status: newStatus,
            version: task.version,
        });
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this task?')) {
            await deleteTask(task.id);
        }
    };

    return <p>test</p>;
}
