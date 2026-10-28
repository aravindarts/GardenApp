import axios, { AxiosInstance } from 'axios';
import {
  OrderConfirmation,
  OrderPayload,
  Product,
  SpringBootApiResponse,
} from '../types/ecommerce';
import { STUDIO_VISUALS } from '../utils/studioVisuals';
import {
  FREE_SHIPPING_THRESHOLD,
  UAE_STANDARD_DELIVERY_FEE,
  UAE_VAT_RATE,
} from '../utils/inventory';

/**
 * Isolated Spring Boot REST API Service Layer for UAE Plant & Garden Nursery.
 * Connects to `/api/v1/products`, `/api/v1/inventory`, `/api/v1/orders`.
 * Includes a deterministic local Spring Boot Inventory Controller fallback so all animations,
 * optimistic UI updates, and stock tier transitions can be previewed immediately.
 */

const REMOTE_SPRING_BOOT_URL = import.meta.env.VITE_SPRING_BOOT_API_URL;
const IS_REMOTE_BACKEND_CONFIGURED = Boolean(REMOTE_SPRING_BOOT_URL);
const SPRING_BOOT_BASE_URL = REMOTE_SPRING_BOOT_URL || '/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: SPRING_BOOT_BASE_URL,
  timeout: 4500,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor for injecting Spring Security JWT Bearer token
