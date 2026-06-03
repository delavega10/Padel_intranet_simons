export type UserRole = 'admin' | 'traener' | 'medarbejder'

export type DocumentCategory =
  | 'personale'
  | 'traening'
  | 'turnering'
  | 'sponsor'
  | 'drift'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  approved: boolean
  created_at: string
  updated_at: string
}

export interface NewsImage {
  path: string
  filename: string
  url: string
}

export interface NewsLinkPreview {
  url: string
  title: string
  description: string
  image: string
  siteName: string
}

export interface News {
  id: string
  title: string | null
  content: string
  published_at: string
  author_id: string | null
  author_name: string
  images: NewsImage[]
  link_previews: NewsLinkPreview[]
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  event_date: string
  event_time: string | null
  description: string | null
  responsible_person: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  title: string
  category: DocumentCategory
  file_path: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  created_at: string
}

export interface TrainingNote {
  id: string
  team_name: string
  level: string
  note_date: string
  exercises: string | null
  notes: string | null
  author_id: string | null
  created_at: string
  updated_at: string
}

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  personale: 'Personale',
  traening: 'Træning',
  turnering: 'Turnering',
  sponsor: 'Sponsor',
  drift: 'Drift',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  traener: 'Træner',
  medarbejder: 'Medarbejder',
}

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface DailyTask {
  id: string
  weekday: Weekday
  round_number: number
  title: string
  sort_order: number
  created_at: string
}

export interface DailyTaskCompletion {
  id: string
  task_id: string
  completion_date: string
  completed_by: string
  completed_at: string
}

export type CaseStatus = 'open' | 'resolved'

export interface LunaCaptain {
  id: string
  name: string
  team: string | null
  phone: string | null
  email: string | null
  sort_order: number
  booking_dates_comment: string
  invoice_sent: boolean
  matchi_booking_confirmed: boolean
  tracking_updated_at: string
  created_at: string
}

export interface EmployeeCase {
  id: string
  title: string
  description: string
  status: CaseStatus
  created_by: string
  created_by_name: string
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export type AdminTodoPriority = 'lav' | 'mellem' | 'hoj'

export interface AdminTodo {
  id: string
  title: string
  description: string
  priority: AdminTodoPriority
  completed: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export const ADMIN_TODO_PRIORITY_LABELS: Record<AdminTodoPriority, string> = {
  hoj: 'Høj',
  mellem: 'Mellem',
  lav: 'Lav',
}

export const ADMIN_TODO_PRIORITY_ORDER: Record<AdminTodoPriority, number> = {
  hoj: 0,
  mellem: 1,
  lav: 2,
}

export type ShopTileColor = 'green' | 'dark'

export interface ShopProduct {
  id: string
  name: string
  tile_color: ShopTileColor
  sort_order: number
  active: boolean
  created_at: string
}

export type ShopOrderStatus = 'ny' | 'klar' | 'afhentet' | 'annulleret'

export interface ShopOrder {
  id: string
  ordered_by: string
  ordered_by_name: string
  status: ShopOrderStatus
  note: string | null
  created_at: string
}

export interface ShopOrderLine {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
}

export interface Sponsor {
  id: string
  name: string
  logo_url: string
  website_url: string | null
  expires_at: string
  sort_order: number
  created_at: string
  updated_at: string
}
