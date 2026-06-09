import type { MarketingProductType } from '@/types'

export interface MarketingQuickPackage {
  product_type: MarketingProductType
  package_name: string
  item_name: string
  quantity: number
  size_specs?: string
  material?: string
  print_method?: string
  color_specs?: string
  design_notes?: string
}

export const MARKETING_QUICK_PACKAGES: MarketingQuickPackage[] = [
  {
    product_type: 'banner',
    package_name: 'Standard bannerpakke',
    item_name: 'Banner outdoor 3×1 m',
    quantity: 1,
    size_specs: '300×100 cm, PVC mesh, øjen i hjørner',
    material: 'PVC mesh',
    print_method: 'UV-print',
    design_notes: 'Logo centreret, event-navn under logo',
  },
  {
    product_type: 'banner',
    package_name: 'Indendørs banner',
    item_name: 'Banner indoor 2×1 m',
    quantity: 1,
    size_specs: '200×100 cm, stof',
    material: 'Stof',
    print_method: 'Sublimation',
  },
  {
    product_type: 'rollup',
    package_name: 'Roll-up pakke',
    item_name: 'Roll-up 85×200 cm',
    quantity: 1,
    size_specs: '85×200 cm inkl. taske og stander',
    print_method: 'Latex-print',
  },
  {
    product_type: 'vandflasker',
    package_name: 'Drikkevarer med logo',
    item_name: 'Vandflasker med logo',
    quantity: 50,
    size_specs: '500 ml, genanvendelig plast',
    print_method: 'Silketryk',
    design_notes: 'Logo på flasken — angiv PMS-farver',
  },
  {
    product_type: 'traeningstoej',
    package_name: 'Træningstøj pakke',
    item_name: 'T-shirt med logo',
    quantity: 20,
    size_specs: 'S–XXL, tryk for og bag',
    material: '100% polyester',
    print_method: 'Silketryk',
  },
  {
    product_type: 'traeningstoej',
    package_name: 'Træningstøj premium',
    item_name: 'Hoodie med logo',
    quantity: 10,
    size_specs: 'S–XXL',
    print_method: 'Broderi på bryst',
  },
  {
    product_type: 'kasket_tshirt',
    package_name: 'Giveaway pakke',
    item_name: 'Kasket med logo',
    quantity: 25,
    print_method: 'Broderi',
  },
  {
    product_type: 'poser',
    package_name: 'Goodie bag',
    item_name: 'Tote bag med logo',
    quantity: 30,
    size_specs: '38×42 cm',
    material: 'Bomuld',
    print_method: 'Silketryk',
  },
  {
    product_type: 'flyers',
    package_name: 'Print-materiale',
    item_name: 'A5 flyers',
    quantity: 200,
    size_specs: 'A5, 130g papir, dobbeltsidet',
    print_method: 'Digital print',
  },
  {
    product_type: 'baner_udsmykning',
    package_name: 'Banedekoration',
    item_name: 'Court branding / net-bannere',
    quantity: 4,
    size_specs: 'Tilpasset banestørrelse — angiv antal baner',
    design_notes: 'Logo på net eller court perimeter',
  },
]
