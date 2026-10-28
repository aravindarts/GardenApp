import {
  CartItem,
  CategoryId,
  CeramicColorId,
  CeramicSwatchOption,
  PotOptionType,
  Product,
  SizeVariantKey,
  SizeVariantOption,
  StockTier,
} from '../types/ecommerce';

export const FREE_SHIPPING_THRESHOLD = 200; // AED 200 for Free Express Dubai/UAE Delivery
export const LOW_STOCK_THRESHOLD = 10;
export const UAE_VAT_RATE = 0.05; // 5% UAE VAT
export const UAE_STANDARD_DELIVERY_FEE = 25; // AED 25.00 standard chilled van delivery
export const CERAMIC_PLANTER_UPGRADE_PRICE = 45; // +AED 45.00 for Ceramic Planter upgrade

export interface StockPresentation {
  tier: StockTier;
  badgeText: string;
  canPurchase: boolean;
  ctaLabel: string;
  stockPercentage: number;
}

/**
 * Computes the inventory presentation model according to the backend stock integer:
 * - stock > 10: 'IN_STOCK' ("In Stock - Ready to Ship")
 * - 1 <= stock <= 10: 'LOW_STOCK' ("Low Stock - Only {stock} left!") + progress bar
 * - stock === 0: 'OUT_OF_STOCK' ("Out of Stock") + "Notify Me When Available"
 */
export function getStockPresentation(
  availableStock: number,
  maxCapacity: number = 25
): StockPresentation {
  const safeStock = Math.max(0, Math.floor(availableStock));
  const safeMax = Math.max(safeStock, maxCapacity, 10);

  if (safeStock === 0) {
    return {
      tier: 'OUT_OF_STOCK',
      badgeText: 'Out of Stock',
      canPurchase: false,
      ctaLabel: 'Notify Me When Available',
      stockPercentage: 0,
    };
  }

  if (safeStock <= LOW_STOCK_THRESHOLD) {
    const pct = Math.min(
      100,
      Math.max(8, Math.round((safeStock / LOW_STOCK_THRESHOLD) * 100))
    );
    return {
      tier: 'LOW_STOCK',
      badgeText: `Low Stock - Only ${safeStock} left!`,
      canPurchase: true,
      ctaLabel: 'Add to Bag',
      stockPercentage: pct,
    };
  }

  return {
    tier: 'IN_STOCK',
    badgeText: 'In Stock - Ready to Ship',
    canPurchase: true,
    ctaLabel: 'Add to Bag',
    stockPercentage: Math.min(100, Math.round((safeStock / safeMax) * 100)),
  };
}

export interface VariantResolution {
  unitPrice: number;
  compareAtPrice?: number;
  effectiveAvailableStock: number;
  sizeOption: SizeVariantOption;
  selectedSwatch?: CeramicSwatchOption;
  variantSummaryLabel: string;
}

/**
 * Resolves the dynamic AED price and effective availableStock for a selected
 * Plant Size + Pot Option (Nursery Plastic Pot Included vs Ceramic Planter +AED 45).
 * Effective stock is the minimum of the plant size stock and (if ceramic selected) the ceramic color swatch stock.
 */
