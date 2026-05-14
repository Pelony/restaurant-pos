import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: string
  delay?: number
}

export default function StatsCard({ title, value, icon: Icon, color, delay = 0 }: StatsCardProps) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    cyan: 'from-cyan-500 to-cyan-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.03, y: -5 }}
      className="relative overflow-hidden rounded-xl bg-card border border-border p-6 shadow-lg"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 bg-gradient-to-br ${colors[color] || colors.blue} -translate-y-1/2 translate-x-1/2`} />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colors[color] || colors.blue}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm text-muted-foreground font-medium">{title}</span>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.2 }}
          className="text-3xl font-bold"
        >
          {value}
        </motion.div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors[color] || colors.blue}`} />
    </motion.div>
  )
}