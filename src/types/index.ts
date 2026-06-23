export type UserRole = 'admin' | 'traener' | 'medarbejder'

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

export type DailyTaskArea =
  | 'cafe'
  | 'omklaedningsrum'
  | 'toiletter'
  | 'hallen'
  | 'sal1'
  | 'udeareal'
  | 'shop'

export interface DailyTask {
  id: string
  weekday: Weekday
  area: DailyTaskArea
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
  player_set_offer_sent: boolean
  tracking_updated_at: string
  created_at: string
}

export interface FixedCourtCustomer {
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

export interface LunaPlayerSetOffer {
  id: string
  set_name: string
  quantity: number | null
  included_description: string | null
  price: number | null
  updated_at: string
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
  assigned_to: string | null
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

export interface EmilTodo {
  id: string
  title: string
  description: string
  completed: boolean
  created_by: string
  created_at: string
  updated_at: string
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

export interface CollaborationCategory {
  id: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Collaboration {
  id: string
  category_id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  website_url: string | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type CompanyEventStatus = 'planlaegning' | 'bekraeftet' | 'afholdt' | 'aflyst'

export type EventSupplierCategory = 'mad' | 'drikke' | 'praemier' | 'andet'

export interface CompanyEvent {
  id: string
  title: string
  event_date: string
  event_time: string | null
  location: string | null
  description: string | null
  status: CompanyEventStatus
  host_company: string | null
  host_contact_name: string | null
  host_contact_phone: string | null
  host_contact_email: string | null
  public_notes: string | null
  whole_hall: boolean
  court_count: number | null
  matchi_booked: boolean
  booked_court_numbers: number[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CompanyEventFinance {
  event_id: string
  host_agreed_price: number | null
  host_invoice_sent: boolean
  host_invoice_paid: boolean
  total_budget: number | null
  total_cost: number | null
  financial_notes: string | null
  updated_at: string
}

export interface CompanyEventSupplier {
  id: string
  event_id: string
  category: EventSupplierCategory
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  description: string | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CompanyEventSupplierFinance {
  supplier_id: string
  agreed_price: number | null
  invoice_sent: boolean
  invoice_paid: boolean
  financial_notes: string | null
  on_site_from: string | null
  on_site_to: string | null
  included_description: string | null
  /** @deprecated Brug company_event_supplier_addons */
  addon_description: string | null
  /** @deprecated Brug company_event_supplier_addons */
  addon_price: number | null
  updated_at: string
}

export interface CompanyEventSupplierAddon {
  id: string
  supplier_id: string
  description: string
  price: number | null
  sort_order: number
  created_at: string
}

export interface CompanyEventTodo {
  id: string
  event_id: string
  title: string
  description: string | null
  completed: boolean
  due_date: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export const COMPANY_EVENT_STATUS_LABELS: Record<CompanyEventStatus, string> = {
  planlaegning: 'Planlægning',
  bekraeftet: 'Bekræftet',
  afholdt: 'Afholdt',
  aflyst: 'Aflyst',
}

export const EVENT_SUPPLIER_CATEGORY_LABELS: Record<EventSupplierCategory, string> = {
  mad: 'Mad',
  drikke: 'Drikke',
  praemier: 'Præmier',
  andet: 'Andet',
}

export type MarketingProductType =
  | 'banner'
  | 'rollup'
  | 'vandflasker'
  | 'traeningstoej'
  | 'kasket_tshirt'
  | 'poser'
  | 'flyers'
  | 'baner_udsmykning'
  | 'andet'

export type MarketingOrderStatus =
  | 'forespurgt'
  | 'godkendt'
  | 'bestilt'
  | 'i_produktion'
  | 'leveret'
  | 'annulleret'

export interface CompanyEventMarketing {
  event_id: string
  logo_url: string | null
  logo_path: string | null
  logo_filename: string | null
  brand_colors: string | null
  logo_placement_notes: string | null
  design_approved: boolean
  design_approved_by: string | null
  design_approved_at: string | null
  updated_at: string
}

export interface CompanyEventMarketingItem {
  id: string
  event_id: string
  product_type: MarketingProductType
  package_name: string | null
  item_name: string
  quantity: number
  size_specs: string | null
  material: string | null
  print_method: string | null
  color_specs: string | null
  design_notes: string | null
  status: MarketingOrderStatus
  supplier_name: string | null
  order_date: string | null
  expected_delivery: string | null
  delivered_date: string | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CompanyEventMarketingItemFinance {
  item_id: string
  unit_price: number | null
  total_price: number | null
  invoice_sent: boolean
  invoice_paid: boolean
  financial_notes: string | null
  included_description: string | null
  /** @deprecated Brug company_event_marketing_item_addons */
  addon_description: string | null
  /** @deprecated Brug company_event_marketing_item_addons */
  addon_price: number | null
  updated_at: string
}

export interface CompanyEventMarketingItemAddon {
  id: string
  item_id: string
  description: string
  price: number | null
  sort_order: number
  created_at: string
}

export const MARKETING_PRODUCT_LABELS: Record<MarketingProductType, string> = {
  banner: 'Banner',
  rollup: 'Roll-up',
  vandflasker: 'Vandflasker m. logo',
  traeningstoej: 'Træningstøj m. logo',
  kasket_tshirt: 'Kasket / t-shirt',
  poser: 'Poser / goodie bags',
  flyers: 'Flyers / print',
  baner_udsmykning: 'Baner & udsmykning',
  andet: 'Andet',
}

export const MARKETING_ORDER_STATUS_LABELS: Record<MarketingOrderStatus, string> = {
  forespurgt: 'Forespurgt',
  godkendt: 'Godkendt',
  bestilt: 'Bestilt',
  i_produktion: 'I produktion',
  leveret: 'Leveret',
  annulleret: 'Annulleret',
}
