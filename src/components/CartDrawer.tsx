import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Truck,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useStore } from '../store/useStore';
import { calculateFreeShippingSummary } from '../utils/inventory';
import { formatCurrency } from '../lib/utils';
import { Progress } from './ui/progress';
import { submitOrder } from '../services/api';

export const CartDrawer: React.FC = () => {
  const queryClient = useQueryClient();
  const isCartOpen = useStore((s) => s.isCartOpen);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const user = useStore((s) => s.user);
  const updateCartItemQuantity = useStore((s) => s.updateCartItemQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const clearCart = useStore((s) => s.clearCart);
  const lastOrder = useStore((s) => s.lastOrder);
  const setLastOrder = useStore((s) => s.setLastOrder);
  const navigateToCheckout = useStore((s) => s.navigateToCheckout);

  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState(
    user?.name || 'Layla Al Maktoum'
  );
  const [customerEmail, setCustomerEmail] = useState(
    user?.email || 'layla@albarari-botanica.ae'
  );
  const [shippingAddress, setShippingAddress] = useState(
    'Al Wasl Road, Villa 18, Jumeirah 1'
  );
  const [city, setCity] = useState('Dubai');
  const [postalCode, setPostalCode] = useState('00000');
  const [formError, setFormError] = useState<string | null>(null);

  const shippingSummary = calculateFreeShippingSummary(cart);

  const handleClose = () => {
    setCartOpen(false);
    setTimeout(() => {
      setIsCheckoutStep(false);
      setFormError(null);
    }, 250);
  };

  const handleQuantityStep = (
    productId: string,
    productName: string,
    targetQty: number,
    availableStock: number
  ) => {
    if (targetQty > availableStock) {
      toast.warning(`Quantity Guard: Only ${availableStock} units available`, {
        description: `Cannot exceed greenhouse stock (${availableStock}) for ${productName}.`,
      });
      return;
    }
    updateCartItemQuantity(productId, targetQty, availableStock);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !customerName.trim() ||
      !customerEmail.trim() ||
      !shippingAddress.trim() ||
      !city.trim() ||
      !postalCode.trim()
    ) {
      setFormError('Please complete all required UAE delivery fields.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const confirmation = await submitOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        uaeMobile: '+971 50 482 9104',
        emirate: 'Dubai',
        areaCommunity: city.trim() || 'Downtown Dubai',
        villaBuildingName: shippingAddress.trim(),
        deliverySlotId: 'morning_chilled_van',
        deliverySlotLabel: 'Next-Day Morning Chilled Van (9 AM - 1 PM)',
        paymentMethodId: 'card',
        paymentMethodLabel: 'Credit/Debit Card',
        items: cart.map((item) => ({
          productId: item.product.id,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
      });

      setLastOrder(confirmation);
      clearCart();
      setIsCheckoutStep(false);
      await queryClient.invalidateQueries({ queryKey: ['products'] });

      toast.success(`Order ${confirmation.orderId} confirmed`, {
        description:
          'Spring Boot Inventory decremented & chilled botanical van scheduled.',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to process order.';
      setFormError(message);
      toast.error('Order submission failed', { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs"
          />

          {/* Slide-over Drawer with Spring Physics (stiffness: 300, damping: 30) */}
          <motion.aside
            key="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping Bag"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-md flex-col border-l border-[#E5E0D8] bg-[#F9F8F6] shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#E5E0D8] bg-white px-6 py-4">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-4 w-4 text-[#1B4332]" />
                <h2 className="text-base font-semibold text-[#0F172A]">
                  {isCheckoutStep
                    ? 'Dubai / UAE Express Checkout'
                    : 'Your Botanical Bag'}
                </h2>
                <span className="font-mono-tabular text-xs text-[#64748B]">
                  ({cart.reduce((s, i) => s + i.quantity, 0)})
                </span>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={handleClose}
                aria-label="Close shopping bag"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#475569] hover:bg-[#F2EFE9] hover:text-[#1B4332] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Dynamic Free Shipping Progress Bar (AED 200 Threshold) */}
            <div className="border-b border-[#E5E0D8] bg-white/85 px-6 py-3.5">
              <div className="flex items-center justify-between text-xs mb-2 gap-2">
                <div className="flex items-center gap-1.5 font-medium text-[#0F172A]">
                  <Truck className="h-3.5 w-3.5 text-[#1B4332] shrink-0" />
                  {shippingSummary.isUnlocked ? (
                    <span className="text-[#1B4332] font-semibold">
                      Free Express Dubai/UAE Delivery Unlocked!
                    </span>
                  ) : (
                    <span>
                      Add{' '}
                      <strong className="font-mono-tabular font-semibold text-[#1B4332]">
                        {formatCurrency(shippingSummary.remainingForFreeShipping)}
                      </strong>{' '}
                      more for Free Express Dubai/UAE Delivery!
                    </span>
                  )}
                </div>
                <span className="font-mono-tabular text-[11px] text-[#64748B] shrink-0">
                  {shippingSummary.progressPercent}%
                </span>
              </div>
              <Progress
                value={shippingSummary.progressPercent}
                className="h-1.5 bg-[#E5E0D8]"
                indicatorClassName={
                  shippingSummary.isUnlocked ? 'bg-[#1B4332]' : 'bg-[#D97757]'
                }
                aria-label="Free UAE delivery threshold progress"
              />
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {cart.length === 0 && lastOrder ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-[#E5E0D8] bg-white p-5"
                >
                  <div className="flex items-center gap-2 text-[#1B4332] text-xs font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      Order {lastOrder.orderId} Confirmed — Preparing Chilled Van
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#475569] leading-relaxed">
                    Your plants are being misted and packed in our Al Barari greenhouse. Live Spring Boot stock levels have been updated.
                  </p>
                  <div className="mt-4 space-y-2 border-t border-[#F2EFE9] pt-3 text-xs">
                    <div className="flex justify-between text-[#475569]">
                      <span>UAE Delivery Address</span>
                      <span className="font-medium text-[#0F172A]">
                        {lastOrder.shippingAddress}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#475569]">
                      <span>Dispatch Service</span>
                      <span className="font-medium text-[#0F172A]">
                        {lastOrder.estimatedDelivery}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#475569]">
                      <span>5% UAE VAT Included</span>
                      <span className="font-mono-tabular font-medium text-[#0F172A]">
                        {formatCurrency(lastOrder.tax)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-[#1B4332] pt-1 border-t border-[#F2EFE9]">
                      <span>Total Paid (incl. VAT)</span>
                      <span className="font-mono-tabular">
                        {formatCurrency(lastOrder.total)}
                      </span>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setLastOrder(null);
                      handleClose();
                    }}
                    className="mt-4 w-full rounded-lg bg-[#1B4332] py-2 text-xs font-medium text-white hover:bg-[#2D6A4F] cursor-pointer"
                  >
                    Continue Exploring Nursery
                  </motion.button>
                </motion.div>
              ) : cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center py-12">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E5E0D8] bg-white text-[#1B4332]">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-[#0F172A]">
                    Your botanical bag is empty
                  </h3>
                  <p className="mt-1 max-w-xs text-xs text-[#64748B] leading-relaxed">
                    Explore our indoor air-purifiers, pet-safe Calatheas, and UAE heat-tolerant olive trees.
                  </p>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={handleClose}
                    className="mt-5 rounded-lg bg-[#1B4332] px-4 py-2 text-xs font-medium text-white hover:bg-[#2D6A4F] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Browse Plants &amp; Pots
                  </motion.button>
                </div>
              ) : isCheckoutStep ? (
                <form
                  id="checkout-form"
                  onSubmit={handlePlaceOrder}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-[#0F172A]">
                      UAE Recipient &amp; Villa / Apartment Details
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsCheckoutStep(false)}
                      className="text-xs text-[#1B4332] hover:underline cursor-pointer"
                    >
                      Edit Bag ({cart.length})
                    </button>
                  </div>

                  {formError && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="checkout-name"
                      className="block text-xs font-medium text-[#334155] mb-1"
                    >
                      Full Name
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-lg border border-[#D5CBB8] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#1B4332] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-email"
                      className="block text-xs font-medium text-[#334155] mb-1"
                    >
                      Email for Delivery &amp; Care Guide
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full rounded-lg border border-[#D5CBB8] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#1B4332] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-address"
                      className="block text-xs font-medium text-[#334155] mb-1"
                    >
                      Villa / Tower &amp; Street Address
                    </label>
                    <input
                      id="checkout-address"
                      type="text"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full rounded-lg border border-[#D5CBB8] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#1B4332] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="checkout-city"
                        className="block text-xs font-medium text-[#334155] mb-1"
                      >
                        Emirate
                      </label>
                      <input
                        id="checkout-city"
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full rounded-lg border border-[#D5CBB8] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#1B4332] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="checkout-postal"
                        className="block text-xs font-medium text-[#334155] mb-1"
                      >
                        Makani / P.O. Box
                      </label>
                      <input
                        id="checkout-postal"
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full rounded-lg border border-[#D5CBB8] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#1B4332] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E5E0D8] bg-white p-3.5 text-xs text-[#475569] flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-[#1B4332] shrink-0 mt-0.5" />
                    <span>
                      Submitting this order calls{' '}
                      <code className="font-mono-tabular text-[#1B4332]">
                        POST /api/v1/orders
                      </code>{' '}
                      and atomically decrements live UAE greenhouse stock.
                    </span>
                  </div>
                </form>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {cart.map(({ product, quantity }) => {
                      const maxStock = product.inventory.availableStock;
                      const isAtMax = quantity >= maxStock;

                      return (
                        <motion.li
                          key={product.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 40 }}
                          transition={{ duration: 0.22 }}
                          className="flex gap-3.5 rounded-xl border border-[#E5E0D8] bg-white p-3.5"
                        >
                          <img
                            src={product.primaryImage}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="h-20 w-20 rounded-lg border border-[#F2EFE9] bg-[#F9F8F6] object-cover shrink-0"
                          />

                          <div className="flex flex-1 flex-col justify-between min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-[#0F172A] truncate">
                                  {product.name}
                                </h4>
                                <p className="text-[11px] text-[#64748B] font-mono-tabular">
                                  {product.plantSize} · {maxStock} in greenhouse
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  removeFromCart(product.id);
                                  toast.info(`Removed ${product.name} from bag`);
                                }}
                                aria-label={`Remove ${product.name} from bag`}
                                className="text-[#94A3B8] hover:text-rose-600 transition-colors p-1 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="mt-2.5 flex items-center justify-between gap-2">
                              {/* Quantity Stepper with Quantity Guard */}
                              <div className="inline-flex items-center rounded-lg border border-[#E5E0D8] bg-[#F9F8F6]">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuantityStep(
                                      product.id,
                                      product.name,
                                      quantity - 1,
                                      maxStock
                                    )
                                  }
                                  aria-label={`Decrease quantity of ${product.name}`}
                                  className="flex h-7 w-7 items-center justify-center text-[#475569] hover:text-[#1B4332] cursor-pointer"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span
                                  data-testid={`cart-qty-${product.id}`}
                                  className="px-2.5 font-mono-tabular text-xs font-semibold text-[#0F172A]"
                                >
                                  {quantity}
                                </span>
                                <button
                                  type="button"
                                  disabled={isAtMax}
                                  onClick={() =>
                                    handleQuantityStep(
                                      product.id,
                                      product.name,
                                      quantity + 1,
                                      maxStock
                                    )
                                  }
                                  aria-label={`Increase quantity of ${product.name}`}
                                  className="flex h-7 w-7 items-center justify-center text-[#475569] hover:text-[#1B4332] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>

                              <div className="text-right">
                                <span className="font-mono-tabular text-xs font-semibold text-[#1B4332]">
                                  {formatCurrency(product.price * quantity)}
                                </span>
                                {isAtMax && (
                                  <span className="block text-[10px] font-semibold text-[#D97757]">
                                    Max stock ({maxStock})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Drawer Footer with AED Totals, 5% UAE VAT & Primary CTA */}
            {cart.length > 0 && (
              <div className="border-t border-[#E5E0D8] bg-white px-6 py-4 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#475569]">
                    <span>Subtotal</span>
                    <span className="font-mono-tabular font-medium text-[#0F172A]">
                      {formatCurrency(shippingSummary.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#475569]">
                    <span>Express Dubai / UAE Chilled Van</span>
                    <span className="font-mono-tabular font-medium text-[#1B4332]">
                      {shippingSummary.shippingCost === 0
                        ? 'FREE (Over AED 200)'
                        : formatCurrency(shippingSummary.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#475569]">
                    <span>UAE VAT (5%)</span>
                    <span className="font-mono-tabular font-medium text-[#0F172A]">
                      {formatCurrency(shippingSummary.vatAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-[#F2EFE9] pt-2 text-sm font-semibold text-[#0F172A]">
                    <span>Total (incl. 5% UAE VAT)</span>
                    <span className="font-mono-tabular text-[#1B4332]">
                      {formatCurrency(shippingSummary.totalWithVat)}
                    </span>
                  </div>
                </div>

                {isCheckoutStep ? (
                  <motion.button
                    type="submit"
                    form="checkout-form"
                    whileTap={{ scale: 0.96 }}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B4332] py-2.5 px-4 text-xs font-medium text-white hover:bg-[#2D6A4F] disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Committing Greenhouse Stock...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          Confirm UAE Order ({formatCurrency(shippingSummary.totalWithVat)})
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigateToCheckout()}
                    data-testid="drawer-proceed-checkout"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1B4332] py-2.5 px-4 text-xs font-medium text-white hover:bg-[#2D6A4F] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>Proceed to UAE Express Checkout (/checkout)</span>
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
