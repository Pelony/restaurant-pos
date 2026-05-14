import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { productsApi, categoriesApi, tablesApi, ordersApi } from '@/services/api'
import type { Product, Category, TableEntity, Order } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Moon, Sun, Plus, Trash2, Edit, DollarSign, ShoppingCart, Users, Utensils, Package, LayoutGrid, List, BarChart3, ChefHat } from 'lucide-react'
import StatsCard from '@/components/StatsCard'
import ProductCard from '@/components/ProductCard'

interface CartItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface Stats {
  todaySales: number
  todayOrders: number
  activeTables: number
  totalProducts: number
}

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }
const stagger = { staggerChildren: 0.1 }

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
    setStats({
      todaySales,
      todayOrders: todayOrders.length,
      activeTables: tables.filter(t => t.status === 'occupied').length,
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
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity }))
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
      if (dialogType === 'product') editingItem ? await productsApi.update(editingItem.id, formData) : await productsApi.create(formData)
      else if (dialogType === 'category') editingItem ? await categoriesApi.update(editingItem.id, formData) : await categoriesApi.create(formData)
      else editingItem ? await tablesApi.update(editingItem.id, formData) : await tablesApi.create(formData)
      setDialogOpen(false)
      loadData()
    } catch (error) { console.error('Error saving:', error) }
  }

  const deleteItem = async (type: string, id: string) => {
    if (!confirm('¿Eliminar este elemento?')) return
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

  const statCards = [
    { title: 'Ventas Hoy', value: `$${stats.todaySales.toFixed(2)}`, icon: DollarSign, color: 'green', delay: 0 },
    { title: 'Pedidos', value: stats.todayOrders, icon: ShoppingCart, color: 'blue', delay: 0.1 },
    { title: 'Mesas', value: `${stats.activeTables}/${tables.length}`, icon: Users, color: 'orange', delay: 0.2 },
    { title: 'Productos', value: stats.totalProducts, icon: Package, color: 'purple', delay: 0.3 },
  ]

  const navItems = [
    { id: 'pos', icon: ChefHat, label: 'POS' },
    { id: 'orders', icon: ShoppingCart, label: 'Pedidos' },
    { id: 'products', icon: Package, label: 'Productos' },
    { id: 'categories', icon: LayoutGrid, label: 'Categorías' },
    { id: 'tables', icon: Users, label: 'Mesas' },
    { id: 'reports', icon: BarChart3, label: 'Reportes' },
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-lg bg-card/80 border-b border-border shadow-lg"
      >
        <div className="flex justify-between items-center p-4">
          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                {auth?.tenantName}
              </h1>
              <p className="text-xs text-muted-foreground">Hola, {auth?.name}</p>
            </div>
          </motion.div>
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => setView(item.id as any)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-lg transition-all ${view === item.id ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted'}`}
              >
                <item.icon className="w-5 h-5" />
              </motion.button>
            ))}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg hover:bg-muted"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
            <motion.button
              onClick={logout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              <span className="text-sm font-medium">Salir</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="p-4 space-y-6">
        <AnimatePresence mode="wait">
          {view === 'pos' && (
            <motion.div key="pos" {...fadeIn} className="space-y-6">
              <motion.div
                variants={stagger}
                initial="initial"
                animate="animate"
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {statCards.map((stat, i) => (
                  <StatsCard key={stat.title} {...stat} />
                ))}
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="lg:col-span-2"
                >
                  <Card className="border-border/50 shadow-xl">
                    <CardHeader className="border-b border-border/50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-primary" />
                          Menú
                        </CardTitle>
                        <div className="flex gap-1 p-1 bg-muted rounded-lg">
                          <Button
                            variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setSelectedCategory('all')}
                          >
                            Todo
                          </Button>
                          {categories.slice(0, 4).map((cat) => (
                            <Button
                              key={cat.id}
                              variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setSelectedCategory(cat.id)}
                            >
                              {cat.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <motion.div
                        variants={stagger}
                        initial="initial"
                        animate="animate"
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                      >
                        {filteredProducts.map((product, i) => (
                          <motion.div
                            key={product.id}
                            variants={fadeIn}
                            custom={i}
                          >
                            <ProductCard product={product} onClick={() => addToCart(product)} />
                          </motion.div>
                        ))}
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  <Card className="border-border/50 shadow-xl">
                    <CardHeader className="border-b border-border/50">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Mesa
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2">
                        {tables.map((table) => (
                          <motion.button
                            key={table.id}
                            onClick={() => setSelectedTable(table)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-3 rounded-lg font-bold transition-all ${
                              selectedTable?.id === table.id
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : table.status === 'occupied'
                                ? 'bg-destructive/20 text-destructive'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {table.number}
                          </motion.button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/10 to-purple-500/10">
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        Pedido Actual
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-80 overflow-y-auto">
                      {cart.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-8 text-muted-foreground"
                        >
                          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Sin productos</p>
                        </motion.div>
                      ) : (
                        <motion.div
                          variants={stagger}
                          initial="initial"
                          animate="animate"
                          className="space-y-3"
                        >
                          {cart.map((item) => (
                            <motion.div
                              key={item.id}
                              variants={fadeIn}
                              className="flex justify-between items-center p-2 rounded-lg bg-muted/50"
                            >
                              <div>
                                <p className="font-medium text-sm">{item.productName}</p>
                                <p className="text-xs text-muted-foreground">{item.quantity} x ${item.unitPrice}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">${item.subtotal}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive"
                                  onClick={() => removeFromCart(item.productId)}
                                >
                                  ×
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="pt-3 border-t border-border"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-lg font-bold">Total:</span>
                              <span className="text-2xl font-bold text-primary">${getCartTotal()}</span>
                            </div>
                            <Button
                              className="w-full text-lg font-bold shadow-lg"
                              onClick={createOrder}
                              disabled={!selectedTable}
                            >
                              Crear Pedido
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full mt-2"
                              onClick={clearCart}
                            >
                              Cancelar
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          )}

          {view === 'orders' && (
            <motion.div key="orders" {...fadeIn}>
              <Card className="border-border/50 shadow-xl">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    Pedidos Recientes
                  </CardTitle>
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
                      {orders.slice().reverse().map((order) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">{order.tableNumber || 'Sin mesa'}</TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                          <TableCell className="font-bold">${order.total}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                              order.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                              order.status === 'ready' ? 'bg-blue-500/20 text-blue-500' :
                              'bg-yellow-500/20 text-yellow-500'
                            }`}>{order.status}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {order.status === 'pending' && <Button size="sm" onClick={() => ordersApi.updateStatus(order.id, 'preparing')}>Preparar</Button>}
                              {order.status === 'preparing' && <Button size="sm" onClick={() => ordersApi.updateStatus(order.id, 'ready')}>Listo</Button>}
                              {order.status === 'ready' && <Button size="sm" onClick={() => ordersApi.updateStatus(order.id, 'completed')}>Completar</Button>}
                              {order.status !== 'completed' && order.status !== 'cancelled' && <Button size="sm" variant="destructive" onClick={() => ordersApi.updateStatus(order.id, 'cancelled')}>Cancelar</Button>}
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {view === 'products' && (
            <motion.div key="products" {...fadeIn}>
              <Card className="border-border/50 shadow-xl">
                <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Productos
                  </CardTitle>
                  <Button onClick={() => openDialog('product')} className="bg-gradient-to-r from-primary to-purple-500">
                    <Plus className="w-4 h-4 mr-2" />Nuevo
                  </Button>
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
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.categoryName || '-'}</TableCell>
                          <TableCell className="font-bold">${product.price}</TableCell>
                          <TableCell>
                            <span className={product.available ? 'text-green-500' : 'text-red-500'}>
                              {product.available ? '✓ Disponible' : '✗ No disponible'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => openDialog('product', product)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteItem('product', product.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {view === 'categories' && (
            <motion.div key="categories" {...fadeIn}>
              <Card className="border-border/50 shadow-xl">
                <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-primary" />
                    Categorías
                  </CardTitle>
                  <Button onClick={() => openDialog('category')} className="bg-gradient-to-r from-primary to-purple-500">
                    <Plus className="w-4 h-4 mr-2" />Nueva
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.map((cat, i) => (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer"
                        onClick={() => openDialog('category', cat)}
                      >
                        <h3 className="font-bold">{cat.name}</h3>
                        <p className="text-sm text-muted-foreground">{cat.description || 'Sin descripción'}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {view === 'tables' && (
            <motion.div key="tables" {...fadeIn}>
              <Card className="border-border/50 shadow-xl">
                <CardHeader className="border-b border-border/50 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Mesas
                  </CardTitle>
                  <Button onClick={() => openDialog('table')} className="bg-gradient-to-r from-primary to-purple-500">
                    <Plus className="w-4 h-4 mr-2" />Nueva
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {tables.map((table, i) => (
                      <motion.div
                        key={table.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          table.status === 'occupied'
                            ? 'border-destructive bg-destructive/10'
                            : 'border-green-500 bg-green-500/10'
                        }`}
                      >
                        <div className="text-center">
                          <p className="text-2xl font-bold">{table.number}</p>
                          <p className="text-sm text-muted-foreground">{table.capacity} pers.</p>
                          <span className={`text-xs font-medium ${table.status === 'occupied' ? 'text-destructive' : 'text-green-500'}`}>
                            {table.status === 'occupied' ? 'Ocupada' : 'Libre'}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {view === 'reports' && (
            <motion.div key="reports" {...fadeIn}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border/50 shadow-xl">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Resumen del Día
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {statCards.map((stat) => (
                      <div key={stat.title} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="text-muted-foreground">{stat.title}</span>
                        <span className="text-xl font-bold">{stat.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-xl">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                      Últimos Pedidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mesa</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.slice(-5).reverse().map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.tableNumber || '-'}</TableCell>
                            <TableCell className="font-bold">${order.total}</TableCell>
                            <TableCell>
                              <span className="text-xs">{order.status}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              {dialogType === 'product' ? (editingItem ? 'Editar' : 'Nuevo') :
               dialogType === 'category' ? (editingItem ? 'Editar' : 'Nueva') :
               (editingItem ? 'Editar' : 'Nueva')} {dialogType === 'product' ? 'Producto' : dialogType === 'category' ? 'Categoría' : 'Mesa'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {dialogType === 'product' && (
              <>
                <Input placeholder="Nombre del producto" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11" />
                <Input placeholder="Descripción" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                <Input type="number" placeholder="Precio" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="h-11" />
                <select
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={formData.categoryId || ''}
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                >
                  <option value="">Sin categoría</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 cursor-pointer">
                  <input type="checkbox" checked={formData.available || false} onChange={e => setFormData({...formData, available: e.target.checked})} className="w-4 h-4" />
                  <span>Producto disponible</span>
                </label>
              </>
            )}
            {dialogType === 'category' && (
              <>
                <Input placeholder="Nombre" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11" />
                <Input placeholder="Descripción" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
              </>
            )}
            {dialogType === 'table' && (
              <>
                <Input placeholder="Número de mesa" value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value})} className="h-11" />
                <Input type="number" placeholder="Capacidad" value={formData.capacity || ''} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} className="h-11" />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveItem} className="bg-gradient-to-r from-primary to-purple-500">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}