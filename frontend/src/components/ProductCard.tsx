import { motion } from 'framer-motion'
import { Product } from '@/types'
import { Pizza, Coffee, Utensils, IceCream, Wine, Crown } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onClick: () => void
}

const categoryIcons: Record<string, any> = {
  pizza: Pizza,
  cafe: Coffee,
  comida: Utensils,
  postre: IceCream,
  bebida: Wine,
  premium: Crown,
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const icon = categoryIcons[product.categoryName?.toLowerCase() || 'comida'] || Utensils

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-md transition-all hover:shadow-xl hover:border-primary/50"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5"
        animate={{
          background: [
            'linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))',
            'linear-gradient(to bottom right, rgba(147, 51, 234, 0.05), rgba(59, 130, 246, 0.05))',
            'linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))',
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-lg"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <icon className="h-8 w-8 text-white" />
          )}
        </motion.div>
        <div className="text-center w-full">
          <h3 className="font-semibold text-sm truncate">{product.name}</h3>
          <p className="text-2xl font-bold text-primary mt-1">${product.price}</p>
        </div>
        {!product.available && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs font-medium bg-destructive/20 text-destructive rounded-full">
              No disponible
            </span>
          </div>
        )}
      </div>
    </motion.button>
  )
}