apiClient.interceptors.request.use((config) => {
  try {
    const rawStore = localStorage.getItem('atelier-uae-nursery-store-v3');
    if (rawStore) {
      const parsed = JSON.parse(rawStore);
      const token = parsed?.state?.user?.token;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return config;
});

const STORAGE_KEY_INVENTORY = 'atelier-uae-nursery-inventory-v4';

/**
 * "Complete the Plant Parent Kit" One-Click Cross-Sell Add-ons (+AED 25, +AED 35, +AED 40)
 */
export const PLANT_PARENT_KIT_ADDONS: Product[] = [
  {
    id: 'addon-potting-soil',
    sku: 'UAE-KIT-SOIL',
    name: 'Organic Bio-Active Potting Soil (2.5L)',
    botanicalName: 'Orchid Bark, Coco Coir & Volcanic Perlite',
    subtitle: 'Aerated UAE indoor substrate formulated to prevent AC root rot',
    category: 'pots_and_soil',
    categoryLabel: 'Plant Parent Kit',
    finderTags: ['pots_and_soil', 'pet_safe'],
    price: 25.0,
    description: '2.5L resealable pouch of organic, peat-free potting soil.',
    careLevel: 'Easy',
    lightRequirement: 'Bright Indirect',
    wateringFrequency: 'Weekly',
    isPetFriendly: true,
    plantSize: 'Small (20-30cm)',
    potIncluded: false,
    materials: ['Organic Coco Coir', 'Volcanic Perlite', 'Activated Biochar'],
    dimensions: '2.5L Pouch',
    weight: '1.1 kg',
    origin: 'Al Quoz Formulation Lab, Dubai',
    rating: 4.9,
    reviewCount: 142,
    primaryImage: STUDIO_VISUALS.terracottaPotPrimary,
    secondaryImage: STUDIO_VISUALS.terracottaPotSecondary,
    specs: [],
    inventory: {
      sku: 'UAE-KIT-SOIL',
      availableStock: 40,
      maxCapacity: 50,
      reservedStock: 2,
      warehouseLocation: 'DXB-ALQUOZ-01',
      lastSyncedAt: new Date().toISOString(),
    },
  },
  {
    id: 'addon-brass-mister',
    sku: 'UAE-KIT-MISTER',
    name: 'Solid Brass Watering Mister (300ml)',
    botanicalName: 'Hand-Spun Unlacquered Brass Atomizer',
    subtitle: 'Delivers a micro-fine humidity mist to counter dry UAE air-conditioning',
    category: 'pots_and_soil',
    categoryLabel: 'Plant Parent Kit',
    finderTags: ['pots_and_soil', 'pet_safe'],
    price: 35.0,
    description: '300ml solid brass atomizer for tropical foliage humidity.',
    careLevel: 'Easy',
    lightRequirement: 'Bright Indirect',
    wateringFrequency: 'Mist Daily',
    isPetFriendly: true,
    plantSize: 'Small (20-30cm)',
    potIncluded: false,
    materials: ['Solid Spun Brass', 'Precision Brass Nozzle'],
    dimensions: '15 cm H × 8.5 cm W',
    weight: '0.32 kg',
    origin: 'Dubai Artisan Studio',
    rating: 5.0,
    reviewCount: 98,
    primaryImage: STUDIO_VISUALS.terracottaPotSecondary,
    secondaryImage: STUDIO_VISUALS.terracottaPotPrimary,
    specs: [],
    inventory: {
      sku: 'UAE-KIT-MISTER',
      availableStock: 28,
      maxCapacity: 40,
      reservedStock: 1,
      warehouseLocation: 'DXB-ALQUOZ-01',
      lastSyncedAt: new Date().toISOString(),
    },
  },
  {
    id: 'addon-organic-plant-food',
    sku: 'UAE-KIT-FOOD',
    name: 'Organic Liquid Seaweed & Humic Plant Food',
    botanicalName: 'Cold-Pressed Kelp & Desert Humates (250ml)',
    subtitle: 'Concentrated botanical elixir for glossy leaves and vigorous root growth',
    category: 'pots_and_soil',
    categoryLabel: 'Plant Parent Kit',
    finderTags: ['pots_and_soil', 'pet_safe'],
    price: 40.0,
    description: '100% organic, pet-safe liquid plant nutrient concentrate.',
    careLevel: 'Easy',
    lightRequirement: 'Bright Indirect',
    wateringFrequency: 'Bi-Weekly',
    isPetFriendly: true,
    plantSize: 'Small (20-30cm)',
    potIncluded: false,
    materials: ['Cold-Pressed Atlantic Kelp', 'Fulvic & Humic Minerals', 'Amber Glass Apothecary Bottle'],
    dimensions: '250ml Amber Glass Bottle + Pipette',
    weight: '0.48 kg',
    origin: 'Al Barari Bio-Lab, Dubai',
    rating: 4.9,
    reviewCount: 116,
    primaryImage: STUDIO_VISUALS.monsteraPrimary,
    secondaryImage: STUDIO_VISUALS.monsteraSecondary,
    specs: [],
    inventory: {
      sku: 'UAE-KIT-FOOD',
      availableStock: 35,
      maxCapacity: 45,
      reservedStock: 2,
      warehouseLocation: 'DXB-ALBARARI-01',
      lastSyncedAt: new Date().toISOString(),
    },
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-monstera-deliciosa',
    sku: 'UAE-BOT-001',
    name: 'Monstera Deliciosa (Swiss Cheese Plant)',
    botanicalName: 'Monstera deliciosa',
    subtitle: 'Architectural split-leaf tropical specimen acclimated for UAE interiors',
    category: 'air_purifiers',
    categoryLabel: 'Indoor Air Purifiers',
    finderTags: ['air_purifiers'],
    price: 245.0,
    compareAtPrice: 290.0,
    isBestseller: true,
    description:
      'Greenhouse-acclimated in Al Barari for air-conditioned UAE residences. Its deep emerald fenestrated leaves actively purify indoor air while thriving in bright, filtered villa or apartment light.',
    careLevel: 'Easy',
    lightRequirement: 'Bright Indirect',
    wateringFrequency: 'Weekly',
    isPetFriendly: false,
    plantSize: 'Medium (50-70cm)',
    potIncluded: true,
    defaultSize: 'Medium',
    sizeVariants: [
      { size: 'Small', heightLabel: '25–35 cm', priceDelta: -50, availableStock: 14 },
      { size: 'Medium', heightLabel: '55–70 cm', priceDelta: 0, availableStock: 22 },
      { size: 'Large', heightLabel: '120–140 cm', priceDelta: 135, availableStock: 6 },
    ],
    ceramicSwatches: [
      { id: 'matte_white', name: 'Matte White', hex: '#F5F4F0', availableStock: 15 },
      { id: 'desert_sand', name: 'Desert Sand', hex: '#DECBB1', availableStock: 9 },
      { id: 'charcoal', name: 'Charcoal', hex: '#2C302E', availableStock: 4 },
      { id: 'terracotta', name: 'Terracotta', hex: '#D97757', availableStock: 0 },
    ],
    careGuide: {
      lightLevel: 'Bright Indirect Light',
      lightDetail: 'Thrives 2–3 meters from sunny Dubai floor-to-ceiling windows; avoid harsh midday glass glare.',
      wateringSchedule: 'Every 7–10 Days',
      wateringDetail: 'Water thoroughly when the top 4 cm of aroid soil feels dry to the touch.',
      uaeClimateTip: 'Keep Away from Direct AC Vents',
      uaeClimateDetail: 'Shield aerial roots from cold AC drafts and mist foliage 2–3 times weekly.',
      petToxicity: 'Keep Away from Pets',
      petToxicityDetail: 'Contains calcium oxalate crystals if chewed by curious cats or dogs.',
    },
    materials: ['Al Barari Acclimated Specimen', 'Matte Sand Stoneware Planter', 'Coco Coir & Perlite Mix'],
    dimensions: '65 cm H × 45 cm Canopy',
    weight: '4.6 kg',
    origin: 'Al Barari Nursery, Dubai',
    rating: 4.9,
    reviewCount: 112,
    featuredBento: 'primary',
    primaryImage: STUDIO_VISUALS.monsteraPrimary,
    secondaryImage: STUDIO_VISUALS.monsteraSecondary,
    specs: [
      { label: 'Care Level', value: 'Easy (AC-Humidity Tolerant)' },
      { label: 'Light Requirement', value: 'Bright Indirect Sunlight' },
      { label: 'Watering Schedule', value: 'Weekly when top 4cm is dry' },
      { label: 'Planter Included', value: 'Nursery Pot or +AED 45 Ceramic' },
    ],
    inventory: {
      sku: 'UAE-BOT-001',
      availableStock: 22,
      maxCapacity: 30,
      reservedStock: 2,
      warehouseLocation: 'DXB-ALBARARI-01',
      lastSyncedAt: new Date().toISOString(),
    },
  },
  {
    id: 'prod-olive-tree',
    sku: 'UAE-BOT-002',
    name: 'Mediterranean Olive Tree (UAE Sun & Patio Favorite)',
    botanicalName: 'Olea europaea',
    subtitle: 'Sculptural gnarled trunk & silvery-sage foliage for UAE terraces and sunlit courtyards',
    category: 'uae_heat_tolerant',
    categoryLabel: 'Outdoor UAE Heat Tolerant',
    finderTags: ['uae_heat_tolerant', 'pet_safe'],
    price: 680.0,
    isBestseller: true,
    description:
      'Cultivated for extreme drought and full Gulf sun resilience up to 48°C. Planted in a breathable vessel, this statement heirloom tree brings timeless Mediterranean serenity to Dubai penthouses and villa gardens.',
    careLevel: 'Moderate',
    lightRequirement: 'Full UAE Sun',
    wateringFrequency: 'Bi-Weekly',
    isPetFriendly: true,
    plantSize: 'LargeStatement (120cm+)',
    potIncluded: true,
    defaultSize: 'Large',
    sizeVariants: [
      { size: 'Small', heightLabel: '45–60 cm Table Bonsai', priceDelta: -220, availableStock: 8 },
      { size: 'Medium', heightLabel: '85–105 cm Courtyard', priceDelta: -110, availableStock: 6 },
      { size: 'Large', heightLabel: '140–165 cm Statement', priceDelta: 0, availableStock: 4 },
    ],
    ceramicSwatches: [
      { id: 'matte_white', name: 'Matte White', hex: '#F5F4F0', availableStock: 6 },
      { id: 'desert_sand', name: 'Desert Sand', hex: '#DECBB1', availableStock: 4 },
      { id: 'charcoal', name: 'Charcoal', hex: '#2C302E', availableStock: 0 },
      { id: 'terracotta', name: 'Terracotta', hex: '#D97757', availableStock: 5 },
    ],
    careGuide: {
      lightLevel: 'Full Direct UAE Sun (6+ Hrs)',
      lightDetail: 'Loves south-facing balconies, villa courtyards, and bright sunlit conservatory windows.',
      wateringSchedule: 'Every 10–14 Days',
      wateringDetail: 'Allow top 6 cm of mineral soil to dry between deep root soakings.',
      uaeClimateTip: 'Summer Peak Heat Resilient',
      uaeClimateDetail: 'Withstands up to 48°C; increase watering to twice weekly during July–August outdoor heat.',
      petToxicity: '100% Safe for Cats & Dogs',
      petToxicityDetail: 'Completely non-toxic foliage and bark for households with pets.',
    },
    materials: ['Heirloom Olea Europaea', 'Ribbed Limestone Vessel', 'Volcanic Pumice Drainage'],
    dimensions: '145 cm H × 65 cm Canopy',
    weight: '16.5 kg',
    origin: 'Andalusia & Ras Al Khaimah',
    rating: 5.0,
    reviewCount: 64,
    featuredBento: 'secondary',
    primaryImage: STUDIO_VISUALS.oliveTreePrimary,
    secondaryImage: STUDIO_VISUALS.oliveTreeSecondary,
    specs: [
      { label: 'Heat Tolerance', value: 'Up to 48°C Full UAE Sun' },
      { label: 'Pet Safety', value: '100% Non-Toxic (Cat & Dog Safe)' },
      { label: 'Watering Schedule', value: 'Bi-Weekly Deep Soak' },
      { label: 'Planter Included', value: 'Yes — Ribbed Limestone Planter' },
    ],
    inventory: {
      sku: 'UAE-BOT-002',
      availableStock: 4,
      maxCapacity: 15,
      reservedStock: 1,
      warehouseLocation: 'DXB-ALQUOZ-02',
      lastSyncedAt: new Date().toISOString(),
    },
  },
  {
    id: 'prod-calathea-orbifolia',
    sku: 'UAE-BOT-003',
    name: 'Calathea Orbifolia (Pet-Safe Prayer Plant)',
    botanicalName: 'Goeppertia orbifolia',
    subtitle: 'Silvery-striped botanical foliage that folds upward at dusk — 100% pet-safe',
    category: 'pet_safe',
    categoryLabel: 'Pet Safe',
    finderTags: ['pet_safe', 'air_purifiers'],
    price: 165.0,
    description:
      'Celebrated for its wide, hand-painted silver and emerald striations. Completely non-toxic to cats and dogs, and thrives in humid indoor corners away from harsh sun.',
    careLevel: 'Moderate',
    lightRequirement: 'Bright Indirect',
    wateringFrequency: 'Mist Daily',
    isPetFriendly: true,
    plantSize: 'Small (20-30cm)',
    potIncluded: true,
    defaultSize: 'Small',
    sizeVariants: [
      { size: 'Small', heightLabel: '25–35 cm', priceDelta: 0, availableStock: 2 },
      { size: 'Medium', heightLabel: '45–60 cm', priceDelta: 55, availableStock: 5 },
      { size: 'Large', heightLabel: '75–90 cm Bushy Specimen', priceDelta: 115, availableStock: 2 },
    ],
    ceramicSwatches: [
      { id: 'matte_white', name: 'Matte White', hex: '#F5F4F0', availableStock: 8 },
      { id: 'desert_sand', name: 'Desert Sand', hex: '#DECBB1', availableStock: 6 },
      { id: 'charcoal', name: 'Charcoal', hex: '#2C302E', availableStock: 3 },
      { id: 'terracotta', name: 'Terracotta', hex: '#D97757', availableStock: 0 },
    ],
    careGuide: {
      lightLevel: 'Medium to Bright Indirect Light',
      lightDetail: 'Keep out of direct sunbeams to preserve its delicate silver-green leaf striping.',
      wateringSchedule: 'Every 5–7 Days + Daily Mist',
      wateringDetail: 'Keep soil lightly moist (never soggy) using filtered or bottled water.',
      uaeClimateTip: 'Keep Away from Direct AC Vents',
      uaeClimateDetail: 'Group with other plants or mist daily with our Brass Atomizer to maintain 50%+ humidity.',
      petToxicity: '100% Safe for Cats & Dogs',
      petToxicityDetail: 'ASPCA certified non-toxic prayer plant — worry-free for furry companions.',
    },
    materials: ['Calathea Orbifolia', 'Raw Terracotta Cylinder', 'Moisture-Retentive Peat-Free Mix'],
    dimensions: '32 cm H × 28 cm W',
    weight: '2.4 kg',
    origin: 'Jumeirah Conservatory, Dubai',
    rating: 4.9,
    reviewCount: 78,
    featuredBento: 'tertiary',
    primaryImage: STUDIO_VISUALS.calatheaPrimary,
    secondaryImage: STUDIO_VISUALS.calatheaSecondary,
    specs: [
      { label: 'Pet Safety', value: 'ASPCA Certified Pet-Safe' },
      { label: 'Foliage Rhythm', value: 'Nyctinastic (Leaves rise at night)' },
      { label: 'Humidity & Care', value: 'Mist Daily · Filtered Water' },
      { label: 'Planter Included', value: 'Yes — Raw Warm Clay Pot' },
    ],
    inventory: {
      sku: 'UAE-BOT-003',
      availableStock: 2,
      maxCapacity: 20,
      reservedStock: 1,
      warehouseLocation: 'DXB-JUMEIRAH-01',
      lastSyncedAt: new Date().toISOString(),
    },
  },
  {
    id: 'prod-fiddle-leaf-fig',
    sku: 'UAE-BOT-004',
    name: 'Fiddle Leaf Fig (Ficus Lyrata - Statement Tree)',
    botanicalName: 'Ficus lyrata',
    subtitle: 'Sculpted single-stem statement tree with broad violin-shaped emerald leaves',
    category: 'air_purifiers',
    categoryLabel: 'Indoor Air Purifiers',
    finderTags: ['air_purifiers'],
    price: 420.0,
    compareAtPrice: 475.0,
    description:
      'The definitive interior designer centerpiece for high-ceiling Dubai living rooms. Grown with a thick, self-supporting trunk and lush upper canopy.',
    careLevel: 'Expert',
    lightRequirement: 'Bright Indirect',
    wateringFrequency: 'Weekly',
    isPetFriendly: false,
    plantSize: 'LargeStatement (120cm+)',
    potIncluded: true,
    defaultSize: 'Large',
    sizeVariants: [
      { size: 'Small', heightLabel: '40–55 cm Bambino', priceDelta: -180, availableStock: 0 },
      { size: 'Medium', heightLabel: '80–100 cm Bush', priceDelta: -90, availableStock: 0 },
      { size: 'Large', heightLabel: '135–160 cm Standard Tree', priceDelta: 0, availableStock: 0 },
    ],
    ceramicSwatches: [
      { id: 'matte_white', name: 'Matte White', hex: '#F5F4F0', availableStock: 5 },
      { id: 'desert_sand', name: 'Desert Sand', hex: '#DECBB1', availableStock: 4 },
      { id: 'charcoal', name: 'Charcoal', hex: '#2C302E', availableStock: 2 },
      { id: 'terracotta', name: 'Terracotta', hex: '#D97757', availableStock: 0 },
    ],
    careGuide: {
      lightLevel: 'Bright Filtered Daylight',
      lightDetail: 'Place beside a bright east- or west-facing window and rotate 90° every month.',
      wateringSchedule: 'Every 7–10 Days',
      wateringDetail: 'Water when top 5 cm of soil dries; never leave standing water in the saucer.',
      uaeClimateTip: 'Avoid Cold Drafts & Sudden Moves',
      uaeClimateDetail: 'Keep at least 2 meters away from ceiling AC diffusers for leaf stability.',
      petToxicity: 'Keep Away from Pets',
      petToxicityDetail: 'Mildly irritating sap if ingested by cats or dogs.',
    },
    materials: ['Standard-Form Ficus Lyrata', 'Artisanal Terracotta Planter', 'Pine Bark Aroid Substrate'],
    dimensions: '135 cm H × 55 cm W',
    weight: '9.8 kg',
    origin: 'Al Barari Nursery, Dubai',
    rating: 4.8,
    reviewCount: 49,
    primaryImage: STUDIO_VISUALS.fiddleFigPrimary,
    secondaryImage: STUDIO_VISUALS.fiddleFigSecondary,
    specs: [
      { label: 'Care Level', value: 'Expert (Consistent Indirect Light)' },
      { label: 'Canopy Height', value: '135 cm Floor-Standing Statement' },
      { label: 'Watering Schedule', value: 'Weekly Measured Soak' },
      { label: 'Planter Included', value: 'Yes — Terracotta Cylinder (32cm)' },
    ],
    inventory: {
      sku: 'UAE-BOT-004',
      availableStock: 0,
      maxCapacity: 12,
      reservedStock: 0,
      warehouseLocation: 'DXB-ALBARARI-01',
      lastSyncedAt: new Date().toISOString(),
      restockEta: 'Next Greenhouse Batch: Nov 14',
    },
  },
  {
    id: 'prod-snake-plant-laurentii',
    sku: 'UAE-BOT-005',
    name: 'Sansevieria Laurentii (Air-Purifying Snake Plant)',
    botanicalName: 'Dracaena trifasciata',
    subtitle: 'Indestructible low-light bedroom oxygenator with golden variegated sword leaves',
    category: 'low_light',
    categoryLabel: 'Survives Low Light',
    finderTags: ['low_light', 'air_purifiers'],
    price: 135.0,
    isBestseller: true,
    description:
      'Releases oxygen at night via CAM photosynthesis while filtering indoor toxins. Thrives effortlessly in shaded hallways, offices, or bedrooms with minimal watering every two weeks.',
    careLevel: 'Easy',
    lightRequirement: 'Low Light',
    wateringFrequency: 'Bi-Weekly',
    isPetFriendly: false,
    plantSize: 'Medium (50-70cm)',
    potIncluded: true,
    defaultSize: 'Medium',
    sizeVariants: [
      { size: 'Small', heightLabel: '25–35 cm Desk Edition', priceDelta: -30, availableStock: 19 },
      { size: 'Medium', heightLabel: '55–70 cm Architectural', priceDelta: 0, availableStock: 19 },
      { size: 'Large', heightLabel: '90–110 cm Floor Column', priceDelta: 85, availableStock: 9 },
    ],
    ceramicSwatches: [
      { id: 'matte_white', name: 'Matte White', hex: '#F5F4F0', availableStock: 18 },
      { id: 'desert_sand', name: 'Desert Sand', hex: '#DECBB1', availableStock: 11 },
      { id: 'charcoal', name: 'Charcoal', hex: '#2C302E', availableStock: 7 },
      { id: 'terracotta', name: 'Terracotta', hex: '#D97757', availableStock: 0 },
    ],
    careGuide: {
      lightLevel: 'Low Light to Bright Indirect',
      lightDetail: 'Thrives in dim hallways, bedrooms, and home offices where other plants struggle.',
      wateringSchedule: 'Every 14–21 Days',
      wateringDetail: 'Let soil dry out 100% between waterings; overwatering is the only risk.',
      uaeClimateTip: 'Thrives in 24/7 UAE Air Conditioning',
      uaeClimateDetail: 'Succulent leaves lock in moisture, making it impervious to dry AC air and summer travel.',
      petToxicity: 'Keep Away from Pets',
      petToxicityDetail: 'Contains saponins; best placed on a plant stand or console if you have pets.',
    },
    materials: ['Variegated Sansevieria', 'Warm Alabaster Ceramic Pot', 'Fast-Draining Mineral Grit'],
    dimensions: '58 cm H × 24 cm W',
    weight: '3.2 kg',
    origin: 'Sharjah Botanical Reserve',
    rating: 5.0,
    reviewCount: 154,
    primaryImage: STUDIO_VISUALS.snakePlantPrimary,
    secondaryImage: STUDIO_VISUALS.snakePlantSecondary,
    specs: [
      { label: 'Care Level', value: 'Easy — Beginner & Travel Proof' },
      { label: 'Light Requirement', value: 'Survives Low Light to Bright Sun' },
      { label: 'Air Purification', value: 'Nighttime O2 Release (Bedroom Ideal)' },
      { label: 'Planter Included', value: 'Yes — Alabaster Ceramic Pot' },
    ],
    inventory: {
      sku: 'UAE-BOT-005',
      availableStock: 19,
      maxCapacity: 25,
      reservedStock: 2,
      warehouseLocation: 'SHJ-BOTANIC-01',
      lastSyncedAt: new Date().toISOString(),
    },
  },
  {
    id: 'prod-self-watering-terracotta',
    sku: 'UAE-POT-006',
    name: 'Handcrafted Matte Terracotta & Ceramic Planter Set',
    botanicalName: 'Artisanal Low-Fired Clay & Travertine',
    subtitle: 'Sub-irrigation porous clay vessels with travertine stone water reservoirs',
    category: 'pots_and_soil',
    categoryLabel: 'Pots & Soil',
    finderTags: ['pots_and_soil', 'pet_safe'],
    price: 185.0,
    description:
      'Engineered specifically for the UAE climate and frequent travelers. The unglazed internal terracotta wall draws water gradually from the travertine base reservoir, keeping roots hydrated for up to 18 days.',
    careLevel: 'Easy',
    lightRequirement: 'Bright Indirect',
    wateringFrequency: 'Bi-Weekly',
    isPetFriendly: true,
    plantSize: 'Small (20-30cm)',
    potIncluded: true,
    defaultSize: 'Medium',
    sizeVariants: [
      { size: 'Small', heightLabel: '18 cm Single Vessel', priceDelta: -45, availableStock: 10 },
      { size: 'Medium', heightLabel: '18 cm + 24 cm Duo Set', priceDelta: 0, availableStock: 6 },
      { size: 'Large', heightLabel: '32 cm Floor Specimen Vessel', priceDelta: 75, availableStock: 3 },
    ],
    ceramicSwatches: [
      { id: 'terracotta', name: 'Terracotta', hex: '#D97757', availableStock: 6 },
      { id: 'desert_sand', name: 'Desert Sand', hex: '#DECBB1', availableStock: 5 },
      { id: 'matte_white', name: 'Matte White', hex: '#F5F4F0', availableStock: 4 },
      { id: 'charcoal', name: 'Charcoal', hex: '#2C302E', availableStock: 0 },
    ],
    careGuide: {
      lightLevel: 'Indoor & Shaded Balcony Ready',
      lightDetail: 'UV-stable natural mineral clay and honed travertine stone reservoir.',
      wateringSchedule: 'Refill Reservoir Every 14–18 Days',
      wateringDetail: 'Porous clay walls release moisture only as plant roots drink.',
      uaeClimateTip: 'Summer Travel Self-Hydration',
      uaeClimateDetail: 'Ideal when leaving Dubai for 2-week holidays without a plant sitter.',
      petToxicity: '100% Safe for Cats & Dogs',
      petToxicityDetail: 'Lead-free, raw mineral terracotta and natural stone.',
    },
    materials: ['Kiln-Fired Terracotta Clay', 'Honed Travertine Base', 'Organic Cotton Sub-Irrigation Wick'],
    dimensions: 'Set of 2: 24cm & 18cm Diameter',
    weight: '3.9 kg',
    origin: 'Fujairah & Milan Studio',
    rating: 4.9,
    reviewCount: 91,
    primaryImage: STUDIO_VISUALS.terracottaPotPrimary,
    secondaryImage: STUDIO_VISUALS.terracottaPotSecondary,
    specs: [
      { label: 'Reservoir Autonomy', value: 'Up to 18 Days Self-Hydrating' },
      { label: 'Material', value: 'Breathable Porous Terracotta & Stone' },
      { label: 'Included Sizes', value: 'Medium (24cm) + Small (18cm) Duo' },
      { label: 'Drainage System', value: 'Capillary Osmosis + Overflow Guard' },
    ],
    inventory: {
      sku: 'UAE-POT-006',
      availableStock: 6,
      maxCapacity: 25,
      reservedStock: 2,
      warehouseLocation: 'DXB-ALQUOZ-01',
      lastSyncedAt: new Date().toISOString(),
    },
  },
  {
    id: 'prod-zz-raven-emerald',
    sku: 'UAE-BOT-007',
    name: 'ZZ Raven & Emerald Plant (Low-Light Survivor)',
    botanicalName: 'Zamioculcas zamiifolia',
    subtitle: 'Architectural waxy obsidian-and-emerald fronds that thrive in windowless corners',
    category: 'low_light',
    categoryLabel: 'Survives Low Light',
    finderTags: ['low_light', 'air_purifiers', 'uae_heat_tolerant'],
    price: 210.0,
    description:
      'Water-storing underground rhizomes make the ZZ Raven & Emerald pair virtually drought-proof. New shoots emerge vibrant lime-green before maturing into deep glossy emerald and midnight purple-black.',
    careLevel: 'Easy',
    lightRequirement: 'Low Light',
    wateringFrequency: 'Bi-Weekly',
    isPetFriendly: false,
    plantSize: 'Medium (50-70cm)',
    potIncluded: true,
    defaultSize: 'Medium',
    sizeVariants: [
      { size: 'Small', heightLabel: '30–40 cm Desk Specimen', priceDelta: -50, availableStock: 12 },
      { size: 'Medium', heightLabel: '55–70 cm Sculptural', priceDelta: 0, availableStock: 14 },
      { size: 'Large', heightLabel: '85–100 cm Statement', priceDelta: 95, availableStock: 5 },
    ],
    ceramicSwatches: [
      { id: 'desert_sand', name: 'Desert Sand', hex: '#DECBB1', availableStock: 10 },
      { id: 'matte_white', name: 'Matte White', hex: '#F5F4F0', availableStock: 8 },
      { id: 'charcoal', name: 'Charcoal', hex: '#2C302E', availableStock: 4 },
      { id: 'terracotta', name: 'Terracotta', hex: '#D97757', availableStock: 0 },
    ],
    careGuide: {
      lightLevel: 'Low Light to Bright Indirect',
      lightDetail: 'Performs beautifully in interior rooms, corridors, and offices with ambient lighting.',
      wateringSchedule: 'Every 14–21 Days',
      wateringDetail: 'Rhizomes store water for weeks; allow potting mix to dry completely before watering.',
      uaeClimateTip: 'Zero AC Stress & Holiday Proof',
      uaeClimateDetail: 'Waxy cuticle prevents moisture loss even in 20°C air-conditioned villas.',
      petToxicity: 'Keep Away from Pets',
      petToxicityDetail: 'All parts are mildly toxic if chewed; place on a console or elevated stand.',
    },
    materials: ['Zamioculcas Zamiifolia Specimen', 'Matte Stoneware Cylinder', 'Succulent & Bark Drainage Mix'],
    dimensions: '60 cm H × 38 cm W',
    weight: '4.4 kg',
    origin: 'Al Barari Nursery, Dubai',
    rating: 4.9,
    reviewCount: 84,
    primaryImage: STUDIO_VISUALS.zzPlantPrimary,
    secondaryImage: STUDIO_VISUALS.zzPlantSecondary,
    specs: [
      { label: 'Light Resilience', value: 'Ultra Low-Light & Office Tolerant' },
      { label: 'Drought Tolerance', value: 'Rhizome Bulbs Store Water for 3 Weeks' },
      { label: 'Foliage Finish', value: 'Natural High-Gloss Emerald & Raven' },
      { label: 'Planter Included', value: 'Yes — Matte Stoneware Planter' },
    ],
    inventory: {
      sku: 'UAE-BOT-007',
      availableStock: 14,
      maxCapacity: 25,
      reservedStock: 1,
      warehouseLocation: 'DXB-ALBARARI-01',
      lastSyncedAt: new Date().toISOString(),
    },
  },
  {
    id: 'prod-phalaenopsis-orchid',
    sku: 'UAE-BOT-008',
    name: 'White Phalaenopsis Orchid in Ceramic Pot',
    botanicalName: 'Phalaenopsis amabilis',
    subtitle: 'Double-spike cascading white moth orchid presented in a handcrafted ceramic vessel',
    category: 'pet_safe',
    categoryLabel: 'Pet Safe',
    finderTags: ['pet_safe', 'pots_and_soil', 'air_purifiers'],
    price: 265.0,
    isBestseller: true,
    description:
      'Grown in our climate-controlled Jumeirah orchid house for long-lasting 3-month blooms. 100% pet-safe and potted in premium New Zealand pine bark and sphagnum moss inside a sculpted ceramic vessel.',
    careLevel: 'Easy',
    lightRequirement: 'Bright Indirect',
    wateringFrequency: 'Weekly',
    isPetFriendly: true,
    plantSize: 'Medium (50-70cm)',
    potIncluded: true,
    defaultSize: 'Medium',
    sizeVariants: [
      { size: 'Small', heightLabel: '35–45 cm Single Spike', priceDelta: -55, availableStock: 11 },
      { size: 'Medium', heightLabel: '55–68 cm Double Spike', priceDelta: 0, availableStock: 16 },
      { size: 'Large', heightLabel: '75–90 cm Triple Cascade', priceDelta: 120, availableStock: 7 },
    ],
    ceramicSwatches: [
      { id: 'matte_white', name: 'Matte White', hex: '#F5F4F0', availableStock: 14 },
      { id: 'desert_sand', name: 'Desert Sand', hex: '#DECBB1', availableStock: 9 },
      { id: 'terracotta', name: 'Terracotta', hex: '#D97757', availableStock: 5 },
      { id: 'charcoal', name: 'Charcoal', hex: '#2C302E', availableStock: 0 },
    ],
    careGuide: {
      lightLevel: 'Bright Filtered Indoor Light',
      lightDetail: 'Ideal on dining tables, reception consoles, or bright bathroom vanities.',
      wateringSchedule: 'Every 7 Days (1/3 Cup)',
      wateringDetail: 'Pour 80ml of room-temperature water over the bark roots once weekly; never use ice cubes.',
      uaeClimateTip: 'Loves 21°C–25°C UAE Indoor Temperatures',
      uaeClimateDetail: 'Indoor air-conditioned UAE homes mirror the cool highland temperatures orchids need to stay in bloom.',
      petToxicity: '100% Safe for Cats & Dogs',
      petToxicityDetail: 'ASPCA verified non-toxic flower spikes and leaves.',
    },
    materials: ['Double-Spike White Phalaenopsis', 'Hand-Glazed Ceramic Cachepot', 'NZ Pine Bark & Sphagnum'],
    dimensions: '62 cm H × 30 cm W',
    weight: '2.6 kg',
    origin: 'Jumeirah Orchid Conservatory, Dubai',
    rating: 5.0,
    reviewCount: 93,
    primaryImage: STUDIO_VISUALS.orchidPrimary,
    secondaryImage: STUDIO_VISUALS.orchidSecondary,
    specs: [
      { label: 'Bloom Longevity', value: '8 to 12 Weeks of Continuous Blooms' },
      { label: 'Pet Safety', value: '100% Non-Toxic (Cat & Dog Safe)' },
      { label: 'Substrate', value: 'Aerated Orchid Bark & Sphagnum Moss' },
      { label: 'Planter Included', value: 'Yes — Sculpted Ceramic Pot' },
    ],
    inventory: {
      sku: 'UAE-BOT-008',
      availableStock: 16,
      maxCapacity: 30,
      reservedStock: 2,
      warehouseLocation: 'DXB-JUMEIRAH-01',
      lastSyncedAt: new Date().toISOString(),
    },
  },
];

function loadSimulatedDatabase(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVENTORY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(raw) as Product[];
    if (
      Array.isArray(parsed) &&
      parsed.length === INITIAL_PRODUCTS.length &&
      parsed[0]?.sizeVariants
    ) {
      return parsed;
    }
  } catch {
    // Fallback to initial products
  }
  return INITIAL_PRODUCTS;
}

function saveSimulatedDatabase(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(products));
  } catch {
    // Ignore storage write errors
  }
}

