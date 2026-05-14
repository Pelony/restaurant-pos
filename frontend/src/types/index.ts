export interface AuthResponse {
  token: string
  userId: string
  email: string
  name: string
  role: string
  tenantId: string
  tenantName: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  tenantName: string
}

export interface Category {
  id: string
  name: string
  description?: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  available: boolean
  categoryId?: string
  categoryName?: string
}

export interface TableEntity {
  id: string
  number: string
  capacity: number
  status: 'free' | 'occupied' | 'reserved'
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
  notes?: string
}

export interface Order {
  id: string
  tableId?: string
  tableNumber?: string
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  total: number
  notes?: string
  createdAt: string
  completedAt?: string
  userId: string
  userName: string
  items: OrderItem[]
}