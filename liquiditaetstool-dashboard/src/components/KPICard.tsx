'use client'

import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  color?: 'amber' | 'green' | 'red' | 'blue'
  subtitle?: string
}

export default function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend = 'neutral',
  color = 'amber',
  subtitle
}: KPICardProps) {
  const colorClasses = {
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      icon: 'text-amber-500',
      gradient: 'from-amber-500 to-orange-600'
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      icon: 'text-emerald-500',
      gradient: 'from-emerald-500 to-green-600'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: 'text-red-500',
      gradient: 'from-red-500 to-rose-600'
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'text-blue-500',
      gradient: 'from-blue-500 to-indigo-600'
    }
  }

  const colors = colorClasses[color]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1.5">
              {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
              {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
              <span
                className={`text-xs font-medium ${
                  trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                {change > 0 ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-500 ml-1">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}

