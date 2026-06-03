import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: LucideIcon
}) {
  return (
    <div className="page-header-container page-header-with-action">
      <div>
        <h1 className="page-header">
          {Icon && <Icon className="page-icon" />}
          {title}
        </h1>
        {description && <p className="mt-2 text-gray-600 normal-case">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
