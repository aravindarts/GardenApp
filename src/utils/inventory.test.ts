import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getStockPresentation,
  evaluateQuantityGuard,
  calculateFreeShippingSummary,
  calculateCheckoutBreakdown,
  validateUaeMobileNumber,
  filterAndSortProducts,
  resolveProductVariantPricingAndStock,
  FREE_SHIPPING_THRESHOLD,
} from './inventory';
import { formatCurrency } from '../lib/utils';
import { buildProductGalleryImages } from './studioVisuals';
import { Product } from '../types/ecommerce';

const mockPlant = (overrides: Partial<Product> = {}): Product => ({
  id: 'plant-1',
  sku: 'UAE-PLT-001',
  name: 'Monstera Deliciosa',
  botanicalName: 'Monstera deliciosa',
  subtitle: 'Fenestrated tropical statement plant in matte sand ceramic pot',
  category: 'air_purifiers',
  categoryLabel: 'Indoor Air Purifiers',
  finderTags: ['air_purifiers'],
  price: 245,
  description: 'Lush architectural Swiss Cheese Plant acclimated for UAE interiors.',
  careLevel: 'Easy',
  lightRequirement: 'Bright Indirect',
  wateringFrequency: 'Weekly',
  isPetFriendly: false,
  plantSize: 'Medium (50-70cm)',
  potIncluded: true,
  sizeVariants: [
    { size: 'Small', heightLabel: '30–40 cm', priceDelta: -50, availableStock: 14 },
    { size: 'Medium', heightLabel: '60–75 cm', priceDelta: 0, availableStock: 22 },
    { size: 'Large', heightLabel: '120–140 cm', priceDelta: 130, availableStock: 5 },
  ],
  ceramicSwatches: [
    { id: 'matte_white', name: 'Matte White', hex: '#F5F4F0', availableStock: 12 },
    { id: 'desert_sand', name: 'Desert Sand', hex: '#DECBB1', availableStock: 8 },
    { id: 'charcoal', name: 'Charcoal', hex: '#2C302E', availableStock: 3 },
    { id: 'terracotta', name: 'Terracotta', hex: '#D97757', availableStock: 0 },
  ],
  materials: ['Organic Aroid Mix', 'Hand-Thrown Sand Ceramic Pot'],
  dimensions: '65cm H × 45cm W',
  weight: '4.2 kg',
  origin: 'Al Barari Greenhouse, Dubai',
  rating: 4.9,
  reviewCount: 84,
  primaryImage: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=900&q=85',
  secondaryImage: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=900&q=85',
  specs: [],
  inventory: {
    sku: 'UAE-PLT-001',
    availableStock: 22,
    maxCapacity: 25,
    reservedStock: 2,
    warehouseLocation: 'DUBAI-ALQUOZ-01',
    lastSyncedAt: new Date().toISOString(),
  },
  ...overrides,
});

test('formatCurrency formats numbers as AED XX.XX using en-AE locale', () => {
  const formatted = formatCurrency(185.5);
  assert.ok(formatted.includes('AED'), `Expected AED in "${formatted}"`);
  assert.ok(formatted.includes('185.50'), `Expected 185.50 in "${formatted}"`);
});

test('resolveProductVariantPricingAndStock computes size delta, +AED 45 ceramic upgrade, and stock intersections', () => {
  const plant = mockPlant();

  // Medium + Nursery Plastic Pot (Included) -> AED 245, stock 22
  const baseMed = resolveProductVariantPricingAndStock(
    plant,
    'Medium',
    'nursery_plastic',
    'matte_white'
  );
  assert.equal(baseMed.unitPrice, 245);
  assert.equal(baseMed.effectiveAvailableStock, 22);

  // Large (+130) + Ceramic Planter (+45) in Desert Sand (stock 8 vs Large stock 5 -> min is 5)
  const largeCeramic = resolveProductVariantPricingAndStock(
    plant,
    'Large',
    'ceramic_planter',
    'desert_sand'
  );
  assert.equal(largeCeramic.unitPrice, 245 + 130 + 45); // AED 420
  assert.equal(largeCeramic.effectiveAvailableStock, 5);

  // Medium + Out-of-Stock Terracotta Ceramic Planter (stock 0) -> effective stock 0
  const outOfStockSwatch = resolveProductVariantPricingAndStock(
    plant,
    'Medium',
    'ceramic_planter',
    'terracotta'
  );
  assert.equal(outOfStockSwatch.unitPrice, 290);
  assert.equal(outOfStockSwatch.effectiveAvailableStock, 0);
});

