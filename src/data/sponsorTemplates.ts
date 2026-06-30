import type { SponsorContent, SponsorPlacement, SponsorTemplate } from '@/types/sponsorTypes'

interface OverlayPosition {
  anchorClassName: string
  calloutClassName: string
}

interface PlacementOption {
  label: string
  defaultCalloutText: string
  overlayPosition: OverlayPosition
}

export const PLACEMENT_OPTIONS: Record<SponsorPlacement, PlacementOption> = {
  wall_banner: {
    label: 'Vægbanner øverst',
    defaultCalloutText: 'Stor bannerplads i øjenhøjde',
    overlayPosition: {
      anchorClassName: 'top-[12%] right-[10%] w-[38%] h-[16%]',
      calloutClassName: 'top-[5%] right-[2%]',
    },
  },
  net_band: {
    label: 'Netbånd',
    defaultCalloutText: 'Branding på netbånd',
    overlayPosition: {
      anchorClassName: 'bottom-[19%] left-[30%] w-[40%] h-[8%]',
      calloutClassName: 'bottom-[30%] right-[6%]',
    },
  },
  net_post: {
    label: 'Netstolpe',
    defaultCalloutText: 'Synlig branding på netstolpe',
    overlayPosition: {
      anchorClassName: 'bottom-[18%] right-[20%] w-[9%] h-[24%]',
      calloutClassName: 'bottom-[29%] right-[2%]',
    },
  },
  glass_wall: {
    label: 'Glasvæg',
    defaultCalloutText: 'Logo på glasvæg',
    overlayPosition: {
      anchorClassName: 'top-[28%] right-[0%] w-[18%] h-[34%]',
      calloutClassName: 'top-[24%] right-[20%]',
    },
  },
  equipment: {
    label: 'Udstyr / boldkurv',
    defaultCalloutText: 'Branding på udstyr',
    overlayPosition: {
      anchorClassName: 'bottom-[10%] right-[4%] w-[14%] h-[24%]',
      calloutClassName: 'bottom-[2%] right-[20%]',
    },
  },
  scoreboard: {
    label: 'Pointtavle',
    defaultCalloutText: 'Logo ved pointtavle',
    overlayPosition: {
      anchorClassName: 'top-[24%] left-[8%] w-[12%] h-[18%]',
      calloutClassName: 'top-[16%] left-[23%]',
    },
  },
  website_mockup: {
    label: 'Hjemmeside / nyhedsbrev mockup',
    defaultCalloutText: 'Eksponering på hjemmeside og nyhedsbrev',
    overlayPosition: {
      anchorClassName: 'bottom-[3%] left-[6%] w-[26%] h-[18%]',
      calloutClassName: 'bottom-[24%] left-[24%]',
    },
  },
}

const baseContent: SponsorContent = {
  title: 'BANESPONSORAT',
  subtitle: 'Bliv fast synlig på én af klubbens mest brugte baner',
  price: '50.000 kr.',
  priceLabel: '/ år',
  valueLine: 'Fast synlighed + digital eksponering + Company Day',
  benefits: [
    { id: 'visibility', icon: 'building', label: 'Synlighed i hallen' },
    { id: 'digital', icon: 'monitor', label: 'Hjemmeside & nyhedsbrev' },
    { id: 'company_day', icon: 'users', label: 'Company Day' },
  ],
  includedItems: [
    'Synlig branding ved banen',
    'Eksponering på hjemmeside',
    'Omtale i nyhedsbrev',
    'Mulighed for Company Day',
  ],
  targetAudience:
    'Virksomheder, der ønsker lokal synlighed, branding og aktivering over for en aktiv målgruppe.',
  ctaText: 'Kontakt os for en uforpligtende snak om sponsorat',
  mainImage: null,
  thumbnailImages: [],
  sponsorName: 'DIN VIRKSOMHED HER',
  sponsorLogo: null,
  sponsorPlacement: 'wall_banner',
  sponsorPlacementText: PLACEMENT_OPTIONS.wall_banner.defaultCalloutText,
  accentColor: '#84cc16',
  backgroundStyle: 'charcoal_gradient',
}