/**
 * Spring Boot REST Endpoint Wrapper:
 * GET /api/v1/products
 */
export async function fetchProducts(): Promise<Product[]> {
  if (IS_REMOTE_BACKEND_CONFIGURED) {
    try {
      const response = await apiClient.get<SpringBootApiResponse<Product[]>>('/products');
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch {
      // Fallback to local simulated Spring Boot Inventory state
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 120));
  return loadSimulatedDatabase();
}

/**
 * Spring Boot REST Endpoint Wrapper:
 * PATCH /api/v1/inventory/{sku}
 * Used for real-time inventory simulation & backend stock mutations.
 */
export async function updateProductStock(
  productId: string,
  newAvailableStock: number
): Promise<Product> {
  const safeStock = Math.max(0, Math.floor(newAvailableStock));
  if (IS_REMOTE_BACKEND_CONFIGURED) {
    try {
      const response = await apiClient.patch<SpringBootApiResponse<Product>>(
        `/inventory/${productId}`,
        { availableStock: safeStock }
      );
      if (response.data?.data) {
        return response.data.data;
      }
    } catch {
      // Local Spring Boot Inventory fallback
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 100));
  const current = loadSimulatedDatabase();
  let updatedProduct: Product | undefined;

  const next = current.map((item) => {
    if (item.id === productId) {
      updatedProduct = {
        ...item,
        inventory: {
          ...item.inventory,
          availableStock: safeStock,
          lastSyncedAt: new Date().toISOString(),
        },
      };
      return updatedProduct;
    }
    return item;
  });

  saveSimulatedDatabase(next);
  if (!updatedProduct) {
    throw new Error(`Product ${productId} not found`);
  }
  return updatedProduct;
}

/**
 * Spring Boot REST Endpoint Wrapper:
 * POST /api/v1/inventory/reset
 */
export async function resetInventoryToDefaults(): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  saveSimulatedDatabase(INITIAL_PRODUCTS);
  return INITIAL_PRODUCTS;
}