export function resolveProductVariantPricingAndStock(
  product: Product,
  selectedSize: SizeVariantKey,
  potOption: PotOptionType,
  ceramicColorId: CeramicColorId
): VariantResolution {
  const defaultVariants: SizeVariantOption[] = product.sizeVariants || [
    {
      size: 'Small',
      heightLabel: '25–35 cm',
      priceDelta: -35,
      availableStock: Math.max(0, product.inventory.availableStock),
    },
    {
      size: 'Medium',
      heightLabel: '55–75 cm',
      priceDelta: 0,
      availableStock: Math.max(0, product.inventory.availableStock),
    },
    {
      size: 'Large',
      heightLabel: '115–140 cm',
      priceDelta: 95,
      availableStock: Math.max(0, Math.floor(product.inventory.availableStock / 2)),
    },
  ];

  const sizeOption =
    defaultVariants.find((v) => v.size === selectedSize) || defaultVariants[1];

  const defaultSwatches: CeramicSwatchOption[] = product.ceramicSwatches || [
    { id: 'matte_white', name: 'Matte White', hex: '#F5F4F0', availableStock: 14 },
    { id: 'desert_sand', name: 'Desert Sand', hex: '#DECBB1', availableStock: 9 },
    { id: 'charcoal', name: 'Charcoal', hex: '#2C302E', availableStock: 6 },
    { id: 'terracotta', name: 'Terracotta', hex: '#D97757', availableStock: 0 },
  ];

  const selectedSwatch =
    defaultSwatches.find((s) => s.id === ceramicColorId) || defaultSwatches[0];

  const potUpgradeDelta =
    potOption === 'ceramic_planter' ? CERAMIC_PLANTER_UPGRADE_PRICE : 0;

  const unitPrice = Math.max(
    25,
    Number((product.price + sizeOption.priceDelta + potUpgradeDelta).toFixed(2))
  );

  const compareAtPrice = product.compareAtPrice
    ? Math.max(
        unitPrice + 20,
        Number(
          (
            product.compareAtPrice +
            sizeOption.priceDelta +
            potUpgradeDelta
          ).toFixed(2)
        )
      )
    : undefined;

  // If overall product stock was set to 0 in simulator, effective stock is 0
  if (product.inventory.availableStock === 0) {
    return {
      unitPrice,
      compareAtPrice,
      effectiveAvailableStock: 0,
      sizeOption: { ...sizeOption, availableStock: 0 },
      selectedSwatch,
      variantSummaryLabel:
        potOption === 'ceramic_planter'
          ? `${sizeOption.size} (${sizeOption.heightLabel}) · ${selectedSwatch.name} Ceramic Planter`
          : `${sizeOption.size} (${sizeOption.heightLabel}) · Nursery Plastic Pot`,
    };
  }

  const effectiveAvailableStock =
    potOption === 'ceramic_planter'
      ? Math.min(sizeOption.availableStock, selectedSwatch.availableStock)
      : sizeOption.availableStock;

  const variantSummaryLabel =
    potOption === 'ceramic_planter'
      ? `${sizeOption.size} (${sizeOption.heightLabel}) · ${selectedSwatch.name} Ceramic Planter (+AED 45)`
      : `${sizeOption.size} (${sizeOption.heightLabel}) · Nursery Plastic Pot`;

  return {
    unitPrice,
    compareAtPrice,
    effectiveAvailableStock,
    sizeOption,
    selectedSwatch,
    variantSummaryLabel,
  };
}

export interface QuantityGuardResult {
  allowedQuantity: number;
  wasClamped: boolean;
  reason?: 'OUT_OF_STOCK' | 'MAX_STOCK_REACHED' | 'MIN_QUANTITY';
}

/**
 * Quantity Guard: Never allow the user to increment cart or product quantity
 * beyond the availableStock integer returned by the backend.
 */
export function evaluateQuantityGuard(
  requestedQuantity: number,
  availableStock: number
): QuantityGuardResult {
  const safeStock = Math.max(0, Math.floor(availableStock));
  const desired = Math.floor(requestedQuantity);

  if (safeStock === 0) {
    return {
      allowedQuantity: 0,
      wasClamped: true,
      reason: 'OUT_OF_STOCK',
    };
  }

  if (desired < 1) {
    return {
      allowedQuantity: 1,
      wasClamped: true,
      reason: 'MIN_QUANTITY',
    };
  }

  if (desired > safeStock) {
    return {
      allowedQuantity: safeStock,
      wasClamped: true,
      reason: 'MAX_STOCK_REACHED',
    };
  }

  return {
    allowedQuantity: desired,
    wasClamped: false,
  };
}

