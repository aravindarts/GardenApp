import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Plus,
  Minus,
  Check,
  Loader2,
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  Sun,
  Droplets,
  PawPrint,
  Sprout,
  Ruler,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '../types/ecommerce';
import { useStore } from '../store/useStore';
import {
  evaluateQuantityGuard,
  getStockPresentation,
} from '../utils/inventory';
import { formatCurrency } from '../lib/utils';
import { Progress } from './ui/progress';
import { subscribeRestockNotification } from '../services/api';

interface QuickViewModalProps {
  products: Product[];
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ products }) => {
  const quickViewProductId = useStore((s) => s.quickViewProductId);
  const setQuickViewProductId = useStore((s) => s.setQuickViewProductId);
  const navigateToProduct = useStore((s) => s.navigateToProduct);
  const cart = useStore((s) => s.cart);
  const user = useStore((s) => s.user);
  const addToCart = useStore((s) => s.addToCart);
  const restockSubscriptions = useStore((s) => s.restockSubscriptions);
  const addRestockSubscription = useStore((s) => s.addRestockSubscription);

  const product = products.find((p) => p.id === quickViewProductId) || null;

  const [activeImageIndex, setActiveImageIndex] = useState<0 | 1>(0);
  const [selectedQty, setSelectedQty] = useState(1);
  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [notifyEmail, setNotifyEmail] = useState(
    user?.email || 'layla@albarari-botanica.ae'
  );
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
    setSelectedQty(1);
    setButtonState('idle');
  }, [quickViewProductId]);

  if (!product) return null;

  const availableStock = product.inventory.availableStock;
  const stockMeta = getStockPresentation(
    availableStock,
    product.inventory.maxCapacity
  );
  const cartItem = cart.find((item) => item.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const remainingPurchasable = Math.max(0, availableStock - inCartQty);
  const isSubscribed = Boolean(restockSubscriptions[product.id]);

  const handleQtyChange = (nextQty: number) => {
    if (remainingPurchasable <= 0) return;
    const guard = evaluateQuantityGuard(nextQty, remainingPurchasable);
    if (guard.wasClamped && guard.reason === 'MAX_STOCK_REACHED') {
      toast.warning(`Quantity Guard: Only ${remainingPurchasable} more available`, {
        description: `Greenhouse stock is ${availableStock} units (${inCartQty} already in your bag).`,
      });
    }
    setSelectedQty(guard.allowedQuantity);
  };

  const handleAdd = async () => {
    if (remainingPurchasable <= 0 || buttonState !== 'idle') return;
    setButtonState('loading');
    await new Promise((r) => setTimeout(r, 260));
    const res = addToCart(product, selectedQty);
    if (res.added) {
      setButtonState('success');
      toast.success(`Added ${selectedQty} × ${product.name} to bag`, {
        description: `Total in bag: ${res.newQuantity} of ${availableStock} available.`,
      });
      setTimeout(() => {
        setButtonState('idle');
        setSelectedQty(1);
      }, 1000);
    } else {
      setButtonState('idle');
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setIsSubscribing(true);
    try {
      await subscribeRestockNotification(product.id, product.sku, notifyEmail.trim());
      addRestockSubscription(product.id, notifyEmail.trim());
      toast.success(`Greenhouse restock alert confirmed for ${product.name}`, {
        description: `Notification queued for ${notifyEmail.trim()} via Spring Boot Inventory Service.`,
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setQuickViewProductId(null)}
          className="fixed inset-0 bg-[#0F172A]/45 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} details`}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative z-10 grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-2xl md:grid-cols-12 max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setQuickViewProductId(null)}
            aria-label="Close quick view modal"
            className="absolute top-4 right-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E0D8] bg-white/90 text-[#1B4332] hover:bg-[#F2EFE9] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Left Column: Studio Image Gallery (6 cols) */}
          <div className="flex flex-col justify-between bg-[#F2EFE9] p-6 md:col-span-6">
            <div className="overflow-hidden rounded-xl border border-[#E5E0D8] bg-white aspect-[4/3]">
              <img
                src={
                  activeImageIndex === 0
                    ? product.primaryImage
                    : product.secondaryImage
                }
                alt={product.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-all duration-300"
              />
            </div>

            {/* Nursery Care Matrix Pills inside Gallery */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg border border-[#E5E0D8] bg-white/90 p-2.5">
                <div className="flex items-center gap-1 text-[#64748B]">
                  <Sun className="h-3.5 w-3.5 text-[#D97757]" />
                  <span>Light</span>
                </div>
                <div className="mt-1 font-semibold text-[#0F172A]">
                  {product.lightRequirement}
                </div>
              </div>
              <div className="rounded-lg border border-[#E5E0D8] bg-white/90 p-2.5">
                <div className="flex items-center gap-1 text-[#64748B]">
                  <Droplets className="h-3.5 w-3.5 text-[#1B4332]" />
                  <span>Watering</span>
                </div>
                <div className="mt-1 font-semibold text-[#0F172A]">
                  {product.wateringFrequency}
                </div>
              </div>
              <div className="rounded-lg border border-[#E5E0D8] bg-white/90 p-2.5">
                <div className="flex items-center gap-1 text-[#64748B]">
                  <PawPrint className="h-3.5 w-3.5 text-[#1B4332]" />
                  <span>Pet Status</span>
                </div>
                <div className="mt-1 font-semibold text-[#0F172A]">
                  {product.isPetFriendly ? 'Pet Safe' : 'Keep Away'}
                </div>
              </div>
            </div>

            {/* Thumbnail Switcher */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {[product.primaryImage, product.secondaryImage].map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImageIndex(i as 0 | 1)}
                    aria-label={
                      i === 0 ? 'View full specimen angle' : 'View foliage macro detail'
                    }
                    className={`overflow-hidden rounded-lg border transition-all cursor-pointer h-14 w-20 ${
                      activeImageIndex === i
                        ? 'border-[#1B4332] ring-2 ring-[#1B4332]/20'
                        : 'border-[#E5E0D8] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>

              <div className="text-right font-mono-tabular text-[11px] text-[#64748B]">
                <div>Greenhouse: {product.inventory.warehouseLocation}</div>
                <div>Canopy: {product.dimensions}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Contiguous Purchase & Inventory Module (6 cols) */}
          <div className="flex flex-col justify-between p-6 sm:p-8 md:col-span-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <span className="italic font-editorial text-sm text-[#1B4332]">
                  {product.botanicalName}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">{product.sku}</span>
                {product.isBestseller && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#D97757]">Bestseller</span>
                  </>
                )}
              </div>

              <h2 className="mt-1.5 font-editorial text-2xl sm:text-3xl font-semibold text-[#0F172A]">
                {product.name}
              </h2>

              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-mono-tabular text-xl font-semibold text-[#1B4332]">
                  {formatCurrency(product.price)}
                </span>
                {product.compareAtPrice && (
                  <span className="font-mono-tabular text-sm text-[#94A3B8] line-through">
                    {formatCurrency(product.compareAtPrice)}
                  </span>
                )}
                <span className="text-xs text-[#64748B]">
                  ★ {product.rating.toFixed(1)} ({product.reviewCount} UAE reviews)
                </span>
              </div>

              <p className="mt-3 text-xs sm:text-sm text-[#334155] leading-relaxed">
                {product.description}
              </p>

              {/* Size, Care Level & Pot Inclusion Strip */}
              <div className="mt-3.5 flex flex-wrap items-center gap-3 text-xs text-[#334155]">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Ruler className="h-3.5 w-3.5 text-[#1B4332]" />
                  {product.plantSize}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Sprout className="h-3.5 w-3.5 text-[#1B4332]" />
                  {product.careLevel} Care
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[#1B4332]">
                  {product.potIncluded ? 'Ceramic / Terracotta Pot Included' : 'Care Kit'}
                </span>
              </div>

              {/* Live Inventory Status Banner */}
              <div className="mt-4 rounded-xl border border-[#E5E0D8] bg-[#F9F8F6] p-3.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  {stockMeta.tier === 'IN_STOCK' && (
                    <span className="flex items-center gap-1.5 font-semibold text-[#1B4332]">
                      <CheckCircle2 className="h-4 w-4 text-[#2D6A4F]" />
                      {stockMeta.badgeText}
                    </span>
                  )}
                  {stockMeta.tier === 'LOW_STOCK' && (
                    <span className="flex items-center gap-1.5 font-semibold text-[#D97757]">
                      <AlertTriangle className="h-4 w-4 text-[#D97757]" />
                      {stockMeta.badgeText}
                    </span>
                  )}
                  {stockMeta.tier === 'OUT_OF_STOCK' && (
                    <span className="flex items-center gap-1.5 font-semibold text-rose-700">
                      <XCircle className="h-4 w-4 text-rose-600" />
                      {stockMeta.badgeText}
                    </span>
                  )}

                  <span className="font-mono-tabular text-xs text-[#475569]">
                    {availableStock} / {product.inventory.maxCapacity} in nursery
                  </span>
                </div>

                {stockMeta.tier === 'LOW_STOCK' && (
                  <div className="mt-2">
                    <Progress
                      value={stockMeta.stockPercentage}
                      className="h-1.5 bg-[#D97757]/20"
                      indicatorClassName="bg-[#D97757]"
                    />
                  </div>
                )}

                {stockMeta.tier === 'OUT_OF_STOCK' && product.inventory.restockEta && (
                  <p className="mt-1.5 text-[11px] text-[#64748B]">
                    {product.inventory.restockEta}
                  </p>
                )}
              </div>

              {/* Botanical Specifications Grid */}
              <dl className="mt-4 grid grid-cols-2 gap-2.5 border-t border-[#E5E0D8] pt-4 text-xs">
                {product.specs.map((spec) => (
                  <div key={spec.label}>
                    <dt className="text-[#64748B]">{spec.label}</dt>
                    <dd className="font-medium text-[#0F172A] mt-0.5">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Purchase or Restock Action Module */}
            <div className="mt-6 border-t border-[#E5E0D8] pt-4">
              {stockMeta.tier === 'OUT_OF_STOCK' ? (
                <form onSubmit={handleRestockSubmit} className="space-y-2.5">
                  <label
                    htmlFor="quickview-restock-email"
                    className="block text-xs font-medium text-[#334155]"
                  >
                    Receive instant alert when our Dubai greenhouse restocks:
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="quickview-restock-email"
                      type="email"
                      required
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="layla@albarari-botanica.ae"
                      className="flex-1 rounded-lg border border-[#D5CBB8] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#1B4332] focus:outline-none"
                    />
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.96 }}
                      disabled={isSubscribing || isSubscribed}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B4332] px-4 py-2 text-xs font-medium text-white hover:bg-[#2D6A4F] disabled:bg-[#2D6A4F] disabled:opacity-90 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isSubscribing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isSubscribed ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Subscribed</span>
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
                  <div className="inline-flex items-center rounded-lg border border-[#D5CBB8] bg-[#F9F8F6] h-10">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(selectedQty - 1)}
                      disabled={selectedQty <= 1 || remainingPurchasable <= 0}
                      aria-label="Decrease quantity"
                      className="flex h-full w-9 items-center justify-center text-[#475569] hover:text-[#1B4332] disabled:opacity-35 cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span
                      data-testid="quickview-quantity-value"
                      className="px-3 font-mono-tabular text-xs font-semibold text-[#0F172A]"
                    >
                      {remainingPurchasable === 0 ? 0 : selectedQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(selectedQty + 1)}
                      disabled={selectedQty >= remainingPurchasable}
                      aria-label="Increase quantity"
                      className="flex h-full w-9 items-center justify-center text-[#475569] hover:text-[#1B4332] disabled:opacity-35 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={handleAdd}
                    disabled={remainingPurchasable <= 0 || buttonState !== 'idle'}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1B4332] h-10 px-5 text-xs font-medium text-white hover:bg-[#2D6A4F] disabled:bg-[#E5E0D8] disabled:text-[#64748B] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {buttonState === 'loading' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Adding to Bag...</span>
                      </>
                    ) : buttonState === 'success' ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-300" />
                        <span>Added to Bag</span>
                      </>
                    ) : remainingPurchasable <= 0 ? (
                      <>
                        <Package className="h-4 w-4" />
                        <span>Max Available Stock ({availableStock}) in Bag</span>
                      </>
                    ) : (
                      <span>
                        Add to Bag · {formatCurrency(product.price * selectedQty)}
                      </span>
                    )}
                  </motion.button>
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => navigateToProduct(product.id)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#1B4332] hover:underline cursor-pointer"
                >
                  <span>Open Full Size &amp; Ceramic Pot Customizer (/product/{product.id})</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
