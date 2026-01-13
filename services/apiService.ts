/**
 * API Service
 * Frontend service layer for communicating with the backend API
 * Falls back to localStorage for offline resilience
 */

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

// Token management
const getToken = (): string | null => localStorage.getItem('efooty_token');
const setToken = (token: string) => localStorage.setItem('efooty_token', token);
const removeToken = () => localStorage.removeItem('efooty_token');

// API fetch wrapper
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

// Check if backend is available
async function isBackendAvailable(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
        });
        return response.ok;
    } catch {
        return false;
    }
}

// API Service
export const apiService = {
    // Auth
    async login(email: string, password: string) {
        const result = await apiFetch<{ token: string; user: any }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        setToken(result.token);
        localStorage.setItem('efooty_user', JSON.stringify(result.user));
        return result.user;
    },

    async signup(email: string, username: string, efootballName: string, password: string) {
        await apiFetch('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, username, efootballName, password })
        });
    },

    async adminLogin(password: string) {
        const result = await apiFetch<{ token: string; user: any }>('/auth/admin-login', {
            method: 'POST',
            body: JSON.stringify({ password })
        });
        setToken(result.token);
        return result.user;
    },

    async getCurrentUser() {
        return apiFetch<any>('/auth/me');
    },

    logout() {
        removeToken();
        localStorage.removeItem('efooty_user');
    },

    // Users (Admin)
    async getUsers() {
        return apiFetch<any[]>('/users');
    },

    async updateUser(id: string, action: string) {
        return apiFetch<any>(`/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ action })
        });
    },

    // Posts
    async getPosts(status?: string) {
        const query = status ? `?status=${status}` : '';
        return apiFetch<any[]>(`/posts${query}`);
    },

    async createPost(post: any) {
        return apiFetch<any>('/posts', {
            method: 'POST',
            body: JSON.stringify(post)
        });
    },

    async updatePost(id: string, status: string) {
        return apiFetch<any>(`/posts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    },

    async deletePost(id: string) {
        return apiFetch<any>(`/posts/${id}`, {
            method: 'DELETE'
        });
    },

    // Players
    async getPlayers() {
        return apiFetch<any[]>('/players');
    },

    async updatePlayer(id: string, updates: any) {
        return apiFetch<any>(`/players/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    },

    // Tactics
    async getTactics() {
        return apiFetch<any[]>('/tactics');
    },

    async addTactic(tactic: any) {
        return apiFetch<any>('/tactics', {
            method: 'POST',
            body: JSON.stringify(tactic)
        });
    },

    // Squads
    async getSquads() {
        return apiFetch<any[]>('/squads');
    },

    async updateSquad(id: string, updates: any) {
        return apiFetch<any>(`/squads/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },

    // Alerts
    async getGlobalAlert() {
        return apiFetch<any | null>('/alerts');
    },

    async setGlobalAlert(alert: any) {
        return apiFetch<any>('/alerts', {
            method: 'POST',
            body: JSON.stringify(alert)
        });
    },

    // Notifications
    async getNotifications() {
        return apiFetch<any[]>('/notifications');
    },

    async addNotification(notification: any) {
        return apiFetch<any>('/notifications', {
            method: 'POST',
            body: JSON.stringify(notification)
        });
    },

    // Sync (Admin)
    async syncPlayers(players: any[]) {
        return apiFetch<{ success: boolean; count: number; players: any[] }>('/sync/players', {
            method: 'POST',
            body: JSON.stringify({ players })
        });
    },

    async syncCreatorContent(posts: any[]) {
        return apiFetch<{ success: boolean; count: number }>('/sync/creators', {
            method: 'POST',
            body: JSON.stringify({ posts })
        });
    },

    async getSyncStatus() {
        return apiFetch<any>('/sync/status');
    },

    async syncTactics(tactics: any[]) {
        return apiFetch<{ success: boolean; count: number; tactics: any[] }>('/sync/tactics', {
            method: 'POST',
            body: JSON.stringify({ tactics })
        });
    },

    // Community
    async getLeaderboard() {
        return apiFetch<any[]>('/community/leaderboard');
    },

    async getUserProfile(username: string) {
        return apiFetch<any>(`/community/profile/${username}`);
    },

    async updateProfile(updates: { bio?: string; efootballName?: string }) {
        return apiFetch<any>('/community/profile', {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    },

    async likePost(postId: string) {
        return apiFetch<any>(`/community/like/${postId}`, { method: 'POST' });
    },

    async unlikePost(postId: string) {
        return apiFetch<any>(`/community/unlike/${postId}`, { method: 'POST' });
    },

    async recordPostView(postId: string) {
        return apiFetch<void>(`/community/view/${postId}`, { method: 'POST' });
    },

    // Utility
    isBackendAvailable,
    getToken,
    setToken,
    removeToken
};

export default apiService;