export interface FreeShippingSummary {
  subtotal: number;
  threshold: number;
  remainingForFreeShipping: number;
  progressPercent: number;
  isUnlocked: boolean;
  shippingCost: number;
  vatAmount: number;
  totalWithVat: number;
}

export const COD_SURCHARGE_AED = 15; // +AED 15.00 for Cash on Delivery

export const UAE_EMIRATES_LIST = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
] as const;

export const UAE_DELIVERY_SLOTS = [
  {
    id: 'morning_chilled_van' as const,
    label: 'Next-Day Morning Chilled Van (9 AM - 1 PM)',
    badge: '18°C Climate-Controlled Van',
    description:
      'Ideal for indoor tropicals & large statement trees before midday Gulf heat.',
  },
  {
    id: 'evening_slot' as const,
    label: 'Next-Day Evening Slot (4 PM - 8 PM)',
    badge: 'Sunset Residential Dispatch',
    description:
      'Convenient after-work delivery to Dubai, Abu Dhabi & Sharjah villas and towers.',
  },
] as const;

export const UAE_PAYMENT_OPTIONS = [
  {
    id: 'card' as const,
    label: 'Credit/Debit Card',
    subtitle: 'Visa, Mastercard, American Express · 3D Secure UAE',
    feeAed: 0,
  },
  {
    id: 'apple_pay' as const,
    label: 'Apple Pay',
    subtitle: 'Instant biometric Face ID / Touch ID checkout in AED',
    feeAed: 0,
  },
  {
    id: 'tabby_tamara' as const,
    label: 'Tabby / Tamara (Split in 4 interest-free AED payments)',
    subtitle: '0% interest · No late fees · Shariah-compliant',
    feeAed: 0,
  },
  {
    id: 'cod' as const,
    label: 'Cash on Delivery (+AED 15)',
    subtitle: 'Pay in AED cash or card machine upon chilled van arrival',
    feeAed: COD_SURCHARGE_AED,
  },
] as const;

/**
 * Validates and formats a UAE mobile number with +971 prefix.
 * Accepts local subscriber digits (e.g. "50 123 4567", "0501234567", or "+971501234567").
 * Valid UAE mobile prefixes: 50, 52, 54, 55, 56, 58 followed by 7 digits.
 */
export function validateUaeMobileNumber(rawInput: string): {
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  const digitsOnly = rawInput.replace(/\D/g, '');
  let subscriber = digitsOnly;

  if (subscriber.startsWith('00971')) {
    subscriber = subscriber.slice(5);
  } else if (subscriber.startsWith('971')) {
    subscriber = subscriber.slice(3);
  }

  if (subscriber.startsWith('0')) {
    subscriber = subscriber.slice(1);
  }

  const validPattern = /^(50|52|54|55|56|58)\d{7}$/;
  if (!validPattern.test(subscriber)) {
    return {
      isValid: false,
      normalized: rawInput.trim(),
      error:
        'Enter a valid 9-digit UAE mobile number after +971 (e.g., 50 123 4567).',
    };
  }

  const formatted = `+971 ${subscriber.slice(0, 2)} ${subscriber.slice(
    2,
    5
  )} ${subscriber.slice(5)}`;
  return {
    isValid: true,
    normalized: formatted,
  };
}

export interface CheckoutBreakdown extends FreeShippingSummary {
  codFee: number;
  finalTotalWithVatAndCod: number;
  splitInFourInstallmentAed: number;
}

/**
 * Calculates cart subtotal, dynamic Free Shipping Progress Bar state (AED 200 threshold),
 * standard UAE 5% VAT breakdown, optional Cash on Delivery (+AED 15), and Tabby/Tamara 4x split.
 */
