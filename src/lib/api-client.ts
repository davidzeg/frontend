import {
    ApiResponse,
    AuthResponse,
    CreateTaskRequest,
    LoginRequest,
    PaginatedResponse,
    RegisterRequest,
    Task,
    UpdateTaskRequest,
    UserResponse,
} from 'shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
    private accessToken: string | null = null;

    setAccessToken(token: string | null) {
        this.accessToken = token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'API request failed');
        }

        return response.json();
    }

    async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
        return this.request<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
        return this.request<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async refreshToken(
        refreshToken: string
    ): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
        return this.request('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        });
    }

    async logout(): Promise<ApiResponse<null>> {
        return this.request('/auth/logout', {
            method: 'POST',
        });
    }

    async getProfile(): Promise<ApiResponse<UserResponse>> {
        return this.request<UserResponse>('/auth/me');
    }

    async getTasks(
        projectId?: string,
        page = 1,
        pageSize = 20
    ): Promise<ApiResponse<PaginatedResponse<Task>>> {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
        });

        if (projectId) {
            params.append('projectId', projectId);
        }

        return this.request<PaginatedResponse<Task>>(`/tasks?${params}`);
    }

    async getTask(id: string): Promise<ApiResponse<Task>> {
        return this.request<Task>(`/tasks/${id}`);
    }

    async createTask(data: CreateTaskRequest): Promise<ApiResponse<Task>> {
        return this.request<Task>('/tasks', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateTask(
        id: string,
        data: UpdateTaskRequest
    ): Promise<ApiResponse<Task>> {
        return this.request<Task>(`/tasks/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteTask(id: string): Promise<ApiResponse<null>> {
        return this.request<null>(`/tasks/${id}`, {
            method: 'DELETE',
        });
    }

    async getTasksByAsignee(asigneeId: string): Promise<ApiResponse<Task[]>> {
        return this.request<Task[]>(`/tasks/asignee/${asigneeId}`);
    }
}

export const apiClient = new ApiClient();
