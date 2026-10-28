import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Moon,
  Truck,
  Banknote,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DeliverySlotId,
  Product,
  UaeEmirate,
  UaePaymentMethodId,
} from '../types/ecommerce';
import { useStore } from '../store/useStore';
import {
  calculateCheckoutBreakdown,
  UAE_DELIVERY_SLOTS,
  UAE_EMIRATES_LIST,
  UAE_PAYMENT_OPTIONS,
  validateUaeMobileNumber,
} from '../utils/inventory';
import { formatCurrency } from '../lib/utils';
import { submitOrder } from '../services/api';
import { SmartPlantImage } from './SmartPlantImage';
import { Progress } from './ui/progress';

interface CheckoutPageProps {
  allProducts: Product[];
}

const EMIRATE_COMMUNITIES: Record<UaeEmirate, string[]> = {
  Dubai: [
    'Downtown Dubai',
    'Dubai Marina',
    'Al Barari',
    'Palm Jumeirah',
    'Dubai Hills Estate',
    'Jumeirah 1',
  ],
  'Abu Dhabi': [
    'Al Reem Island',
    'Saadiyat Island',
    'Yas Island',
    'Al Raha Beach',
  ],
  Sharjah: ['Aljada', 'Al Majaz', 'Tilal City', 'Al Khan'],
  Ajman: ['Al Zorah', 'Ajman Corniche', 'Al Mowaihat'],
  'Ras Al Khaimah': ['Al Hamra Village', 'Mina Al Arab', 'Al Marjan Island'],
  Fujairah: ['Al Faseel', 'Dibba Al Fujairah', 'Fujairah Corniche'],
  'Umm Al Quwain': ['Al Salamah', 'UAQ Marina', 'Al Raas'],
};

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ allProducts }) => {
  const queryClient = useQueryClient();
  const cart = useStore((s) => s.cart);
  const user = useStore((s) => s.user);
  const navigateToProduct = useStore((s) => s.navigateToProduct);
  const updateCartItemQuantity = useStore((s) => s.updateCartItemQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const addToCart = useStore((s) => s.addToCart);
  const clearCart = useStore((s) => s.clearCart);
  const lastOrder = useStore((s) => s.lastOrder);
  const setLastOrder = useStore((s) => s.setLastOrder);

  // 1. UAE Address Form State
  const [customerName, setCustomerName] = useState(
    user?.name || 'Layla Al Maktoum'
  );
  const [customerEmail, setCustomerEmail] = useState(
    user?.email || 'layla@albarari-botanica.ae'
  );
  const [emirate, setEmirate] = useState<UaeEmirate>('Dubai');
  const [areaCommunity, setAreaCommunity] = useState('Downtown Dubai');
  const [villaBuildingName, setVillaBuildingName] = useState(
    'Boulevard Point Tower, Apt 3402'
  );
  const [uaeMobileRaw, setUaeMobileRaw] = useState('50 482 9104');
  const [mobileTouched, setMobileTouched] = useState(false);

  // 2. Live Plant Delivery Slot Picker State
  const [deliverySlotId, setDeliverySlotId] =
    useState<DeliverySlotId>('morning_chilled_van');

  // 3. Payment Options State
  const [paymentMethodId, setPaymentMethodId] =
    useState<UaePaymentMethodId>('card');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const mobileValidation = validateUaeMobileNumber(uaeMobileRaw);
  const breakdown = calculateCheckoutBreakdown(cart, paymentMethodId);

  const selectedSlot =
    UAE_DELIVERY_SLOTS.find((s) => s.id === deliverySlotId) ||
    UAE_DELIVERY_SLOTS[0];
  const selectedPayment =
    UAE_PAYMENT_OPTIONS.find((p) => p.id === paymentMethodId) ||
    UAE_PAYMENT_OPTIONS[0];

  const handleEmirateChange = (nextEmirate: UaeEmirate) => {
    setEmirate(nextEmirate);
    const suggestions = EMIRATE_COMMUNITIES[nextEmirate];
    if (suggestions && suggestions.length > 0) {
      setAreaCommunity(suggestions[0]);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setMobileTouched(true);

    if (
      !customerName.trim() ||
      !customerEmail.trim() ||
      !areaCommunity.trim() ||
      !villaBuildingName.trim()
    ) {
      setFormError('Please complete all required UAE address fields.');
      return;
    }

    if (!mobileValidation.isValid) {
      setFormError(
        mobileValidation.error ||
          'Please enter a valid UAE mobile number (+971 5X XXX XXXX).'
      );
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const confirmation = await submitOrder({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        uaeMobile: mobileValidation.normalized,
        emirate,
        areaCommunity: areaCommunity.trim(),
        villaBuildingName: villaBuildingName.trim(),
        deliverySlotId,
        deliverySlotLabel: selectedSlot.label,
        paymentMethodId,
        paymentMethodLabel: selectedPayment.label,
        codFee: breakdown.codFee,
        items: cart.map((item) => ({
          productId: item.product.id,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
      });

      setLastOrder(confirmation);
      clearCart();
      await queryClient.invalidateQueries({ queryKey: ['products'] });

      toast.success(`UAE Order ${confirmation.orderId} Confirmed`, {
        description: `${selectedSlot.label} · ${selectedPayment.label}`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to complete checkout.';
      setFormError(message);
      toast.error('Checkout error', { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      data-testid="uae-checkout-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
    >
      {/* Top Breadcrumb Bar */}
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
          <span className="font-semibold text-[#0F172A]">
            UAE Chilled Van Checkout (/checkout)
          </span>
        </div>

        <div className="font-mono-tabular text-xs text-[#64748B]">
          Route: <code className="text-[#1B4332]">/checkout</code> · 5% UAE VAT
          Included in Breakdown
        </div>
      </div>

      {/* Empty Cart + Order Confirmation State */}
      {cart.length === 0 && lastOrder ? (
        <motion.div
          data-testid="checkout-order-confirmation"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl rounded-2xl border border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-xs"
        >
          <div className="flex items-center gap-2.5 text-sm font-semibold text-[#1B4332]">
            <CheckCircle2 className="h-5 w-5 text-[#2D6A4F]" />
            <span>
              Order {lastOrder.orderId} Confirmed — Chilled Botanical Van
              Scheduled
            </span>
          </div>

          <h1 className="mt-2 font-editorial text-2xl sm:text-3xl font-semibold text-[#0F172A]">
            Shukran! Your UAE Greenhouse Dispatch is Reserved.
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#475569] leading-relaxed">
            Our Al Barari horticulturists are misting and securing your plants
            for temperature-controlled transport. We will send an SMS to{' '}
            <strong className="font-mono-tabular text-[#0F172A]">
              {lastOrder.uaeMobile}
            </strong>{' '}
            30 minutes before arrival.
          </p>

          <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-[#E5E0D8] bg-[#F9F8F6] p-4 text-xs">
            <div>
              <dt className="text-[#64748B]">UAE Delivery Address</dt>
              <dd className="mt-0.5 font-semibold text-[#0F172A]">
                {lastOrder.villaBuildingName}, {lastOrder.areaCommunity},{' '}
                {lastOrder.emirate}
              </dd>
            </div>
            <div>
              <dt className="text-[#64748B]">Chilled Van Time Slot</dt>
              <dd className="mt-0.5 font-semibold text-[#1B4332]">
                {lastOrder.deliverySlotLabel}
              </dd>
            </div>
            <div>
              <dt className="text-[#64748B]">Payment Method</dt>
              <dd className="mt-0.5 font-semibold text-[#0F172A]">
                {lastOrder.paymentMethodLabel}
              </dd>
            </div>
            <div>
              <dt className="text-[#64748B]">Total Settled (incl. 5% VAT)</dt>
              <dd className="mt-0.5 font-mono-tabular text-sm font-semibold text-[#1B4332]">
                {formatCurrency(lastOrder.total)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setLastOrder(null);
                navigateToProduct(null);
              }}
              className="rounded-xl bg-[#1B4332] px-5 py-2.5 text-xs font-medium text-white hover:bg-[#2D6A4F] cursor-pointer"
            >
              Return to UAE Nursery Catalog
            </button>
          </div>
        </motion.div>
      ) : cart.length === 0 ? (
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#E5E0D8] bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F9F8F6] border border-[#E5E0D8] text-[#1B4332]">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <h1 className="mt-4 font-editorial text-2xl font-semibold text-[#0F172A]">
            Your Botanical Bag is Currently Empty
          </h1>
          <p className="mt-1.5 text-xs text-[#64748B]">
            Add a plant or planter below to preview the UAE Checkout Page
            (Emirate selector, Chilled Van slot picker, and Tabby/Tamara/COD
            payment options).
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {allProducts
              .filter((p) => p.inventory.availableStock > 0)
              .slice(0, 3)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-xl border border-[#E5E0D8] bg-[#F9F8F6] p-3"
                >
                  <div>
                    <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#ECE7DF]">
                      <SmartPlantImage
                        primaryImage={item.primaryImage}
                        secondaryImage={item.secondaryImage}
                        alt={item.name}
                        showRoomViewPill={false}
                      />
                    </div>
                    <h3 className="mt-2 text-xs font-semibold text-[#0F172A] truncate">
                      {item.name}
                    </h3>
                    <p className="font-mono-tabular text-xs font-semibold text-[#1B4332]">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(item, 1)}
                    data-testid={`checkout-quick-seed-${item.id}`}
                    className="mt-2.5 w-full rounded-lg bg-[#1B4332] py-1.5 text-xs font-medium text-white hover:bg-[#2D6A4F] cursor-pointer"
                  >
                    + Add to Bag for Checkout
                  </button>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left 7 Columns: UAE Address Form, Chilled Van Slot Picker & Payment Options */}
          <form
            id="uae-full-checkout-form"
            onSubmit={handlePlaceOrder}
            className="lg:col-span-7 space-y-6"
          >
            {formError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700"
              >
                {formError}
              </div>
            )}

            {/* SECTION 1: UAE ADDRESS FORM */}
            <section
              aria-labelledby="uae-address-heading"
              className="rounded-2xl border border-[#E5E0D8] bg-white p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#F2EFE9] pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1B4332] text-xs font-semibold text-white">
                    1
                  </span>
                  <div>
                    <h2
                      id="uae-address-heading"
                      className="text-base font-semibold text-[#0F172A]"
                    >
                      UAE Residence &amp; Contact Details
                    </h2>
                    <p className="text-xs text-[#64748B]">
                      Direct door-to-door delivery across all 7 UAE Emirates
                    </p>
                  </div>
                </div>
                <MapPin className="h-4 w-4 text-[#1B4332]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="uae-fullname"
                    className="block text-xs font-medium text-[#334155] mb-1.5"
                  >
                    Recipient Full Name
                  </label>
                  <input
                    id="uae-fullname"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-[#D5CBB8] bg-white px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-[#1B4332] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="uae-email"
                    className="block text-xs font-medium text-[#334155] mb-1.5"
                  >
                    Email Address (Invoice &amp; Care Guide)
                  </label>
                  <input
                    id="uae-email"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#D5CBB8] bg-white px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-[#1B4332] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Emirate Dropdown (7 Emirates) */}
                <div>
                  <label
                    htmlFor="uae-emirate-select"
                    className="block text-xs font-medium text-[#334155] mb-1.5"
                  >
                    Emirate
                  </label>
                  <select
                    id="uae-emirate-select"
                    data-testid="checkout-emirate-select"
                    value={emirate}
                    onChange={(e) =>
                      handleEmirateChange(e.target.value as UaeEmirate)
                    }
                    className="w-full rounded-xl border border-[#D5CBB8] bg-white px-3.5 py-2.5 text-xs font-medium text-[#0F172A] focus:border-[#1B4332] focus:outline-none cursor-pointer"
                  >
                    {UAE_EMIRATES_LIST.map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                </div>

                {/* UAE Mobile Number with +971 Prefix Validation */}
                <div>
                  <label
                    htmlFor="uae-mobile-input"
                    className="block text-xs font-medium text-[#334155] mb-1.5"
                  >
                    UAE Mobile Number (Chilled Van Driver SMS)
                  </label>
                  <div className="flex items-stretch">
                    <span className="inline-flex items-center gap-1 rounded-l-xl border border-r-0 border-[#D5CBB8] bg-[#F2EFE9] px-3 font-mono-tabular text-xs font-semibold text-[#1B4332] select-none">
                      <Phone className="h-3 w-3" />
                      <span>+971</span>
                    </span>
                    <input
                      id="uae-mobile-input"
                      data-testid="checkout-mobile-input"
                      type="tel"
                      required
                      value={uaeMobileRaw}
                      onBlur={() => setMobileTouched(true)}
                      onChange={(e) => setUaeMobileRaw(e.target.value)}
                      placeholder="50 123 4567"
                      className={`w-full rounded-r-xl border bg-white px-3.5 py-2.5 font-mono-tabular text-xs text-[#0F172A] focus:outline-none ${
                        mobileTouched && !mobileValidation.isValid
                          ? 'border-rose-500 focus:border-rose-600'
                          : 'border-[#D5CBB8] focus:border-[#1B4332]'
                      }`}
                    />
                  </div>
                  {mobileTouched && !mobileValidation.isValid ? (
                    <p
                      data-testid="checkout-mobile-error"
                      className="mt-1 text-[11px] font-medium text-rose-600"
                    >
                      {mobileValidation.error}
                    </p>
                  ) : (
                    <p className="mt-1 font-mono-tabular text-[11px] text-[#64748B]">
                      Validated UAE format: {mobileValidation.normalized}
                    </p>
                  )}
                </div>
              </div>

              {/* Area / Community Input with Quick Community Chips */}
              <div>
                <label
                  htmlFor="uae-area-input"
                  className="block text-xs font-medium text-[#334155] mb-1.5"
                >
                  Area / Community (e.g., Downtown Dubai, Dubai Marina, Al Reem
                  Island)
                </label>
                <input
                  id="uae-area-input"
                  data-testid="checkout-area-input"
                  type="text"
                  required
                  value={areaCommunity}
                  onChange={(e) => setAreaCommunity(e.target.value)}
                  placeholder="Downtown Dubai, Dubai Marina, Al Reem Island..."
                  className="w-full rounded-xl border border-[#D5CBB8] bg-white px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-[#1B4332] focus:outline-none"
                />
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[#64748B]">
                    Popular in {emirate}:
                  </span>
                  {EMIRATE_COMMUNITIES[emirate].map((comm) => (
                    <button
                      key={comm}
                      type="button"
                      onClick={() => setAreaCommunity(comm)}
                      className={`rounded-md border px-2 py-0.5 text-[11px] transition-colors cursor-pointer ${
                        areaCommunity === comm
                          ? 'border-[#1B4332] bg-[#1B4332] text-white'
                          : 'border-[#E5E0D8] bg-[#F9F8F6] text-[#334155] hover:border-[#1B4332]/40'
                      }`}
                    >
                      {comm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Villa / Building Name Input */}
              <div>
                <label
                  htmlFor="uae-villa-input"
                  className="block text-xs font-medium text-[#334155] mb-1.5"
                >
                  Villa / Building Name &amp; Apartment / Street Number
                </label>
                <input
                  id="uae-villa-input"
                  data-testid="checkout-villa-input"
                  type="text"
                  required
                  value={villaBuildingName}
                  onChange={(e) => setVillaBuildingName(e.target.value)}
                  placeholder="e.g., Villa 18, Street 4 or Marina Gate Tower 1, Apt 2402"
                  className="w-full rounded-xl border border-[#D5CBB8] bg-white px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-[#1B4332] focus:outline-none"
                />
              </div>
            </section>

            {/* SECTION 2: LIVE PLANT DELIVERY SLOT PICKER */}
            <section
              aria-labelledby="uae-slot-heading"
              className="rounded-2xl border border-[#E5E0D8] bg-white p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F2EFE9] pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1B4332] text-xs font-semibold text-white">
                    2
                  </span>
                  <div>
                    <h2
                      id="uae-slot-heading"
                      className="text-base font-semibold text-[#0F172A]"
                    >
                      Live Plant Chilled Van Delivery Slot
                    </h2>
                    <p className="text-xs text-[#64748B]">
                      All botanical specimens travel in 18°C climate-controlled
                      vans to prevent UAE heat shock
                    </p>
                  </div>
                </div>
                <Truck className="h-4 w-4 text-[#1B4332]" />
              </div>

              <div
                role="radiogroup"
                aria-label="Select live plant delivery time slot"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              >
                {UAE_DELIVERY_SLOTS.map((slot) => {
                  const isSelected = deliverySlotId === slot.id;
                  const Icon =
                    slot.id === 'morning_chilled_van' ? Sun : Moon;

                  return (
                    <motion.button
                      key={slot.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDeliverySlotId(slot.id)}
                      data-testid={`delivery-slot-${slot.id}`}
                      className={`relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#1B4332] bg-[#1B4332]/6 ring-2 ring-[#1B4332]/20'
                          : 'border-[#E5E0D8] bg-[#F9F8F6]/70 hover:border-[#1B4332]/40'
                      }`}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="uae-delivery-slot-highlight"
                          className="pointer-events-none absolute inset-0 rounded-xl border-2 border-[#1B4332]"
                          transition={{
                            type: 'spring',
                            stiffness: 360,
                            damping: 30,
                          }}
                        />
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              isSelected
                                ? 'bg-[#1B4332] text-white'
                                : 'bg-white border border-[#E5E0D8] text-[#1B4332]'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <span className="block text-[11px] font-semibold text-[#D97757]">
                              {slot.badge}
                            </span>
                            <span className="text-xs font-semibold text-[#0F172A]">
                              {slot.label}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="h-4 w-4 text-[#1B4332] shrink-0" />
                        )}
                      </div>

                      <p className="mt-2.5 text-[11px] text-[#475569] leading-relaxed">
                        {slot.description}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </section>

            {/* SECTION 3: PAYMENT OPTIONS UI */}
            <section
              aria-labelledby="uae-payment-heading"
              className="rounded-2xl border border-[#E5E0D8] bg-white p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F2EFE9] pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1B4332] text-xs font-semibold text-white">
                    3
                  </span>
                  <div>
                    <h2
                      id="uae-payment-heading"
                      className="text-base font-semibold text-[#0F172A]"
                    >
                      UAE Payment Method (AED)
                    </h2>
                    <p className="text-xs text-[#64748B]">
                      Encrypted AED checkout with Tabby/Tamara 4× split or Cash
                      on Delivery
                    </p>
                  </div>
                </div>
                <CreditCard className="h-4 w-4 text-[#1B4332]" />
              </div>

              <div
                role="radiogroup"
                aria-label="Select payment method"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              >
                {UAE_PAYMENT_OPTIONS.map((option) => {
                  const isSelected = paymentMethodId === option.id;
                  const Icon =
                    option.id === 'card'
                      ? CreditCard
                      : option.id === 'apple_pay'
                      ? Smartphone
                      : option.id === 'tabby_tamara'
                      ? Sparkles
                      : Banknote;

                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethodId(option.id)}
                      data-testid={`payment-option-${option.id}`}
                      className={`relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#1B4332] bg-[#1B4332]/6 ring-2 ring-[#1B4332]/20'
                          : 'border-[#E5E0D8] bg-[#F9F8F6]/70 hover:border-[#1B4332]/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                              isSelected
                                ? 'bg-[#1B4332] text-white'
                                : 'bg-white border border-[#E5E0D8] text-[#1B4332]'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-xs font-semibold text-[#0F172A] leading-snug">
                            {option.label}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-[#1B4332] shrink-0" />
                        )}
                      </div>

                      <p className="mt-2 text-[11px] text-[#475569] leading-relaxed">
                        {option.subtitle}
                      </p>

                      {option.id === 'tabby_tamara' && (
                        <div className="mt-2.5 rounded-lg border border-[#E5E0D8] bg-white px-2.5 py-1.5 font-mono-tabular text-[11px] font-semibold text-[#1B4332]">
                          4 × {formatCurrency(breakdown.splitInFourInstallmentAed)}{' '}
                          / month (0% interest)
                        </div>
                      )}

                      {option.id === 'cod' && (
                        <div className="mt-2.5 rounded-lg border border-[#D97757]/30 bg-[#D97757]/10 px-2.5 py-1 font-mono-tabular text-[11px] font-semibold text-[#D97757]">
                          Adds +AED 15.00 Cash Handling Fee
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </section>
          </form>

          {/* Right 5 Columns: Sticky Order Summary, Free UAE Delivery Bar & 5% VAT Breakdown */}
          <aside className="lg:col-span-5 lg:sticky lg:top-20 space-y-5">
            <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[#F2EFE9] pb-3.5">
                <h2 className="text-base font-semibold text-[#0F172A]">
                  Botanical Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)})
                </h2>
                <span className="font-mono-tabular text-xs text-[#1B4332] font-semibold">
                  AED Currency
                </span>
              </div>

              {/* Free Express Dubai/UAE Delivery Progress Bar (AED 200) */}
              <div className="rounded-xl border border-[#E5E0D8] bg-[#F9F8F6] p-3.5">
                <div className="flex items-center justify-between text-xs mb-2 gap-2">
                  <span className="font-medium text-[#0F172A]">
                    {breakdown.isUnlocked ? (
                      <strong className="text-[#1B4332]">
                        Free Express Dubai/UAE Delivery Unlocked!
                      </strong>
                    ) : (
                      <>
                        Add{' '}
                        <strong className="font-mono-tabular text-[#1B4332]">
                          {formatCurrency(breakdown.remainingForFreeShipping)}
                        </strong>{' '}
                        more for Free Express Dubai/UAE Delivery!
                      </>
                    )}
                  </span>
                  <span className="font-mono-tabular text-[11px] text-[#64748B]">
                    {breakdown.progressPercent}%
                  </span>
                </div>
                <Progress
                  value={breakdown.progressPercent}
                  className="h-1.5 bg-[#E5E0D8]"
                  indicatorClassName={
                    breakdown.isUnlocked ? 'bg-[#1B4332]' : 'bg-[#D97757]'
                  }
                />
              </div>

              {/* Line Items List with Lively SmartPlantImage */}
              <ul className="max-h-72 overflow-y-auto divide-y divide-[#F2EFE9] pr-1">
                {cart.map(({ product, quantity }) => {
                  const maxStock = product.inventory.availableStock;
                  return (
                    <li
                      key={product.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-14 w-14 rounded-lg overflow-hidden border border-[#E5E0D8] shrink-0">
                          <SmartPlantImage
                            primaryImage={product.primaryImage}
                            secondaryImage={product.secondaryImage}
                            alt={product.name}
                            showRoomViewPill={false}
                            className="h-full w-full"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-semibold text-[#0F172A] truncate">
                            {product.name}
                          </h3>
                          <p className="text-[11px] text-[#64748B] truncate">
                            {product.subtitle}
                          </p>
                          <div className="mt-1 inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateCartItemQuantity(
                                  product.id,
                                  quantity - 1,
                                  maxStock
                                )
                              }
                              className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E0D8] bg-[#F9F8F6] text-[#475569] hover:text-[#1B4332] cursor-pointer"
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </button>
                            <span className="font-mono-tabular text-xs font-semibold px-1">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              disabled={quantity >= maxStock}
                              onClick={() =>
                                updateCartItemQuantity(
                                  product.id,
                                  quantity + 1,
                                  maxStock
                                )
                              }
                              className="flex h-5 w-5 items-center justify-center rounded border border-[#E5E0D8] bg-[#F9F8F6] text-[#475569] hover:text-[#1B4332] disabled:opacity-35 cursor-pointer"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromCart(product.id)}
                              aria-label={`Remove ${product.name}`}
                              className="ml-1 text-[#94A3B8] hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <span className="font-mono-tabular text-xs font-semibold text-[#1B4332] shrink-0">
                        {formatCurrency(product.price * quantity)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Breakdown with 5% UAE VAT & Optional +AED 15 COD */}
              <div className="space-y-2 border-t border-[#E5E0D8] pt-4 text-xs">
                <div className="flex justify-between text-[#475569]">
                  <span>Subtotal</span>
                  <span className="font-mono-tabular font-medium text-[#0F172A]">
                    {formatCurrency(breakdown.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-[#475569]">
                  <span>Chilled Van Delivery ({emirate})</span>
                  <span className="font-mono-tabular font-medium text-[#1B4332]">
                    {breakdown.shippingCost === 0
                      ? 'FREE (Over AED 200)'
                      : formatCurrency(breakdown.shippingCost)}
                  </span>
                </div>

                <div className="flex justify-between text-[#475569]">
                  <span>UAE VAT (5%)</span>
                  <span className="font-mono-tabular font-medium text-[#0F172A]">
                    {formatCurrency(breakdown.vatAmount)}
                  </span>
                </div>

                <AnimatePresence>
                  {breakdown.codFee > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      data-testid="checkout-cod-fee-row"
                      className="flex justify-between text-[#D97757] font-medium"
                    >
                      <span>Cash on Delivery Fee (+AED 15)</span>
                      <span className="font-mono-tabular">
                        {formatCurrency(breakdown.codFee)}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-baseline justify-between border-t border-[#E5E0D8] pt-3 text-base font-semibold text-[#0F172A]">
                  <span>Total (incl. 5% UAE VAT)</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={breakdown.finalTotalWithVatAndCod}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.14 }}
                      data-testid="checkout-final-total"
                      className="font-mono-tabular text-lg text-[#1B4332]"
                    >
                      {formatCurrency(breakdown.finalTotalWithVatAndCod)}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                form="uae-full-checkout-form"
                whileTap={{ scale: 0.97 }}
                disabled={isSubmitting}
                data-testid="checkout-submit-btn"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] py-3.5 px-5 text-sm font-medium text-white hover:bg-[#2D6A4F] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Scheduling UAE Chilled Van...</span>
                  </>
                ) : (
                  <span>
                    Complete UAE Order ·{' '}
                    {formatCurrency(breakdown.finalTotalWithVatAndCod)}
                  </span>
                )}
              </motion.button>

              <div className="flex items-start gap-2 text-[11px] text-[#64748B]">
                <ShieldCheck className="h-4 w-4 text-[#1B4332] shrink-0 mt-0.5" />
                <span>
                  Backed by our 30-Day Healthy Root Guarantee &amp; live Spring
                  Boot greenhouse stock reservation.
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </motion.div>
  );
};
