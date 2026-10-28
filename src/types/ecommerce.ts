export type CategoryId =
  | 'all'
  | 'air_purifiers'
  | 'pet_safe'
  | 'low_light'
  | 'uae_heat_tolerant'
  | 'pots_and_soil';

export type CareLevel = 'Easy' | 'Moderate' | 'Expert';
export type LightRequirement = 'Low Light' | 'Bright Indirect' | 'Full UAE Sun';
export type WateringFrequency = 'Weekly' | 'Bi-Weekly' | 'Mist Daily';
export type PlantSize =
  | 'Small (20-30cm)'
  | 'Medium (50-70cm)'
  | 'LargeStatement (120cm+)';

export type SizeVariantKey = 'Small' | 'Medium' | 'Large';
export type PotOptionType = 'nursery_plastic' | 'ceramic_planter';
export type CeramicColorId =
  | 'matte_white'
  | 'desert_sand'
  | 'charcoal'
  | 'terracotta';

export interface SizeVariantOption {
  size: SizeVariantKey;
  heightLabel: string;
  priceDelta: number; // Relative to base product price (in AED)
  availableStock: number;
}

export interface CeramicSwatchOption {
  id: CeramicColorId;
  name: 'Matte White' | 'Desert Sand' | 'Charcoal' | 'Terracotta';
  hex: string;
  availableStock: number;
}

export interface PlantCareGuide {
  lightLevel: string;
  lightDetail: string;
  wateringSchedule: string;
  wateringDetail: string;
  uaeClimateTip: string;
  uaeClimateDetail: string;
  petToxicity: string;
  petToxicityDetail: string;
}

export type StockTier = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryInfo {
  sku: string;
  availableStock: number;
  maxCapacity: number;
  reservedStock: number;
  warehouseLocation: string;
  lastSyncedAt: string;
  restockEta?: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  botanicalName: string;
  subtitle: string;
  category: Exclude<CategoryId, 'all'>;
  categoryLabel: string;
  finderTags: Array<Exclude<CategoryId, 'all'>>;
  price: number;
  compareAtPrice?: number;
  isBestseller?: boolean;
  description: string;
  // Required Nursery-Specific Attributes
  careLevel: CareLevel;
  lightRequirement: LightRequirement;
  wateringFrequency: WateringFrequency;
  isPetFriendly: boolean;
  plantSize: PlantSize;
  potIncluded: boolean;
  // PDP Variant & Care Guide Extensions
  defaultSize?: SizeVariantKey;
  sizeVariants?: SizeVariantOption[];
  ceramicSwatches?: CeramicSwatchOption[];
  careGuide?: PlantCareGuide;
  materials: string[];
  dimensions: string;
  weight: string;
  origin: string;
  rating: number;
  reviewCount: number;
  featuredBento?: 'primary' | 'secondary' | 'tertiary';
  primaryImage: string;
  secondaryImage: string;
  specs: ProductSpec[];
  inventory: InventoryInfo;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  tier: 'Botanical Patron' | 'Landscape Partner';
  token: string;
}

export interface SpringBootApiResponse<T> {
  status: 'SUCCESS' | 'ERROR';
  timestamp: string;
  data: T;
  message?: string;
}

export type UaeEmirate =
  | 'Dubai'
  | 'Abu Dhabi'
  | 'Sharjah'
  | 'Ajman'
  | 'Ras Al Khaimah'
  | 'Fujairah'
  | 'Umm Al Quwain';

export type DeliverySlotId = 'morning_chilled_van' | 'evening_slot';

export type UaePaymentMethodId =
  | 'card'
  | 'apple_pay'
  | 'tabby_tamara'
  | 'cod';

export interface OrderPayload {
  customerName: string;
  customerEmail: string;
  uaeMobile: string; // Normalized +971 5X XXX XXXX
  emirate: UaeEmirate;
  areaCommunity: string; // e.g., Downtown Dubai, Dubai Marina, Al Reem Island
  villaBuildingName: string; // e.g., Villa 18 or Marina Gate Tower 1
  deliverySlotId: DeliverySlotId;
  deliverySlotLabel: string;
  paymentMethodId: UaePaymentMethodId;
  paymentMethodLabel: string;
  codFee?: number;
  items: Array<{
    productId: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface OrderConfirmation {
  orderId: string;
  createdAt: string;
  estimatedDelivery: string;
  deliverySlotLabel: string;
  paymentMethodLabel: string;
  uaeMobile: string;
  emirate: UaeEmirate;
  areaCommunity: string;
  villaBuildingName: string;
  subtotal: number;
  shippingCost: number;
  codFee: number;
  tax: number;
  total: number;
  items: CartItem[];
  shippingAddress: string;
}

