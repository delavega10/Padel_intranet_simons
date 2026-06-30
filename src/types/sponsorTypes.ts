export type SponsorPlacement =
  | 'wall_banner'
  | 'net_band'
  | 'net_post'
  | 'glass_wall'
  | 'equipment'
  | 'scoreboard'
  | 'website_mockup'

export type ExportFormat = 'ratio_4_3' | 'ratio_16_9'

export type BackgroundStyle = 'charcoal_gradient' | 'solid_black'

export interface BenefitItem {
  id: string
  icon: string
  label: string
}

export interface SponsorContent {
  title: string
  subtitle: string
  price: string
  priceLabel: string
  valueLine: string
  benefits: BenefitItem[]
  includedItems: string[]
  targetAudience: string
  ctaText: string
  mainImage: string | null
  thumbnailImages: string[]
  sponsorName: string
  sponsorLogo: string | null
  sponsorPlacement: SponsorPlacement
  sponsorPlacementText: string
  accentColor: string
  backgroundStyle: BackgroundStyle
}

export interface SponsorTemplate {
  id: string
  name: string
  defaultContent: SponsorContent
}

export interface SponsorProject {
  id: string
  templateId: string
  name: string
  content: SponsorContent
  format: ExportFormat
  createdAt: string
  updatedAt: string
}
