import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { productsApi, categoriesApi, tablesApi, ordersApi } from '@/services/api'
import type { Product, Category, TableEntity, Order, OrderItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CartItem extends OrderItem {
  productId: string
}

export default function Dashboard() {
  const { auth, logout } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tables, setTables] = useState<TableEntity[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTable, setSelectedTable] = useState<TableEntity | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [view, setView] = useState<'pos' | 'orders' | 'products' | 'tables'>('pos')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, tablesRes, ordersRes] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
        tablesApi.getAll(),
        ordersApi.getAll(),
      ])
      setProducts(productsRes.data)
      setCategories(categoriesRes.data)
      setTables(tablesRes.data)
      setOrders(ordersRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.productId === product.id)
    if (existing) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        )
      )
    } else {
      setCart([
        ...cart,
        {
          id: crypto.randomUUID(),
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
        },
      ])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedTable(null)
  }

  const createOrder = async () => {
    if (!selectedTable || cart.length === 0) return
    try {
      await ordersApi.create({
        tableId: selectedTable.id,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes,
        })),
      })
      loadData()
      clearCart()
      setView('orders')
    } catch (error) {
      console.error('Error creating order:', error)
    }
  }

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.subtotal, 0)

  const filteredProducts =
    selectedCategory === 'all'
      ? products.filter((p) => p.available)
      : products.filter((p) => p.categoryId === selectedCategory && p.available)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{auth?.tenantName}</h1>
            <p className="text-sm text-gray-500">Bienvenido, {auth?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant={view === 'pos' ? 'default' : 'outline'} onClick={() => setView('pos')}>
              POS
            </Button>
            <Button variant={view === 'orders' ? 'default' : 'outline'} onClick={() => setView('orders')}>
              Pedidos
            </Button>
            <Button variant={view === 'products' ? 'default' : 'outline'} onClick={() => setView('products')}>
              Productos
            </Button>
            <Button variant={view === 'tables' ? 'default' : 'outline'} onClick={() => setView('tables')}>
              Mesas
            </Button>
            <Button variant="destructive" onClick={logout}>
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4">
        {view === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <Button
                      variant={selectedCategory === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory('all')}
                    >
                      Todos
                    </Button>
                    {categories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={selectedCategory === cat.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        {cat.name}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredProducts.map((product) => (
                      <Button
                        key={product.id}
                        variant="outline"
                        className="h-20 flex flex-col items-center justify-center gap-1"
                        onClick={() => addToCart(product)}
                      >
                        <span className="font-medium truncate w-full text-center">{product.name}</span>
                        <span className="text-sm text-gray-500">${product.price}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mesa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {tables.map((table) => (
                      <Button
                        key={table.id}
                        variant={selectedTable?.id === table.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTable(table)}
                        className={table.status === 'occupied' ? 'bg-red-500' : ''}
                      >
                        {table.number}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pedido Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Sin productos</p>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-gray-500">
                              {item.quantity} x ${item.unitPrice}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">${item.subtotal}</span>
                            <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.productId)}>
                              X
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">Total:</span>
                          <span className="text-xl font-bold">${getCartTotal()}</span>
                        </div>
                      </div>
                      <Button className="w-full mt-2" onClick={createOrder} disabled={!selectedTable}>
                        Crear Pedido
                      </Button>
                      <Button variant="outline" className="w-full mt-1" onClick={clearCart}>
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {view === 'orders' && (
          <Card>
            <CardHeader>
              <CardTitle>Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold">Mesa: {order.tableNumber || 'Sin mesa'}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleString()} - {order.userName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.status}
                        </span>
                        <p className="font-bold mt-1">${order.total}</p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      {order.items.map((item) => (
                        <span key={item.id} className="mr-3">
                          {item.quantity}x {item.productName}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      {order.status === 'pending' && (
                        <Button size="sm" onClick={() => ordersApi.updateStatus(order.id, 'preparing')}>
                          Preparar
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button size="sm" onClick={() => ordersApi.updateStatus(order.id, 'ready')}>
                          Listo
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button size="sm" onClick={() => ordersApi.updateStatus(order.id, 'completed')}>
                          Completar
                        </Button>
                      )}
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => ordersApi.updateStatus(order.id, 'cancelled')}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {view === 'products' && (
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-3">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.categoryName}</p>
                    <p className="font-bold">${product.price}</p>
                    <span className={`text-xs ${product.available ? 'text-green-600' : 'text-red-600'}`}>
                      {product.available ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {view === 'tables' && (
          <Card>
            <CardHeader>
              <CardTitle>Mesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className={`border rounded-lg p-4 text-center ${
                      table.status === 'occupied' ? 'bg-red-50' : 'bg-green-50'
                    }`}
                  >
                    <p className="font-bold text-lg">{table.number}</p>
                    <p className="text-sm">{table.capacity} personas</p>
                    <span className={`text-xs ${table.status === 'occupied' ? 'text-red-600' : 'text-green-600'}`}>
                      {table.status === 'occupied' ? 'Ocupada' : 'Libre'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}