import { useAuthStore } from '@/stores/authStore';

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL is not defined in environment variables');
}

const instance = axios.create({
  baseURL: API_URL,
});

instance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response) => {
    if (response.data.token) {
      useAuthStore.getState().setToken(response.data.token);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const api = {
  user: {
    register: async (data: {
      name: string;
      email: string;
      password: string;
    }) => {
      const response = await instance.post(`/user/register`, data);

      return response.data;
    },
    login: async (data: { email: string; password: string }) => {
      const response = await instance.post(`/user/login`, data);

      return response.data;
    },
    logout: () => {
      useAuthStore.getState().clearToken();
    },
  },
  me: {
    get: async () => {
      const response = await instance.get('/me');
      return response.data;
    },
    update: async (data: {
      name?: string;
      email?: string;
      password?: string;
    }) => {
      const response = await instance.patch('/me', data);
      return response.data;
    },
  },
  chat: {
    create: async (data: { aiId: number }) => {
      const response = await instance.post('/chat', data);
      return response.data;
    },
    getAll: async () => {
      const response = await instance.get('/chat');
      return response.data;
    },
    message: {
      getAll: async () => {
        const response = await instance.get(`/chat/message`);
        return response.data;
      },
      getByChatId: async (chatId: number) => {
        const response = await instance.get(`/chat/${chatId}/message`);
        return response.data;
      },
      send: async (data: { chatId: number; content: string }) => {
        const response = await instance.post(`/chat/${data.chatId}/message`, {
          content: data.content,
        });
        return response.data;
      },
    },
  },
  bot: {
    getAll: async () => {
      const response = await instance.get('/bot');
      return response.data;
    },
  },
};