/**
 * Spring Boot REST Endpoint Wrapper:
 * POST /api/v1/inventory/{sku}/restock-notifications
 */
export async function subscribeRestockNotification(
  productId: string,
  sku: string,
  email: string
): Promise<{ productId: string; sku: string; email: string; subscribedAt: string }> {
  if (IS_REMOTE_BACKEND_CONFIGURED) {
    try {
      const response = await apiClient.post(
        `/inventory/${sku}/restock-notifications`,
        { productId, email }
      );
      if (response.data?.data) {
        return response.data.data;
      }
    } catch {
      // Fallback to simulated response
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 160));
  return {
    productId,
    sku,
    email,
    subscribedAt: new Date().toISOString(),
  };
}

/**
 * Spring Boot REST Endpoint Wrapper:
 * POST /api/v1/orders
 * Atomically decrements inventory and creates a UAE OrderConfirmation receipt with 5% VAT.
 */
export async function submitOrder(payload: OrderPayload): Promise<OrderConfirmation> {
  if (IS_REMOTE_BACKEND_CONFIGURED) {
    try {
      const response = await apiClient.post<SpringBootApiResponse<OrderConfirmation>>(
        '/orders',
        payload
      );
      if (response.data?.data) {
        return response.data.data;
      }
    } catch {
      // Local Spring Boot Order & Inventory transaction simulation
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 280));
  const current = loadSimulatedDatabase();
  const orderItems: OrderConfirmation['items'] = [];

  const updatedProducts = current.map((product) => {
    const lineItem = payload.items.find(
      (i) => i.productId === product.id || i.productId.startsWith(`${product.id}__`)
    );
    if (!lineItem) return product;

    const updated: Product = {
      ...product,
      inventory: {
        ...product.inventory,
        availableStock: Math.max(
          0,
          product.inventory.availableStock - lineItem.quantity
        ),
        lastSyncedAt: new Date().toISOString(),
      },
    };
    orderItems.push({ product: updated, quantity: lineItem.quantity });
    return updated;
  });

  saveSimulatedDatabase(updatedProducts);

  const subtotal = Number(
    payload.items
      .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      .toFixed(2)
  );
  const shippingCost =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : UAE_STANDARD_DELIVERY_FEE;
  const codFee = payload.paymentMethodId === 'cod' ? 15 : 0;
  const tax = Number((subtotal * UAE_VAT_RATE).toFixed(2));
  const total = Number((subtotal + shippingCost + tax + codFee).toFixed(2));

  return {
    orderId: `UAE-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: new Date().toISOString(),
    estimatedDelivery: payload.deliverySlotLabel,
    deliverySlotLabel: payload.deliverySlotLabel,
    paymentMethodLabel: payload.paymentMethodLabel,
    uaeMobile: payload.uaeMobile,
    emirate: payload.emirate,
    areaCommunity: payload.areaCommunity,
    villaBuildingName: payload.villaBuildingName,
    subtotal,
    shippingCost,
    codFee,
    tax,
    total,
    items: orderItems,
    shippingAddress: `${payload.villaBuildingName}, ${payload.areaCommunity}, ${payload.emirate}, UAE`,
  };
}

