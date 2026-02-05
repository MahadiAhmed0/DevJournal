import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !data.session) {
          // Refresh failed, sign out user
          await supabase.auth.signOut();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Retry with new token
        originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        await supabase.auth.signOut();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const entriesApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; isPublic?: boolean }) =>
    api.get('/entries', { params }),
  getMy: (params?: { page?: number; limit?: number }) =>
    api.get('/entries/my', { params }),
  getOne: (id: string) => api.get(`/entries/${id}`),
  create: (data: { title: string; content: string; summary?: string; isPublic?: boolean }) =>
    api.post('/entries', data),
  update: (id: string, data: { title?: string; content?: string; summary?: string; isPublic?: boolean }) =>
    api.patch(`/entries/${id}`, data),
  delete: (id: string) => api.delete(`/entries/${id}`),
  summarize: (id: string) => api.post(`/entries/${id}/summarize`),
  search: (q: string) => api.get('/entries/search', { params: { q } }),
};

export const snippetsApi = {
  getPublic: (params?: { language?: string; user?: string }) =>
    api.get('/snippets', { params }),
  getMy: () => api.get('/snippets/my'),
  getOne: (id: string) => api.get(`/snippets/${id}`),
  create: (data: {
    title: string;
    code: string;
    language: string;
    description?: string;
    isPublic?: boolean;
    entryId?: string;
  }) => api.post('/snippets', data),
  update: (
    id: string,
    data: {
      title?: string;
      code?: string;
      language?: string;
      description?: string;
      isPublic?: boolean;
      entryId?: string | null;
    },
  ) => api.patch(`/snippets/${id}`, data),
  delete: (id: string) => api.delete(`/snippets/${id}`),
};

export const tagsApi = {
  getAll: () => api.get('/tags'),
  getPopular: (limit?: number) => api.get('/tags/popular', { params: { limit } }),
  search: (q: string, limit?: number) => api.get('/tags/search', { params: { q, limit } }),
  getByName: (name: string) => api.get(`/tags/${name}`),
  getEntries: (name: string, params?: { page?: number; limit?: number }) =>
    api.get(`/tags/${name}/entries`, { params }),
  updateEntryTags: (entryId: string, tags: string[]) =>
    api.put(`/entries/${entryId}/tags`, { tags }),
};

export const usersApi = {
  getMe: () => api.get('/users/me'),
  getProfile: (username: string) => api.get(`/users/profile/${username}`),
  updateProfile: (data: {
    name?: string;
    username?: string;
    avatar?: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
  }) => api.patch('/users/me', data),
};

export const authApi = {
  signUp: (data: { email: string; password: string; username: string }) =>
    api.post('/auth/signup', data),
  signIn: (data: { email: string; password: string }) =>
    api.post('/auth/signin', data),
  signOut: (token: string) =>
    api.post('/auth/signout', null, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/auth/profile'),
  getMe: () => api.get('/auth/me'),
};
