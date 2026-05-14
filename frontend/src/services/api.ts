import axios from 'axios'
import type { AuthResponse, LoginRequest, RegisterRequest, Category, Product, TableEntity, Order } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
}

export const categoriesApi = {
  getAll: () => api.get<Category[]>('/categories'),
  create: (data: Partial<Category>) => api.post<Category>('/categories', data),
  update: (id: string, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
}

export const productsApi = {
  getAll: () => api.get<Product[]>('/products'),
  create: (data: Partial<Product>) => api.post<Product>('/products', data),
  update: (id: string, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
}

export const tablesApi = {
  getAll: () => api.get<TableEntity[]>('/tables'),
  create: (data: Partial<TableEntity>) => api.post<TableEntity>('/tables', data),
  update: (id: string, data: Partial<TableEntity>) => api.put<TableEntity>(`/tables/${id}`, data),
  delete: (id: string) => api.delete(`/tables/${id}`),
}

export const ordersApi = {
  getAll: () => api.get<Order[]>('/orders'),
  getById: (id: string) => api.get<Order>(`/orders/${id}`),
  create: (data: Partial<Order>) => api.post<Order>('/orders', data),
  updateStatus: (id: string, status: string) => api.put<Order>(`/orders/${id}/status`, { status }),
}

export default api