function createTemplate(
  id: string,
  name: string,
  overrides: Partial<SponsorContent>,
): SponsorTemplate {
  const sponsorPlacement = overrides.sponsorPlacement ?? baseContent.sponsorPlacement
  return {
    id,
    name,
    defaultContent: {
      ...baseContent,
      ...overrides,
      sponsorPlacement,
      sponsorPlacementText:
        overrides.sponsorPlacementText ?? PLACEMENT_OPTIONS[sponsorPlacement].defaultCalloutText,
    },
  }
}

export const sponsorTemplates: SponsorTemplate[] = [
  createTemplate('banesponsorat', 'Banesponsorat', {
    title: 'BANESPONSORAT',
    subtitle: 'Bliv fast synlig på én af klubbens mest brugte baner',
    price: '50.000 kr.',
    sponsorPlacement: 'wall_banner',
  }),
  createTemplate('netsponsor', 'Netsponsor', {
    title: 'NETSPONSOR',
    subtitle: 'Få synlig branding tæt på spillet på alle baner',
    price: '22.000 kr.',
    valueLine: 'Direkte eksponering ved nettet + høj gentagelse',
    includedItems: [
      'Branding på netbånd',
      'Synlighed ved hver kamp',
      'Digital omtale i sponsoroversigt',
      'Mulighed for aktivering i hallen',
    ],
    sponsorPlacement: 'net_band',
  }),
  createTemplate('ligaspil-sponsor', 'Ligaspil sponsor', {
    title: 'LIGASPIL SPONSOR',
    subtitle: 'Bliv partner på klubbens liga med løbende synlighed',
    price: '35.000 kr.',
    valueLine: 'Branding i liga-kommunikation + eksponering i hallen',
    benefits: [
      { id: 'league_branding', icon: 'trophy', label: 'Synlighed i ligaspil' },
      { id: 'digital', icon: 'monitor', label: 'Nyhedsbrev & SoMe' },
      { id: 'activation', icon: 'users', label: 'Aktivering på finaledag' },
    ],
    sponsorPlacement: 'scoreboard',
  }),
  createTemplate('turnering-sponsor', 'Turnering sponsor', {
    title: 'TURNERING SPONSOR',
    subtitle: 'Bliv synlig før, under og efter turneringsdage',
    price: '28.000 kr.',
    valueLine: 'Målrettet eksponering ved events og præmieoverrækkelse',
    benefits: [
      { id: 'event_visibility', icon: 'megaphone', label: 'Branding på eventdagen' },
      { id: 'digital', icon: 'monitor', label: 'Digital dækning' },
      { id: 'target', icon: 'target', label: 'Relevant målgruppe' },
    ],
    sponsorPlacement: 'scoreboard',
  }),
  createTemplate('event-sponsor', 'Event sponsor', {
    title: 'EVENT SPONSOR',
    subtitle: 'Profilér virksomheden på company days og klub-events',
    price: '30.000 kr.',
    valueLine: 'Synlighed + relationer + fysisk tilstedeværelse',
    includedItems: [
      'Eksponering i eventmateriale',
      'Logo i invitationer',
      'Branding i hallen på dagen',
      'Mulighed for stand/aktivitet',
    ],
    sponsorPlacement: 'glass_wall',
  }),
  createTemplate('vaegbanner-sponsor', 'Vægbanner sponsor', {
    title: 'VÆGBANNER SPONSOR',
    subtitle: 'Fast og markant synlighed med stort vægbanner i hallen',
    price: '45.000 kr.',
    valueLine: 'Premium bannerplacering med høj daglig eksponering',
    sponsorPlacement: 'wall_banner',
  }),
  createTemplate('udstyrssponsor', 'Udstyrssponsor', {
    title: 'UDSTYRSSPONSOR',
    subtitle: 'Bliv en del af spilleroplevelsen med synlig branding på udstyr',
    price: '18.000 kr.',
    valueLine: 'Nærværende branding i spillernes hverdag',
    includedItems: [
      'Branding på boldkurv/udstyr',
      'Synlighed tæt på banen',
      'Digital sponsorprofil',
      'Mulighed for produktaktivering',
    ],
    sponsorPlacement: 'equipment',
  }),
]
