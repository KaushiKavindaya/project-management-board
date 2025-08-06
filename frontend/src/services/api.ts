import axios from 'axios';
import { IBoard, ICard, IList, IComment } from '../types';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// --- Authentication ---
export const login = (email: string, password: string) => api.post('/auth/login', { email, password });
export const register = (email: string, password: string) => api.post('/auth/register', { email, password });

// --- Boards ---
export const getBoards = (): Promise<{ data: { id: number, name: string }[] }> => api.get('/boards');
export const getBoard = (boardId: number): Promise<{ data: IBoard }> => api.get(`/boards/${boardId}`);
export const createBoard = (name: string): Promise<{ data: { id: number, name: string } }> => api.post('/boards', { name });
export const inviteUserToBoard = (boardId: number, email: string) => api.post(`/boards/${boardId}/members`, { email });

// --- Lists ---
export const createList = (board_id: number, name: string): Promise<{ data: IList }> => api.post('/lists', { board_id, name });
export const deleteList = (listId: number) => api.delete(`/lists/${listId}`);
export const reorderLists = (boardId: number, orderedListIds: number[]) => api.put('/lists/reorder', { boardId, orderedListIds });

// --- Cards & Comments ---
export const createCard = (list_id: number, content: string): Promise<{ data: ICard }> => api.post('/cards', { list_id, content });
export const deleteCard = (cardId: number) => api.delete(`/cards/${cardId}`);
export const moveCard = (cardId: number, newListId: number, newPosition: number) => api.put('/cards/move', { cardId, newListId, newPosition });
export const getCardDetails = (cardId: number): Promise<{ data: ICard }> => api.get(`/cards/${cardId}/details`);
export const updateCardDetails = (cardId: number, details: { content?: string; description?: string; due_date?: string | null }) => api.put(`/cards/${cardId}/details`, details);
// THIS IS THE CORRECTED LINE:
export const addComment = (card_id: number, text: string): Promise<{ data: IComment }> => api.post('/comments', { card_id, text });