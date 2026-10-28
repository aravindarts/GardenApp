import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Eye,
  Loader2,
  Plus,
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sun,
  Droplets,
  PawPrint,
} from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '../types/ecommerce';
import { getStockPresentation } from '../utils/inventory';
import { formatCurrency } from '../lib/utils';
import { useStore } from '../store/useStore';
import { Progress } from './ui/progress';
import { SmartPlantImage } from './SmartPlantImage';
import { subscribeRestockNotification } from '../services/api';

interface ProductCardProps {
  product: Product;
  index: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [notifying, setNotifying] = useState(false);

  const cart = useStore((s) => s.cart);
  const user = useStore((s) => s.user);
  const addToCart = useStore((s) => s.addToCart);
  const setQuickViewProductId = useStore((s) => s.setQuickViewProductId);
  const navigateToProduct = useStore((s) => s.navigateToProduct);
  const restockSubscriptions = useStore((s) => s.restockSubscriptions);
  const addRestockSubscription = useStore((s) => s.addRestockSubscription);

  const availableStock = product.inventory.availableStock;
  const stockPresentation = getStockPresentation(
    availableStock,
    product.inventory.maxCapacity
  );

  const cartItem = cart.find((item) => item.product.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const isMaxStockInCart =
    availableStock > 0 && quantityInCart >= availableStock;
  const isOutOfStock = stockPresentation.tier === 'OUT_OF_STOCK';
  const isSubscribed = Boolean(restockSubscriptions[product.id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock || buttonState !== 'idle') return;

    if (isMaxStockInCart) {
      toast.warning(
        `Quantity Guard: Maximum greenhouse stock (${availableStock}) reached`,
        {
          description: `All ${availableStock} units of ${product.name} are already in your bag.`,
        }
      );
      return;
    }

    setButtonState('loading');
    await new Promise((resolve) => setTimeout(resolve, 260));

    const result = addToCart(product, 1);
    if (result.added) {
      setButtonState('success');
      toast.success(`${product.name} added to bag`, {
        description: `${formatCurrency(product.price)} · In bag: ${result.newQuantity} of ${availableStock} available`,
      });
      setTimeout(() => setButtonState('idle'), 1100);
    } else {
      setButtonState('idle');
      toast.warning(`Unable to add more of ${product.name}`, {
        description: `Stock limit of ${availableStock} units enforced by Quantity Guard.`,
      });
    }
  };

  const handleNotifyWhenAvailable = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSubscribed) {
      setQuickViewProductId(product.id);
      return;
    }
    setNotifying(true);
    const targetEmail = user?.email || 'layla@albarari-botanica.ae';
    try {
      await subscribeRestockNotification(product.id, product.sku, targetEmail);
      addRestockSubscription(product.id, targetEmail);
      toast.success(`Greenhouse restock alert registered for ${product.name}`, {
        description: `We will notify ${targetEmail} when SKU ${product.sku} is ready for dispatch.`,
      });
    } finally {
      setNotifying(false);
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{
        duration: 0.32,
        delay: Math.min(index * 0.05, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`product-card-${product.id}`}
      className={`group relative flex flex-col justify-between rounded-2xl border border-[#E5E0D8] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1B4332]/40 ${
        isOutOfStock ? 'opacity-80' : ''
      }`}
    >
      {/* Top Image Container (4:3 aspect ratio, zero layout shift, Lively SmartPlantImage) */}
      <div
        onClick={() => navigateToProduct(product.id)}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-[#ECE7DF] cursor-pointer"
      >
        <SmartPlantImage
          primaryImage={product.primaryImage}
          secondaryImage={product.secondaryImage}
          alt={product.name}
          isHoveredExternal={isHovered}
          showRoomViewPill={true}
          testIdPrefix={`smart-image-${product.id}`}
          className="h-full w-full"
        />

        {/* Top-Left Hover Mini-Badges: Light (Sun), Water (Droplets), Pet-Safe (PawPrint) */}
        <div
          data-testid={`hover-badges-${product.id}`}
          className="pointer-events-none absolute top-3 left-3 right-12 z-10 flex flex-wrap items-center gap-1.5 opacity-0 -translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
        >
          <span className="inline-flex items-center gap-1 rounded-md bg-white/95 backdrop-blur-xs border border-[#E5E0D8] px-2 py-1 text-[11px] font-medium text-[#0F172A] shadow-2xs">
            <Sun className="h-3 w-3 text-[#D97757] shrink-0" />
            <span>{product.lightRequirement}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-white/95 backdrop-blur-xs border border-[#E5E0D8] px-2 py-1 text-[11px] font-medium text-[#0F172A] shadow-2xs">
            <Droplets className="h-3 w-3 text-[#1B4332] shrink-0" />
            <span>{product.wateringFrequency}</span>
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-md backdrop-blur-xs border px-2 py-1 text-[11px] font-medium shadow-2xs ${
              product.isPetFriendly
                ? 'bg-[#1B4332]/95 border-[#1B4332] text-white'
                : 'bg-white/95 border-[#E5E0D8] text-[#64748B]'
            }`}
          >
            <PawPrint className="h-3 w-3 shrink-0" />
            <span>{product.isPetFriendly ? 'Pet Safe' : 'Keep from Pets'}</span>
          </span>
        </div>

        {/* Subtle Quick-View Trigger Button (Top Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setQuickViewProductId(product.id);
          }}
          aria-label={`Quick view ${product.name}`}
          className="absolute top-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-[#1B4332] border border-[#E5E0D8] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
        >
          <Eye className="h-4 w-4" />
        </button>

        {/* Slide-up "Quick Add +" Bar on Hover for In-Stock Plants */}
        {!isOutOfStock && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 translate-y-3 opacity-0 transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={handleAddToCart}
              disabled={isMaxStockInCart || buttonState !== 'idle'}
              className="pointer-events-auto flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1B4332]/95 backdrop-blur-xs py-2 px-3 text-xs font-medium text-white hover:bg-[#2D6A4F] disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
            >
              {buttonState === 'loading' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : buttonState === 'success' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Added to Bag</span>
                </>
              ) : isMaxStockInCart ? (
                <span>Max Stock ({availableStock}) in Bag</span>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Quick Add +</span>
                </>
              )}
            </motion.button>
          </div>
        )}
      </div>

      {/* Card Body & Inventory-Aware UX Module */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {/* Clean Unboxed Botanical Metadata Row */}
          <div className="flex items-center justify-between gap-2 text-xs text-[#64748B]">
            <div className="flex items-center gap-1.5 truncate">
              <span className="italic font-editorial text-[13px] text-[#1B4332]">
                {product.botanicalName}
              </span>
              {product.isBestseller && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#D97757]">Bestseller</span>
                </>
              )}
            </div>
            <span className="font-mono-tabular text-[#475569] shrink-0">
              ★ {product.rating.toFixed(1)}
            </span>
          </div>

          {/* Product Title & AED Price */}
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <h3 className="text-base font-semibold text-[#0F172A] leading-snug">
              <button
                type="button"
                onClick={() => navigateToProduct(product.id)}
                className="text-left hover:text-[#1B4332] hover:underline focus-visible:outline-none focus-visible:underline cursor-pointer"
              >
                {product.name}
              </button>
            </h3>
            <div className="text-right shrink-0">
              <span className="font-mono-tabular text-[15px] font-semibold text-[#1B4332]">
                {formatCurrency(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="block font-mono-tabular text-[11px] text-[#94A3B8] line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>

          <p className="mt-1 text-xs text-[#475569] line-clamp-2 leading-relaxed">
            {product.subtitle}
          </p>

          {/* Compact Botanical Attributes Line (Size, Care Level, Pot Included) */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#5C6460]">
            <span>{product.plantSize}</span>
            <span aria-hidden="true">·</span>
            <span>{product.careLevel} Care</span>
            <span aria-hidden="true">·</span>
            <span>{product.potIncluded ? 'Ceramic Pot Included' : 'Care Kit'}</span>
          </div>
        </div>

        {/* Inventory-Aware Status Block (Reacts dynamically to stock > 10, 1 <= stock <= 10, stock === 0) */}
        <div className="mt-4 pt-3.5 border-t border-[#F2EFE9]">
          <div className="flex items-center justify-between gap-2 text-xs">
            {stockPresentation.tier === 'IN_STOCK' && (
              <div className="flex items-center gap-1.5 font-medium text-[#1B4332]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#2D6A4F]" />
                <span>{stockPresentation.badgeText}</span>
              </div>
            )}

            {stockPresentation.tier === 'LOW_STOCK' && (
              <div className="flex items-center gap-1.5 font-semibold text-[#D97757]">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#D97757]" />
                <span>{stockPresentation.badgeText}</span>
              </div>
            )}

            {stockPresentation.tier === 'OUT_OF_STOCK' && (
              <div className="flex items-center gap-1.5 font-medium text-rose-700">
                <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                <span>{stockPresentation.badgeText}</span>
              </div>
            )}

            <span className="font-mono-tabular text-[11px] text-[#64748B]">
              {availableStock > 0 ? `${availableStock} avail.` : '0 avail.'}
            </span>
          </div>

          {/* Animated Terracotta Low-Stock Progress Bar (1 <= stock <= 10) */}
          {stockPresentation.tier === 'LOW_STOCK' && (
            <div className="mt-2">
              <Progress
                value={stockPresentation.stockPercentage}
                className="h-1.5 bg-[#D97757]/20"
                indicatorClassName="bg-[#D97757]"
                aria-label={`Remaining inventory for ${product.name}: ${availableStock} units left`}
              />
            </div>
          )}

          {/* Primary Card Action Button with Framer Motion feedback & Quantity Guard */}
          <div className="mt-3.5">
            {isOutOfStock ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={handleNotifyWhenAvailable}
                disabled={notifying}
                className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isSubscribed
                    ? 'border-[#1B4332]/30 bg-[#1B4332]/10 text-[#1B4332]'
                    : 'border-[#D5CBB8] bg-[#F9F8F6] text-[#0F172A] hover:bg-[#F2EFE9]'
                }`}
              >
                {notifying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Registering Alert...</span>
                  </>
                ) : isSubscribed ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#1B4332]" />
                    <span>Restock Alert Subscribed</span>
                  </>
                ) : (
                  <>
                    <Bell className="h-3.5 w-3.5 text-[#D97757]" />
                    <span>Notify Me When Available</span>
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={handleAddToCart}
                disabled={isMaxStockInCart || buttonState !== 'idle'}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B4332] px-4 py-2 text-xs font-medium text-white hover:bg-[#2D6A4F] disabled:bg-[#E5E0D8] disabled:text-[#64748B] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {buttonState === 'loading' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Adding to Bag...</span>
                  </>
                ) : buttonState === 'success' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Added to Bag</span>
                  </>
                ) : isMaxStockInCart ? (
                  <span>Max Stock ({availableStock}) in Bag</span>
                ) : (
                  <>
                    <span>Add to Bag</span>
                    {quantityInCart > 0 && (
                      <span className="font-mono-tabular text-[11px] text-white/80">
                        ({quantityInCart} in bag)
                      </span>
                    )}
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
};