test('getStockPresentation classifies >10, 1..10, and 0 stock tiers accurately', () => {
  const highStock = getStockPresentation(18, 25);
  assert.equal(highStock.tier, 'IN_STOCK');
  assert.equal(highStock.badgeText, 'In Stock - Ready to Ship');
  assert.equal(highStock.canPurchase, true);

  const lowStock = getStockPresentation(4, 25);
  assert.equal(lowStock.tier, 'LOW_STOCK');
  assert.equal(lowStock.badgeText, 'Low Stock - Only 4 left!');
  assert.equal(lowStock.canPurchase, true);
  assert.equal(lowStock.stockPercentage, 40);

  const zeroStock = getStockPresentation(0, 25);
  assert.equal(zeroStock.tier, 'OUT_OF_STOCK');
  assert.equal(zeroStock.badgeText, 'Out of Stock');
  assert.equal(zeroStock.canPurchase, false);
  assert.equal(zeroStock.ctaLabel, 'Notify Me When Available');
  assert.equal(zeroStock.stockPercentage, 0);
});

test('evaluateQuantityGuard strictly prevents exceeding availableStock', () => {
  const withinBounds = evaluateQuantityGuard(3, 5);
  assert.equal(withinBounds.allowedQuantity, 3);
  assert.equal(withinBounds.wasClamped, false);

  const exceeded = evaluateQuantityGuard(8, 5);
  assert.equal(exceeded.allowedQuantity, 5);
  assert.equal(exceeded.wasClamped, true);
  assert.equal(exceeded.reason, 'MAX_STOCK_REACHED');

  const outOfStock = evaluateQuantityGuard(1, 0);
  assert.equal(outOfStock.allowedQuantity, 0);
  assert.equal(outOfStock.wasClamped, true);
  assert.equal(outOfStock.reason, 'OUT_OF_STOCK');
});

test('calculateFreeShippingSummary enforces AED 200 threshold and 5% UAE VAT', () => {
  assert.equal(FREE_SHIPPING_THRESHOLD, 200);
  const p1 = mockPlant({ price: 140 });
  const partial = calculateFreeShippingSummary([{ product: p1, quantity: 1 }]);
  assert.equal(partial.subtotal, 140);
  assert.equal(partial.remainingForFreeShipping, 60);
  assert.equal(partial.progressPercent, 70);
  assert.equal(partial.isUnlocked, false);
  assert.equal(partial.shippingCost, 25);
  assert.equal(partial.vatAmount, 7); // 5% of 140
  assert.equal(partial.totalWithVat, 172); // 140 + 25 + 7

  const unlocked = calculateFreeShippingSummary([{ product: p1, quantity: 2 }]);
  assert.equal(unlocked.subtotal, 280);
  assert.equal(unlocked.remainingForFreeShipping, 0);
  assert.equal(unlocked.progressPercent, 100);
  assert.equal(unlocked.isUnlocked, true);
  assert.equal(unlocked.shippingCost, 0);
  assert.equal(unlocked.vatAmount, 14); // 5% of 280
  assert.equal(unlocked.totalWithVat, 294);
});

