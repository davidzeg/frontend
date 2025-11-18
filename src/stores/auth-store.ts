import { apiClient } from '@/lib/api-client';
import { UserResponse } from 'shared-types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    user: UserResponse | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshAccessToken: () => Promise<void>;
    setUser: (user: UserResponse) => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await apiClient.login({ email, password });
                    if (response.sucess && response.data) {
                        const { user, accessToken, refreshToken } =
                            response.data;
                        apiClient.setAccessToken(accessToken);
                        set({
                            user,
                            accessToken,
                            refreshToken,
                            isAuthenticated: true,
                            isLoading: false,
                        });
                    }
                } catch (error) {
                    set({
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Login failed',
                        isLoading: false,
                    });
                }
            },

            register: async (email: string, password: string, name: string) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await apiClient.register({
                        email,
                        password,
                        name,
                    });
                    if (response.sucess && response.data) {
                        const { user, accessToken, refreshToken } =
                            response.data;
                        apiClient.setAccessToken(accessToken);
                        set({
                            user,
                            accessToken,
                            refreshToken,
                            isAuthenticated: true,
                            isLoading: false,
                        });
                    }
                } catch (error) {
                    set({
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Registration failed',
                        isLoading: false,
                    });
                }
            },

            logout: async () => {
                try {
                    await apiClient.logout();
                } finally {
                    apiClient.setAccessToken(null);
                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                    });
                }
            },

            refreshAccessToken: async () => {
                const { refreshToken } = get();
                if (!refreshToken) return;

                try {
                    const response = await apiClient.refreshToken(refreshToken);
                    if (response.sucess && response.data) {
                        const {
                            accessToken: newAccessToken,
                            refreshToken: newRefreshToken,
                        } = response.data;
                        apiClient.setAccessToken(newAccessToken);
                        set({
                            accessToken: newAccessToken,
                            refreshToken: newRefreshToken,
                        });
                    }
                } catch (error) {
                    get().logout();
                }
            },

            setUser: (user: UserResponse) => {
                set({ user });
            },

            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