export function calculateFreeShippingSummary(
  items: CartItem[],
  threshold: number = FREE_SHIPPING_THRESHOLD
): FreeShippingSummary {
  const subtotal = Number(
    items
      .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      .toFixed(2)
  );
  const remaining = Number(Math.max(0, threshold - subtotal).toFixed(2));
  const progressPercent =
    threshold <= 0
      ? 100
      : Math.min(100, Math.round((subtotal / threshold) * 100));
  const isUnlocked = subtotal >= threshold && subtotal > 0;
  const shippingCost =
    subtotal === 0 || isUnlocked ? 0 : UAE_STANDARD_DELIVERY_FEE;
  const vatAmount = Number((subtotal * UAE_VAT_RATE).toFixed(2));
  const totalWithVat = Number((subtotal + shippingCost + vatAmount).toFixed(2));

  return {
    subtotal,
    threshold,
    remainingForFreeShipping: remaining,
    progressPercent,
    isUnlocked,
    shippingCost,
    vatAmount,
    totalWithVat,
  };
}

export function calculateCheckoutBreakdown(
  items: CartItem[],
  paymentMethodId: 'card' | 'apple_pay' | 'tabby_tamara' | 'cod'
): CheckoutBreakdown {
  const base = calculateFreeShippingSummary(items);
  const codFee =
    base.subtotal > 0 && paymentMethodId === 'cod' ? COD_SURCHARGE_AED : 0;
  const finalTotalWithVatAndCod = Number(
    (base.totalWithVat + codFee).toFixed(2)
  );
  const splitInFourInstallmentAed = Number(
    (finalTotalWithVatAndCod / 4).toFixed(2)
  );

  return {
    ...base,
    codFee,
    finalTotalWithVatAndCod,
    splitInFourInstallmentAed,
  };
}

/**
 * Matches a product against a Plant Finder quick-filter category.
 */
export function matchesPlantFinderCategory(
  product: Product,
  category: CategoryId
): boolean {
  if (category === 'all') return true;
  if (product.category === category || product.finderTags.includes(category)) {
    return true;
  }
  if (
    category === 'pet_safe' &&
    product.isPetFriendly &&
    product.category !== 'pots_and_soil'
  ) {
    return true;
  }
  if (category === 'low_light' && product.lightRequirement === 'Low Light') {
    return true;
  }
  if (
    category === 'uae_heat_tolerant' &&
    product.lightRequirement === 'Full UAE Sun'
  ) {
    return true;
  }
  return false;
}

/**
 * Filters and sorts products based on Plant Finder category, search query, stock filter, and sort order.
 */
export function filterAndSortProducts(
  products: Product[],
  options: {
    category: CategoryId;
    searchQuery: string;
    stockFilter?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
    sortBy?: 'featured' | 'price_asc' | 'price_desc' | 'stock_asc';
  }
): Product[] {
  const normalizedQuery = options.searchQuery.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (!matchesPlantFinderCategory(product, options.category)) {
      return false;
    }

    if (options.stockFilter && options.stockFilter !== 'all') {
      const stock = product.inventory.availableStock;
      if (options.stockFilter === 'in_stock' && stock === 0) return false;
      if (
        options.stockFilter === 'low_stock' &&
        (stock < 1 || stock > LOW_STOCK_THRESHOLD)
      ) {
        return false;
      }
      if (options.stockFilter === 'out_of_stock' && stock !== 0) return false;
    }

    if (normalizedQuery.length > 0) {
      const haystack = [
        product.name,
        product.botanicalName,
        product.subtitle,
        product.sku,
        product.categoryLabel,
        product.description,
        product.careLevel,
        product.lightRequirement,
        product.wateringFrequency,
        product.plantSize,
        product.isPetFriendly ? 'pet friendly pet safe cat dog' : '',
        ...product.materials,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];
  switch (options.sortBy) {
    case 'price_asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'stock_asc':
      sorted.sort(
        (a, b) => a.inventory.availableStock - b.inventory.availableStock
      );
      break;
    case 'featured':
    default:
      break;
  }

  return sorted;
}
