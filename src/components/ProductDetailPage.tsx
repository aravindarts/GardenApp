import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Minus,
  Sun,
  Droplets,
  ThermometerSun,
  PawPrint,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bell,
  Package,
  Sparkles,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CeramicColorId,
  PotOptionType,
  Product,
  SizeVariantKey,
} from '../types/ecommerce';
import { useStore } from '../store/useStore';
import {
  CERAMIC_PLANTER_UPGRADE_PRICE,
  evaluateQuantityGuard,
  getStockPresentation,
  resolveProductVariantPricingAndStock,
} from '../utils/inventory';
import { formatCurrency } from '../lib/utils';
import { Progress } from './ui/progress';
import { SmartPlantImage } from './SmartPlantImage';
import { buildProductGalleryImages } from '../utils/studioVisuals';
import {
  PLANT_PARENT_KIT_ADDONS,
  subscribeRestockNotification,
} from '../services/api';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
}) => {
  const navigateToProduct = useStore((s) => s.navigateToProduct);
  const cart = useStore((s) => s.cart);
  const user = useStore((s) => s.user);
  const addToCart = useStore((s) => s.addToCart);
  const restockSubscriptions = useStore((s) => s.restockSubscriptions);
  const addRestockSubscription = useStore((s) => s.addRestockSubscription);

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<SizeVariantKey>(
    product.defaultSize || 'Medium'
  );
  const [potOption, setPotOption] = useState<PotOptionType>('nursery_plastic');
  const [ceramicColorId, setCeramicColorId] =
    useState<CeramicColorId>('matte_white');
  const [hoveredSwatchId, setHoveredSwatchId] =
    useState<CeramicColorId | null>(null);
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'success'>(
    'idle'
  );
  const [kitAddingId, setKitAddingId] = useState<string | null>(null);
  const [kitAddedMap, setKitAddedMap] = useState<Record<string, boolean>>({});
  const [notifyEmail, setNotifyEmail] = useState(
    user?.email || 'layla@albarari-botanica.ae'
  );
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Reset local selections when navigating between different products
  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedSize(product.defaultSize || 'Medium');
    setPotOption('nursery_plastic');
    const firstAvailableSwatch =
      product.ceramicSwatches?.find((s) => s.availableStock > 0)?.id ||
      'matte_white';
    setCeramicColorId(firstAvailableSwatch);
    setSelectedQty(1);
    setButtonState('idle');
  }, [product.id, product.defaultSize, product.ceramicSwatches]);

  const variantResolution = resolveProductVariantPricingAndStock(
    product,
    selectedSize,
    potOption,
    ceramicColorId
  );

  // Build composite variant ID so different size/pot combinations track accurately in the cart
  const compositeVariantId = `${product.id}__${selectedSize}__${potOption}__${
    potOption === 'ceramic_planter' ? ceramicColorId : 'std'
  }`;

  const existingCartItem = cart.find(
    (item) => item.product.id === compositeVariantId
  );
  const inCartQty = existingCartItem ? existingCartItem.quantity : 0;
  const effectiveStock = variantResolution.effectiveAvailableStock;
  const remainingPurchasable = Math.max(0, effectiveStock - inCartQty);

  const stockPresentation = getStockPresentation(
    effectiveStock,
    product.inventory.maxCapacity
  );
  const isOutOfStock = stockPresentation.tier === 'OUT_OF_STOCK';
  const isSubscribed = Boolean(restockSubscriptions[product.id]);

  // Clamp selectedQty whenever variant stock changes
  useEffect(() => {
    if (remainingPurchasable > 0 && selectedQty > remainingPurchasable) {
      setSelectedQty(remainingPurchasable);
    } else if (remainingPurchasable > 0 && selectedQty < 1) {
      setSelectedQty(1);
    }
  }, [remainingPurchasable, selectedQty]);

  const handleQtyChange = (nextQty: number) => {
    if (remainingPurchasable <= 0) return;
    const guard = evaluateQuantityGuard(nextQty, remainingPurchasable);
    if (guard.wasClamped && guard.reason === 'MAX_STOCK_REACHED') {
      toast.warning(`Quantity Guard: Only ${remainingPurchasable} more available`, {
        description: `Variant stock is ${effectiveStock} units (${inCartQty} already in your bag).`,
      });
    }
    setSelectedQty(guard.allowedQuantity);
  };

  const handleAddConfiguredPlant = async () => {
    if (remainingPurchasable <= 0 || buttonState !== 'idle') return;
    setButtonState('loading');
    await new Promise((r) => setTimeout(r, 240));

    const configuredProduct: Product = {
      ...product,
      id: compositeVariantId,
      name: `${product.name} (${selectedSize})`,
      subtitle: variantResolution.variantSummaryLabel,
      price: variantResolution.unitPrice,
      compareAtPrice: variantResolution.compareAtPrice,
      inventory: {
        ...product.inventory,
        availableStock: effectiveStock,
      },
    };

    const res = addToCart(configuredProduct, selectedQty);
    if (res.added) {
      setButtonState('success');
      toast.success(`Added ${selectedQty} × ${configuredProduct.name} to bag`, {
        description: `${variantResolution.variantSummaryLabel} · ${formatCurrency(
          variantResolution.unitPrice * selectedQty
        )}`,
      });
      setTimeout(() => {
        setButtonState('idle');
        setSelectedQty(1);
      }, 1000);
    } else {
      setButtonState('idle');
    }
  };

  const handleQuickAddKitItem = async (addon: Product) => {
    if (kitAddingId) return;
    setKitAddingId(addon.id);
    await new Promise((r) => setTimeout(r, 180));

    const res = addToCart(addon, 1);
    setKitAddingId(null);

    if (res.added) {
      setKitAddedMap((prev) => ({ ...prev, [addon.id]: true }));
      toast.success(`${addon.name} added to your bag`, {
        description: `+${formatCurrency(addon.price)} · Plant Parent Kit accessory`,
      });
      setTimeout(() => {
        setKitAddedMap((prev) => ({ ...prev, [addon.id]: false }));
      }, 1100);
    } else {
      toast.warning(`Maximum stock reached for ${addon.name}`);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setIsSubscribing(true);
    try {
      await subscribeRestockNotification(
        product.id,
        product.sku,
        notifyEmail.trim()
      );
      addRestockSubscription(product.id, notifyEmail.trim());
      toast.success(`Greenhouse restock alert confirmed for ${product.name}`, {
        description: `We will notify ${notifyEmail.trim()} when this specimen returns to stock.`,
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const sizeVariants = product.sizeVariants || [
    { size: 'Small' as const, heightLabel: '25–35 cm', priceDelta: -45, availableStock: 10 },
    { size: 'Medium' as const, heightLabel: '55–70 cm', priceDelta: 0, availableStock: 16 },
    { size: 'Large' as const, heightLabel: '120–140 cm', priceDelta: 120, availableStock: 5 },
  ];

  const ceramicSwatches = product.ceramicSwatches || [
    { id: 'matte_white' as const, name: 'Matte White' as const, hex: '#F5F4F0', availableStock: 12 },
    { id: 'desert_sand' as const, name: 'Desert Sand' as const, hex: '#DECBB1', availableStock: 8 },
    { id: 'charcoal' as const, name: 'Charcoal' as const, hex: '#2C302E', availableStock: 4 },
    { id: 'terracotta' as const, name: 'Terracotta' as const, hex: '#D97757', availableStock: 0 },
  ];

  const careGuide = product.careGuide || {
    lightLevel: product.lightRequirement,
    lightDetail: 'Thrives in filtered natural daylight away from harsh midday window glass.',
    wateringSchedule: 'Every 7–10 Days',
    wateringDetail: 'Water when top 4 cm of substrate feels dry; drain excess from saucer.',
    uaeClimateTip: 'Keep Away from Direct AC Vents',
    uaeClimateDetail: 'Protect foliage from cold AC drafts in Dubai & Abu Dhabi interiors.',
    petToxicity: product.isPetFriendly
      ? '100% Safe for Cats & Dogs'
      : 'Keep Away from Pets',
    petToxicityDetail: product.isPetFriendly
      ? 'Verified non-toxic botanical specimen for pet-friendly homes.'
      : 'Place on an elevated stand or console out of reach of curious pets.',
  };

  const relatedPlants = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <motion.div
      data-testid="product-detail-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
    >
      {/* Breadcrumb & Back to Nursery Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <button
            type="button"
            onClick={() => navigateToProduct(null)}
            className="inline-flex items-center gap-1.5 font-medium text-[#1B4332] hover:text-[#2D6A4F] hover:underline cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to UAE Nursery Catalog</span>
          </button>
          <span aria-hidden="true">/</span>
          <span>{product.categoryLabel}</span>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-[#0F172A] truncate max-w-[220px]">
            {product.name}
          </span>
        </div>

        <div className="font-mono-tabular text-xs text-[#64748B]">
          Route: <code className="text-[#1B4332]">/product/{product.id}</code> · SKU{' '}
          {product.sku}
        </div>
      </div>

      {/* Main 12-Column Contiguous Purchase Module */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Sticky 4-Image Botanical Gallery with Interactive Magnifying Loupe (6 cols) */}
        <div className="lg:col-span-6 lg:sticky lg:top-20 space-y-4">
          {(() => {
            const galleryImages = buildProductGalleryImages(
              product.primaryImage,
              product.secondaryImage
            );
            const activeGalleryItem =
              galleryImages[activeImageIndex] || galleryImages[0];

            return (
              <>
                <div className="relative overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#ECE7DF] aspect-[4/3]">
                  <SmartPlantImage
                    primaryImage={activeGalleryItem.url}
                    alt={`${product.name} — ${activeGalleryItem.label}`}
                    enableMagnifier={true}
                    showRoomViewPill={false}
                    testIdPrefix="pdp-main-gallery"
                    className="h-full w-full"
                  />

                  {/* Top-Left Botanical Origin & Bestseller Tag */}
                  <div className="pointer-events-none absolute top-3.5 left-4 z-10 flex flex-wrap items-center gap-2">
                    <span className="rounded-lg border border-[#E5E0D8] bg-white/90 backdrop-blur-xs px-3 py-1 text-xs font-medium text-[#1B4332]">
                      {product.origin}
                    </span>
                    {product.isBestseller && (
                      <span className="rounded-lg bg-[#D97757] px-3 py-1 text-xs font-semibold text-white">
                        UAE Bestseller
                      </span>
                    )}
                  </div>

                  {/* Bottom-Left Active Variant & Angle Preview Pill */}
                  <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-2 rounded-xl border border-[#E5E0D8]/90 bg-white/90 backdrop-blur-xs px-3.5 py-2 text-xs">
                    <span className="font-medium text-[#0F172A] truncate">
                      {activeGalleryItem.label} · {variantResolution.variantSummaryLabel}
                    </span>
                    <span className="font-mono-tabular font-semibold text-[#1B4332] shrink-0">
                      {formatCurrency(variantResolution.unitPrice)}
                    </span>
                  </div>
                </div>

                {/* 4-Image Gallery Thumbnail Switcher & Greenhouse Telemetry */}
                <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {galleryImages.map((item, idx) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        data-testid={`pdp-gallery-thumb-${idx}`}
                        className={`flex flex-col overflow-hidden rounded-xl border p-1.5 text-left transition-all cursor-pointer ${
                          activeImageIndex === idx
                            ? 'border-[#1B4332] bg-[#1B4332]/8 text-[#1B4332] ring-2 ring-[#1B4332]/20'
                            : 'border-[#E5E0D8] text-[#64748B] hover:text-[#0F172A] hover:border-[#1B4332]/40'
                        }`}
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#ECE7DF]">
                          <SmartPlantImage
                            primaryImage={item.url}
                            alt={item.label}
                            showRoomViewPill={false}
                            testIdPrefix={`pdp-thumb-img-${idx}`}
                            className="h-full w-full"
                          />
                        </div>
                        <span className="mt-1.5 px-1 text-[11px] font-semibold truncate">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F2EFE9] pt-2.5 font-mono-tabular text-[11px] text-[#64748B]">
                    <span>{activeGalleryItem.caption}</span>
                    <span>
                      Greenhouse: {product.inventory.warehouseLocation} · {product.weight}
                    </span>
                  </div>
                </div>
              </>
            );
          })()}

          {/* UAE Delivery & Guarantee Strip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2.5 rounded-xl border border-[#E5E0D8] bg-white p-3.5 text-xs">
              <Truck className="h-4 w-4 text-[#1B4332] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#0F172A]">
                  Chilled UAE Van Delivery
                </div>
                <div className="text-[#64748B] mt-0.5">
                  Free over AED 200 across Dubai, Abu Dhabi &amp; Sharjah
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-[#E5E0D8] bg-white p-3.5 text-xs">
              <ShieldCheck className="h-4 w-4 text-[#1B4332] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[#0F172A]">
                  30-Day Healthy Root Guarantee
                </div>
                <div className="text-[#64748B] mt-0.5">
                  Pre-acclimated for UAE air-conditioned homes
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Size & Pot Customizer, Cross-Sell Kit & Care Bento (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header & Animated Dynamic AED Price */}
          <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 sm:p-7">
            <div className="flex items-center justify-between gap-2 text-xs text-[#64748B]">
              <span className="italic font-editorial text-base text-[#1B4332]">
                {product.botanicalName}
              </span>
              <span className="font-mono-tabular">
                ★ {product.rating.toFixed(1)} ({product.reviewCount} UAE reviews)
              </span>
            </div>

            <h1 className="mt-1 font-editorial text-3xl sm:text-4xl font-semibold text-[#0F172A] leading-tight">
              {product.name}
            </h1>

            {/* Smoothly Animated Price Block */}
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-4 border-b border-[#F2EFE9] pb-4">
              <div className="flex items-baseline gap-3">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={variantResolution.unitPrice}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.14 }}
                    data-testid="pdp-animated-price"
                    className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#1B4332]"
                  >
                    {formatCurrency(variantResolution.unitPrice)}
                  </motion.span>
                </AnimatePresence>

                {variantResolution.compareAtPrice && (
                  <span className="font-mono-tabular text-sm text-[#94A3B8] line-through">
                    {formatCurrency(variantResolution.compareAtPrice)}
                  </span>
                )}
              </div>

              <span className="text-xs text-[#64748B]">
                Excl. 5% UAE VAT · Calculated at checkout
              </span>
            </div>

            {/* 1. INTERACTIVE SIZE & POT CUSTOMIZER */}
            <div className="mt-5 space-y-5">
              {/* Step A: Plant Size Selector (Small, Medium, Large) */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-[#0F172A]">
                    1. Select Plant Size
                  </span>
                  <span className="font-mono-tabular text-[#64748B]">
                    Canopy Height: {variantResolution.sizeOption.heightLabel}
                  </span>
                </div>

                <div
                  role="radiogroup"
                  aria-label="Select plant size"
                  className="grid grid-cols-3 gap-2.5"
                >
                  {sizeVariants.map((option) => {
                    const isSelected = selectedSize === option.size;
                    const sizeStock =
                      product.inventory.availableStock === 0
                        ? 0
                        : option.availableStock;
                    const isSizeOut = sizeStock === 0;
                    const optionPrice = Math.max(
                      25,
                      product.price +
                        option.priceDelta +
                        (potOption === 'ceramic_planter'
                          ? CERAMIC_PLANTER_UPGRADE_PRICE
                          : 0)
                    );

                    return (
                      <motion.button
                        key={option.size}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedSize(option.size)}
                        data-testid={`size-option-${option.size}`}
                        className={`relative flex flex-col items-start justify-between rounded-xl border p-3 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#1B4332] bg-[#1B4332]/8 ring-2 ring-[#1B4332]/20'
                            : 'border-[#E5E0D8] bg-[#F9F8F6]/60 hover:border-[#1B4332]/40'
                        } ${isSizeOut ? 'opacity-60' : ''}`}
                      >
                        <div className="flex w-full items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-[#0F172A]">
                            {option.size}
                          </span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-[#1B4332]" />
                          )}
                        </div>
                        <span className="mt-0.5 text-[11px] text-[#64748B]">
                          {option.heightLabel}
                        </span>
                        <div className="mt-2 flex w-full items-center justify-between border-t border-[#E5E0D8]/80 pt-1.5 text-[11px]">
                          <span className="font-mono-tabular font-semibold text-[#1B4332]">
                            {formatCurrency(optionPrice)}
                          </span>
                          <span
                            className={`font-mono-tabular text-[10px] ${
                              sizeStock === 0
                                ? 'text-rose-600'
                                : sizeStock <= 5
                                ? 'text-[#D97757] font-semibold'
                                : 'text-[#64748B]'
                            }`}
                          >
                            {sizeStock === 0 ? '0 left' : `${sizeStock} left`}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Step B: Pot Option Selector (Nursery Plastic Pot - Included vs Upgrade to Ceramic Planter +AED 45) */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-[#0F172A]">
                    2. Select Planter Vessel
                  </span>
                  <span className="text-[#1B4332] font-medium">
                    {potOption === 'ceramic_planter'
                      ? `+${formatCurrency(CERAMIC_PLANTER_UPGRADE_PRICE)} Ceramic Upgrade`
                      : 'Standard Nursery Pot Included'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPotOption('nursery_plastic')}
                    data-testid="pot-option-nursery"
                    className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                      potOption === 'nursery_plastic'
                        ? 'border-[#1B4332] bg-[#1B4332]/8 ring-2 ring-[#1B4332]/20'
                        : 'border-[#E5E0D8] bg-[#F9F8F6]/60 hover:border-[#1B4332]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0F172A]">
                        Nursery Plastic Pot
                      </span>
                      <span className="font-mono-tabular text-xs font-semibold text-[#1B4332]">
                        Included
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#64748B]">
                      Lightweight perforated grow pot ready for drop-in cachepots.
                    </p>
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPotOption('ceramic_planter')}
                    data-testid="pot-option-ceramic"
                    className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                      potOption === 'ceramic_planter'
                        ? 'border-[#1B4332] bg-[#1B4332]/8 ring-2 ring-[#1B4332]/20'
                        : 'border-[#E5E0D8] bg-[#F9F8F6]/60 hover:border-[#1B4332]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0F172A]">
                        Upgrade to Ceramic Planter
                      </span>
                      <span className="font-mono-tabular text-xs font-semibold text-[#D97757]">
                        +AED 45.00
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#64748B]">
                      Hand-glazed stoneware with drainage saucer &amp; pre-potted service.
                    </p>
                  </motion.button>
                </div>

                {/* Ceramic Planter Color Swatches (Matte White, Desert Sand, Charcoal, Terracotta) */}
                <div className="mt-3.5 rounded-xl border border-[#E5E0D8] bg-[#F9F8F6] p-3.5">
                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <span className="font-medium text-[#334155]">
                      Ceramic Planter Glaze Finish:{' '}
                      <strong className="text-[#0F172A]">
                        {
                          ceramicSwatches.find((s) => s.id === ceramicColorId)
                            ?.name
                        }
                      </strong>
                    </span>
                    <span className="font-mono-tabular text-[11px] text-[#64748B]">
                      {potOption === 'ceramic_planter'
                        ? `${
                            ceramicSwatches.find((s) => s.id === ceramicColorId)
                              ?.availableStock ?? 0
                          } pots in stock`
                        : 'Click a swatch to upgrade (+AED 45)'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {ceramicSwatches.map((swatch) => {
                      const isSwatchOut = swatch.availableStock <= 0;
                      const isSelected =
                        potOption === 'ceramic_planter' &&
                        ceramicColorId === swatch.id;
                      const isTooltipVisible = hoveredSwatchId === swatch.id;

                      return (
                        <div
                          key={swatch.id}
                          className="relative flex items-center"
                          onMouseEnter={() => setHoveredSwatchId(swatch.id)}
                          onMouseLeave={() => setHoveredSwatchId(null)}
                        >
                          <button
                            type="button"
                            disabled={isSwatchOut}
                            onClick={() => {
                              if (isSwatchOut) return;
                              setPotOption('ceramic_planter');
                              setCeramicColorId(swatch.id);
                            }}
                            aria-label={`${swatch.name} Ceramic Planter (${
                              isSwatchOut
                                ? 'Out of Stock'
                                : `${swatch.availableStock} available`
                            })`}
                            data-testid={`swatch-${swatch.id}`}
                            className={`relative flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                              isSwatchOut
                                ? 'border-[#E5E0D8] bg-white/50 text-[#94A3B8] cursor-not-allowed'
                                : isSelected
                                ? 'border-[#1B4332] bg-white text-[#0F172A] ring-2 ring-[#1B4332]/20 cursor-pointer'
                                : 'border-[#E5E0D8] bg-white text-[#334155] hover:border-[#1B4332]/50 cursor-pointer'
                            }`}
                          >
                            {/* Color Circle with Cross-Out Slash when Out of Stock */}
                            <span
                              className="relative inline-flex h-4 w-4 rounded-full border border-black/15 shrink-0 overflow-hidden"
                              style={{ backgroundColor: swatch.hex }}
                            >
                              {isSwatchOut && (
                                <span
                                  aria-hidden="true"
                                  className="absolute inset-0 flex items-center justify-center"
                                >
                                  <span className="h-[1.5px] w-5 rotate-45 bg-rose-600 block" />
                                </span>
                              )}
                            </span>

                            <span
                              className={isSwatchOut ? 'line-through' : ''}
                            >
                              {swatch.name}
                            </span>
                          </button>

                          {/* Accessible Tooltip for Out-of-Stock or Stock Count */}
                          <AnimatePresence>
                            {isTooltipVisible && (
                              <motion.div
                                role="tooltip"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.14 }}
                                className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap rounded-md bg-[#0F172A] px-2.5 py-1 text-[11px] font-medium text-white shadow-md"
                              >
                                {isSwatchOut
                                  ? `${swatch.name} Ceramic Pot — Out of Stock`
                                  : `${swatch.name} — ${swatch.availableStock} in stock (+AED 45)`}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Real-Time Variant Inventory Status & Quantity Guard */}
              <div className="rounded-xl border border-[#E5E0D8] bg-[#F9F8F6] p-3.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  {stockPresentation.tier === 'IN_STOCK' && (
                    <span className="flex items-center gap-1.5 font-semibold text-[#1B4332]">
                      <CheckCircle2 className="h-4 w-4 text-[#2D6A4F]" />
                      {stockPresentation.badgeText}
                    </span>
                  )}
                  {stockPresentation.tier === 'LOW_STOCK' && (
                    <span className="flex items-center gap-1.5 font-semibold text-[#D97757]">
                      <AlertTriangle className="h-4 w-4 text-[#D97757]" />
                      {stockPresentation.badgeText}
                    </span>
                  )}
                  {stockPresentation.tier === 'OUT_OF_STOCK' && (
                    <span className="flex items-center gap-1.5 font-semibold text-rose-700">
                      <XCircle className="h-4 w-4 text-rose-600" />
                      {stockPresentation.badgeText}
                    </span>
                  )}

                  <span className="font-mono-tabular text-xs text-[#475569]">
                    {effectiveStock} available for this configuration
                  </span>
                </div>

                {stockPresentation.tier === 'LOW_STOCK' && (
                  <div className="mt-2">
                    <Progress
                      value={stockPresentation.stockPercentage}
                      className="h-1.5 bg-[#D97757]/20"
                      indicatorClassName="bg-[#D97757]"
                    />
                  </div>
                )}
              </div>

              {/* Primary Add to Bag / Restock Button Row */}
              {isOutOfStock ? (
                <form onSubmit={handleRestockSubmit} className="space-y-2.5">
                  <label
                    htmlFor="pdp-restock-email"
                    className="block text-xs font-medium text-[#334155]"
                  >
                    This configuration is currently out of stock. Get notified on restock:
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="pdp-restock-email"
                      type="email"
                      required
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      className="flex-1 rounded-lg border border-[#D5CBB8] bg-white px-3 py-2.5 text-xs text-[#0F172A] focus:border-[#1B4332] focus:outline-none"
                    />
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.96 }}
                      disabled={isSubscribing || isSubscribed}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B4332] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#2D6A4F] cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isSubscribing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isSubscribed ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Alert Subscribed</span>
                        </>
                      ) : (
                        <>
                          <Bell className="h-3.5 w-3.5" />
                          <span>Notify Me When Available</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  {/* Quantity Guard Stepper */}
                  <div className="inline-flex items-center rounded-xl border border-[#D5CBB8] bg-[#F9F8F6] h-11">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(selectedQty - 1)}
                      disabled={selectedQty <= 1 || remainingPurchasable <= 0}
                      aria-label="Decrease quantity"
                      className="flex h-full w-10 items-center justify-center text-[#475569] hover:text-[#1B4332] disabled:opacity-35 cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span
                      data-testid="pdp-quantity-value"
                      className="px-3.5 font-mono-tabular text-xs font-semibold text-[#0F172A]"
                    >
                      {remainingPurchasable === 0 ? 0 : selectedQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(selectedQty + 1)}
                      disabled={selectedQty >= remainingPurchasable}
                      aria-label="Increase quantity"
                      className="flex h-full w-10 items-center justify-center text-[#475569] hover:text-[#1B4332] disabled:opacity-35 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={handleAddConfiguredPlant}
                    disabled={remainingPurchasable <= 0 || buttonState !== 'idle'}
                    data-testid="pdp-add-to-bag"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1B4332] h-11 px-6 text-sm font-medium text-white hover:bg-[#2D6A4F] disabled:bg-[#E5E0D8] disabled:text-[#64748B] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {buttonState === 'loading' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Adding to Bag...</span>
                      </>
                    ) : buttonState === 'success' ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-300" />
                        <span>Added to Botanical Bag</span>
                      </>
                    ) : remainingPurchasable <= 0 ? (
                      <>
                        <Package className="h-4 w-4" />
                        <span>Max Stock ({effectiveStock}) in Bag</span>
                      </>
                    ) : (
                      <span>
                        Add to Bag ·{' '}
                        {formatCurrency(
                          variantResolution.unitPrice * selectedQty
                        )}
                      </span>
                    )}
                  </motion.button>
                </div>
              )}
            </div>

            {/* 2. VISUAL PLANT CARE GUIDE CARD (4-Box Bento Grid Below Add to Cart) */}
            <div className="mt-6 border-t border-[#F2EFE9] pt-5">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="font-semibold text-[#0F172A]">
                  Visual Plant Care Guide (UAE Indoor Edition)
                </span>
                <span className="text-[#1B4332] font-medium">
                  {product.careLevel} Care Level
                </span>
              </div>

              <div
                data-testid="pdp-care-bento-grid"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {/* Box 1: Light Level */}
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-xl border border-[#E5E0D8] bg-[#F9F8F6] p-3.5"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D97757]/15 text-[#D97757]">
                      <Sun className="h-4 w-4" />
                    </span>
                    <span>☀️ Light: {careGuide.lightLevel}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#475569] leading-relaxed">
                    {careGuide.lightDetail}
                  </p>
                </motion.div>

                {/* Box 2: Watering Schedule */}
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-xl border border-[#E5E0D8] bg-[#F9F8F6] p-3.5"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1B4332]/12 text-[#1B4332]">
                      <Droplets className="h-4 w-4" />
                    </span>
                    <span>💧 Water: {careGuide.wateringSchedule}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#475569] leading-relaxed">
                    {careGuide.wateringDetail}
                  </p>
                </motion.div>

                {/* Box 3: UAE Climate Tip */}
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-xl border border-[#E5E0D8] bg-[#F9F8F6] p-3.5"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700">
                      <ThermometerSun className="h-4 w-4" />
                    </span>
                    <span>🌡️ UAE Tip: {careGuide.uaeClimateTip}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#475569] leading-relaxed">
                    {careGuide.uaeClimateDetail}
                  </p>
                </motion.div>

                {/* Box 4: Pet Toxicity */}
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-xl border border-[#E5E0D8] bg-[#F9F8F6] p-3.5"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                        product.isPetFriendly
                          ? 'bg-[#1B4332]/15 text-[#1B4332]'
                          : 'bg-rose-500/15 text-rose-700'
                      }`}
                    >
                      <PawPrint className="h-4 w-4" />
                    </span>
                    <span>🐾 Pets: {careGuide.petToxicity}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#475569] leading-relaxed">
                    {careGuide.petToxicityDetail}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* 3. "COMPLETE THE PLANT PARENT KIT" CROSS-SELL (One-Click Add Right Above Description) */}
          <div
            data-testid="plant-parent-kit-section"
            className="rounded-2xl border border-[#E5E0D8] bg-white p-6"
          >
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#D97757]" />
                <h2 className="text-sm font-semibold text-[#0F172A]">
                  Complete the Plant Parent Kit
                </h2>
              </div>
              <span className="text-xs text-[#64748B]">
                One-click add to bag
              </span>
            </div>

            <div className="space-y-2.5">
              {PLANT_PARENT_KIT_ADDONS.map((addon) => {
                const isAdding = kitAddingId === addon.id;
                const isJustAdded = Boolean(kitAddedMap[addon.id]);
                const inBagCount =
                  cart.find((c) => c.product.id === addon.id)?.quantity || 0;

                return (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E0D8] bg-[#F9F8F6] p-3 hover:border-[#1B4332]/35 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={addon.primaryImage}
                        alt={addon.name}
                        referrerPolicy="no-referrer"
                        className="h-12 w-12 rounded-lg border border-[#E5E0D8] bg-white object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-semibold text-[#0F172A] truncate">
                            {addon.name}
                          </h3>
                          {inBagCount > 0 && (
                            <span className="font-mono-tabular text-[10px] font-semibold text-[#1B4332]">
                              ({inBagCount} in bag)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B] truncate">
                          {addon.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-mono-tabular text-xs font-semibold text-[#1B4332]">
                        +{formatCurrency(addon.price)}
                      </span>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleQuickAddKitItem(addon)}
                        disabled={isAdding}
                        aria-label={`Add ${addon.name} for ${formatCurrency(
                          addon.price
                        )}`}
                        data-testid={`kit-add-${addon.id}`}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                          isJustAdded
                            ? 'bg-[#2D6A4F] text-white'
                            : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F]'
                        }`}
                      >
                        {isAdding ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isJustAdded ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botanical Description & Specifications Card */}
          <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Botanical Dossier &amp; Al Barari Greenhouse Notes
            </h2>
            <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
              {product.description}
            </p>

            <dl className="grid grid-cols-2 gap-3 border-t border-[#F2EFE9] pt-4 text-xs">
              {product.specs.map((spec) => (
                <div key={spec.label}>
                  <dt className="text-[#64748B]">{spec.label}</dt>
                  <dd className="font-medium text-[#0F172A] mt-0.5">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Companion Plants Section */}
      {relatedPlants.length > 0 && (
        <section className="mt-14 border-t border-[#E5E0D8] pt-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs text-[#64748B]">
                Companion Specimens
              </span>
              <h2 className="font-editorial text-2xl font-semibold text-[#0F172A]">
                Pairs Harmoniously in UAE Living Spaces
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigateToProduct(null)}
              className="text-xs font-medium text-[#1B4332] hover:underline cursor-pointer"
            >
              View All {allProducts.length} Specimens →
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedPlants.map((rel) => (
              <div
                key={rel.id}
                onClick={() => navigateToProduct(rel.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigateToProduct(rel.id);
                }}
                className="group rounded-2xl border border-[#E5E0D8] bg-white p-4 hover:border-[#1B4332]/40 transition-all cursor-pointer"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-[#ECE7DF]">
                  <SmartPlantImage
                    primaryImage={rel.primaryImage}
                    secondaryImage={rel.secondaryImage}
                    alt={rel.name}
                    showRoomViewPill={true}
                    testIdPrefix={`companion-img-${rel.id}`}
                    className="h-full w-full"
                  />
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#0F172A] group-hover:text-[#1B4332] truncate">
                    {rel.name}
                  </h3>
                  <span className="font-mono-tabular text-xs font-semibold text-[#1B4332] shrink-0">
                    {formatCurrency(rel.price)}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#64748B] truncate">
                  {rel.lightRequirement} · {rel.wateringFrequency}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
};
