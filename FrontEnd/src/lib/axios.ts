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
  getAll: () => api.get('/entries'),
  getOne: (id: string) => api.get(`/entries/${id}`),
  create: (data: { title: string; content: string; isPublic?: boolean; tags?: string[] }) =>
    api.post('/entries', data),
  update: (id: string, data: { title?: string; content?: string; isPublic?: boolean; tags?: string[] }) =>
    api.patch(`/entries/${id}`, data),
  delete: (id: string) => api.delete(`/entries/${id}`),
  summarize: (id: string) => api.post(`/entries/${id}/summarize`),
};

export const snippetsApi = {
  getAll: () => api.get('/snippets'),
  getOne: (id: string) => api.get(`/snippets/${id}`),
  create: (data: { title: string; code: string; language: string; description?: string; tags?: string[] }) =>
    api.post('/snippets', data),
  update: (id: string, data: { title?: string; code?: string; language?: string; description?: string; tags?: string[] }) =>
    api.patch(`/snippets/${id}`, data),
  delete: (id: string) => api.delete(`/snippets/${id}`),
};

export const tagsApi = {
  getAll: () => api.get('/tags'),
  getOne: (id: string) => api.get(`/tags/${id}`),
  create: (data: { name: string }) => api.post('/tags', data),
  update: (id: string, data: { name: string }) => api.patch(`/tags/${id}`, data),
  delete: (id: string) => api.delete(`/tags/${id}`),
};

export const usersApi = {
  getMe: () => api.get('/users/me'),
  getProfile: (username: string) => api.get(`/users/profile/${username}`),
  updateProfile: (data: { username?: string; bio?: string; avatarUrl?: string }) =>
    api.patch('/users/me', data),
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
