import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { productsApi, categoriesApi, tablesApi, ordersApi } from '@/services/api'
import type { Product, Category, TableEntity, Order } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Moon, Sun, Plus, Trash2, Edit, DollarSign, ShoppingCart, Users, Utensils } from 'lucide-react'

interface CartItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
  notes?: string
}

interface Stats {
  todaySales: number
  todayOrders: number
  activeTables: number
  totalProducts: number
}

export default function Dashboard() {
  const { auth, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tables, setTables] = useState<TableEntity[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({ todaySales: 0, todayOrders: 0, activeTables: 0, totalProducts: 0 })

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTable, setSelectedTable] = useState<TableEntity | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [view, setView] = useState<'pos' | 'orders' | 'products' | 'categories' | 'tables' | 'reports'>('pos')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'product' | 'category' | 'table'>('product')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, tablesRes, ordersRes] = await Promise.all([
        productsApi.getAll(), categoriesApi.getAll(), tablesApi.getAll(), ordersApi.getAll()
      ])
      setProducts(productsRes.data)
      setCategories(categoriesRes.data)
      setTables(tablesRes.data)
      setOrders(ordersRes.data)
      calculateStats(ordersRes.data, tablesRes.data, productsRes.data)
    } catch (error) { console.error('Error loading data:', error) }
  }

  const calculateStats = (orders: Order[], tables: TableEntity[], products: Product[]) => {
    const today = new Date().toDateString()
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today)
    const todaySales = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    const activeTables = tables.filter(t => t.status === 'occupied').length

    setStats({
      todaySales,
      todayOrders: todayOrders.length,
      activeTables,
      totalProducts: products.length
    })
  }

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.productId === product.id)
    if (existing) {
      setCart(cart.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
          : item
      ))
    } else {
      setCart([...cart, {
        id: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        subtotal: product.price
      }])
    }
  }

  const removeFromCart = (productId: string) => setCart(cart.filter((item) => item.productId !== productId))
  const clearCart = () => { setCart([]); setSelectedTable(null) }
  const getCartTotal = () => cart.reduce((sum, item) => sum + item.subtotal, 0)

  const createOrder = async () => {
    if (!selectedTable || cart.length === 0) return
    try {
      await ordersApi.create({
        tableId: selectedTable.id,
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity, notes: item.notes }))
      })
      loadData()
      clearCart()
      setView('orders')
    } catch (error) { console.error('Error creating order:', error) }
  }

  const openDialog = (type: 'product' | 'category' | 'table', item?: any) => {
    setDialogType(type)
    setEditingItem(item)
    setFormData(item || (type === 'product' ? { name: '', description: '', price: 0, categoryId: '', available: true } :
               type === 'category' ? { name: '', description: '' } :
               { number: '', capacity: 4 }))
    setDialogOpen(true)
  }

  const saveItem = async () => {
    try {
      if (dialogType === 'product') {
        if (editingItem) await productsApi.update(editingItem.id, formData)
        else await productsApi.create(formData)
      } else if (dialogType === 'category') {
        if (editingItem) await categoriesApi.update(editingItem.id, formData)
        else await categoriesApi.create(formData)
      } else {
        if (editingItem) await tablesApi.update(editingItem.id, formData)
        else await tablesApi.create(formData)
      }
      setDialogOpen(false)
      loadData()
    } catch (error) { console.error('Error saving:', error) }
  }

  const deleteItem = async (type: string, id: string) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return
    try {
      if (type === 'product') await productsApi.delete(id)
      else if (type === 'category') await categoriesApi.delete(id)
      else await tablesApi.delete(id)
      loadData()
    } catch (error) { console.error('Error deleting:', error) }
  }

  const filteredProducts = selectedCategory === 'all'
    ? products.filter((p) => p.available)
    : products.filter((p) => p.categoryId === selectedCategory && p.available)

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{auth?.tenantName}</h1>
            <p className="text-sm text-muted-foreground">Bienvenido, {auth?.name}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant={view === 'pos' ? 'default' : 'outline'} onClick={() => setView('pos')}>POS</Button>
            <Button variant={view === 'orders' ? 'default' : 'outline'} onClick={() => setView('orders')}>Pedidos</Button>
            <Button variant={view === 'products' ? 'default' : 'outline'} onClick={() => setView('products')}>Productos</Button>
            <Button variant={view === 'categories' ? 'default' : 'outline'} onClick={() => setView('categories')}>Categorías</Button>
            <Button variant={view === 'tables' ? 'default' : 'outline'} onClick={() => setView('tables')}>Mesas</Button>
            <Button variant={view === 'reports' ? 'default' : 'outline'} onClick={() => setView('reports')}>Reportes</Button>
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="destructive" onClick={logout}>Salir</Button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {view === 'pos' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-4 w-4" />{stats.todaySales.toFixed(2)}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pedidos Hoy</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="h-4 w-4" />{stats.todayOrders}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Mesas Ocupadas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-2"><Users className="h-4 w-4" />{stats.activeTables}/{tables.length}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Productos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold flex items-center gap-2"><Utensils className="h-4 w-4" />{stats.totalProducts}</div></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      <Button variant={selectedCategory === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory('all')}>Todos</Button>
                      {categories.map((cat) => (
                        <Button key={cat.id} variant={selectedCategory === cat.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat.id)}>{cat.name}</Button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {filteredProducts.map((product) => (
                        <Button key={product.id} variant="outline" className="h-20 flex flex-col items-center justify-center gap-1" onClick={() => addToCart(product)}>
                          <span className="font-medium truncate w-full text-center">{product.name}</span>
                          <span className="text-sm text-muted-foreground">${product.price}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Mesa</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {tables.map((table) => (
                        <Button key={table.id} variant={selectedTable?.id === table.id ? 'default' : 'outline'} size="sm" onClick={() => setSelectedTable(table)}
                          className={table.status === 'occupied' ? 'bg-destructive' : ''}>{table.number}</Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Pedido Actual</CardTitle></CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Sin productos</p>
                    ) : (
                      <div className="space-y-2">
                        {cart.map((item) => (
                          <div key={item.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-sm text-muted-foreground">{item.quantity} x ${item.unitPrice}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">${item.subtotal}</span>
                              <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.productId)}>X</Button>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">Total:</span>
                            <span className="text-xl font-bold">${getCartTotal()}</span>
                          </div>
                        </div>
                        <Button className="w-full mt-2" onClick={createOrder} disabled={!selectedTable}>Crear Pedido</Button>
                        <Button variant="outline" className="w-full mt-1" onClick={clearCart}>Cancelar</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {view === 'orders' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mesa</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.tableNumber || 'Sin mesa'}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                      <TableCell>${order.total}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.status === 'completed' ? 'bg-green-500' :
                          order.status === 'cancelled' ? 'bg-red-500' :
                          order.status === 'ready' ? 'bg-blue-500' : 'bg-yellow-500'
                        } text-white`}>{order.status}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {order.status === 'pending' && <Button size="sm" onClick={() => ordersApi.updateStatus(order.id, 'preparing')}>Preparar</Button>}
                          {order.status === 'preparing' && <Button size="sm" onClick={() => ordersApi.updateStatus(order.id, 'ready')}>Listo</Button>}
                          {order.status === 'ready' && <Button size="sm" onClick={() => ordersApi.updateStatus(order.id, 'completed')}>Completar</Button>}
                          {order.status !== 'completed' && order.status !== 'cancelled' && <Button size="sm" variant="destructive" onClick={() => ordersApi.updateStatus(order.id, 'cancelled')}>Cancelar</Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {view === 'products' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Productos</CardTitle>
              <Button onClick={() => openDialog('product')}><Plus className="h-4 w-4 mr-2" />Nuevo</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.categoryName || '-'}</TableCell>
                      <TableCell>${product.price}</TableCell>
                      <TableCell>
                        <span className={product.available ? 'text-green-500' : 'text-red-500'}>{product.available ? 'Disponible' : 'No disponible'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => openDialog('product', product)}><Edit className="h-3 w-3" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteItem('product', product.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {view === 'categories' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Categorías</CardTitle>
              <Button onClick={() => openDialog('category')}><Plus className="h-4 w-4 mr-2" />Nueva</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>{cat.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => openDialog('category', cat)}><Edit className="h-3 w-3" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteItem('category', cat.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {view === 'tables' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mesas</CardTitle>
              <Button onClick={() => openDialog('table')}><Plus className="h-4 w-4 mr-2" />Nueva</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {tables.map((table) => (
                  <div key={table.id} className={`border rounded-lg p-4 text-center ${table.status === 'occupied' ? 'bg-destructive/20' : 'bg-green-500/20'}`}>
                    <p className="font-bold text-lg">{table.number}</p>
                    <p className="text-sm text-muted-foreground">{table.capacity} personas</p>
                    <span className={`text-xs ${table.status === 'occupied' ? 'text-destructive' : 'text-green-500'}`}>
                      {table.status === 'occupied' ? 'Ocupada' : 'Libre'}
                    </span>
                    <div className="flex gap-1 mt-2 justify-center">
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => openDialog('table', table)}><Edit className="h-3 w-3" /></Button>
                      <Button size="sm" variant="destructive" className="h-6 w-6 p-0" onClick={() => deleteItem('table', table.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {view === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Resumen del Día</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between"><span>Total Ventas:</span><span className="font-bold">${stats.todaySales.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Pedidos:</span><span className="font-bold">{stats.todayOrders}</span></div>
                <div className="flex justify-between"><span>Mesas Ocupadas:</span><span className="font-bold">{stats.activeTables}</span></div>
                <div className="flex justify-between"><span>Productos:</span><span className="font-bold">{stats.totalProducts}</span></div>
                <div className="flex justify-between"><span>Categorías:</span><span className="font-bold">{categories.length}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Últimos Pedidos</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Mesa</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {orders.slice(-5).reverse().map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.tableNumber || '-'}</TableCell>
                        <TableCell>${order.total}</TableCell>
                        <TableCell>{order.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'product' ? (editingItem ? 'Editar' : 'Nuevo') :
               dialogType === 'category' ? (editingItem ? 'Editar' : 'Nueva') :
               (editingItem ? 'Editar' : 'Nueva')} {dialogType === 'product' ? 'Producto' : dialogType === 'category' ? 'Categoría' : 'Mesa'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {dialogType === 'product' && (
              <>
                <Input placeholder="Nombre" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                <Input placeholder="Descripción" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                <Input type="number" placeholder="Precio" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2" value={formData.categoryId || ''} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                  <option value="">Sin categoría</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.available || false} onChange={e => setFormData({...formData, available: e.target.checked})} />
                  Disponible
                </label>
              </>
            )}
            {dialogType === 'category' && (
              <>
                <Input placeholder="Nombre" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                <Input placeholder="Descripción" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
              </>
            )}
            {dialogType === 'table' && (
              <>
                <Input placeholder="Número" value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value})} />
                <Input type="number" placeholder="Capacidad" value={formData.capacity || ''} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveItem}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}