test('validateUaeMobileNumber and calculateCheckoutBreakdown validate +971 numbers, +AED 15 COD, and 4x Tabby/Tamara split', () => {
  const valid1 = validateUaeMobileNumber('50 482 9104');
  assert.equal(valid1.isValid, true);
  assert.equal(valid1.normalized, '+971 50 482 9104');

  const valid2 = validateUaeMobileNumber('+971529876543');
  assert.equal(valid2.isValid, true);
  assert.equal(valid2.normalized, '+971 52 987 6543');

  const invalid = validateUaeMobileNumber('12345');
  assert.equal(invalid.isValid, false);

  const p1 = mockPlant({ price: 200 });
  const cardBreakdown = calculateCheckoutBreakdown(
    [{ product: p1, quantity: 1 }],
    'card'
  );
  assert.equal(cardBreakdown.codFee, 0);
  assert.equal(cardBreakdown.finalTotalWithVatAndCod, 210); // 200 + 5% VAT (10)
  assert.equal(cardBreakdown.splitInFourInstallmentAed, 52.5);

  const codBreakdown = calculateCheckoutBreakdown(
    [{ product: p1, quantity: 1 }],
    'cod'
  );
  assert.equal(codBreakdown.codFee, 15);
  assert.equal(codBreakdown.finalTotalWithVatAndCod, 225); // 210 + 15 COD
});

test('buildProductGalleryImages creates a 4-image PDP gallery', () => {
  const p1 = mockPlant();
  const gallery = buildProductGalleryImages(p1.primaryImage, p1.secondaryImage);
  assert.equal(gallery.length, 4);
  assert.equal(gallery[0].label, 'Studio Specimen');
  assert.equal(gallery[1].label, 'View in Room');
  assert.equal(gallery[2].label, 'Leaf Texture Close-Up');
  assert.equal(gallery[3].label, 'Planter & Soil Detail');
});

test('filterAndSortProducts supports Plant Finder filters (pet_safe, low_light, uae_heat_tolerant, pots_and_soil)', () => {
  const items: Product[] = [
    mockPlant({
      id: '1',
      name: 'Calathea Orbifolia',
      category: 'pet_safe',
      finderTags: ['pet_safe', 'air_purifiers'],
      isPetFriendly: true,
      lightRequirement: 'Bright Indirect',
      price: 165,
    }),
    mockPlant({
      id: '2',
      name: 'Sansevieria Laurentii Snake Plant',
      category: 'low_light',
      finderTags: ['low_light', 'air_purifiers'],
      isPetFriendly: false,
      lightRequirement: 'Low Light',
      price: 120,
    }),
    mockPlant({
      id: '3',
      name: 'Ancient Mediterranean Olive Tree',
      category: 'uae_heat_tolerant',
      finderTags: ['uae_heat_tolerant'],
      isPetFriendly: true,
      lightRequirement: 'Full UAE Sun',
      price: 680,
    }),
    mockPlant({
      id: '4',
      name: 'Self-Watering Terracotta Planter',
      category: 'pots_and_soil',
      finderTags: ['pots_and_soil'],
      isPetFriendly: true,
      lightRequirement: 'Bright Indirect',
      price: 145,
    }),
  ];

  const petSafe = filterAndSortProducts(items, {
    category: 'pet_safe',
    searchQuery: '',
  });
  assert.equal(petSafe.length, 2);

  const lowLight = filterAndSortProducts(items, {
    category: 'low_light',
    searchQuery: '',
  });
  assert.equal(lowLight.length, 1);
  assert.equal(lowLight[0].id, '2');

  const heatTolerant = filterAndSortProducts(items, {
    category: 'uae_heat_tolerant',
    searchQuery: '',
  });
  assert.equal(heatTolerant.length, 1);
  assert.equal(heatTolerant[0].id, '3');

  const potsAndSoil = filterAndSortProducts(items, {
    category: 'pots_and_soil',
    searchQuery: '',
  });
  assert.equal(potsAndSoil.length, 1);
  assert.equal(potsAndSoil[0].id, '4');
});

