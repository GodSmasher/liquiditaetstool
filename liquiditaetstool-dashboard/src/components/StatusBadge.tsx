'use client'

import { CheckCircle, Clock, AlertTriangle, Circle } from 'lucide-react'

type StatusType = 'paid' | 'open' | 'overdue' | 'pending'

interface StatusBadgeProps {
  status: StatusType
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export default function StatusBadge({ 
  status, 
  size = 'md',
  showIcon = true 
}: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-4 h-4'
  }

  const statusConfig = {
    paid: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle,
      label: 'Bezahlt',
      dotColor: 'bg-emerald-500'
    },
    open: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: Clock,
      label: 'Offen',
      dotColor: 'bg-amber-500'
    },
    overdue: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: AlertTriangle,
      label: 'Überfällig',
      dotColor: 'bg-red-500'
    },
    pending: {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: Circle,
      label: 'Ausstehend',
      dotColor: 'bg-gray-500'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-semibold border
        ${config.bg} ${config.text} ${config.border}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && (
        <Icon className={`${iconSizes[size]} flex-shrink-0`} />
      )}
      <span>{config.label}</span>
    </span>
  )
}

// Export helper function to get status color for other uses
export function getStatusColor(status: StatusType): string {
  const colors = {
    paid: 'emerald',
    open: 'amber',
    overdue: 'red',
    pending: 'gray'
  }
  return colors[status]
}

