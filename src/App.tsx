/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import {
  SlidersHorizontal,
  RefreshCw,
  ShieldCheck,
  Truck,
  Sprout,
} from 'lucide-react';
import { fetchProducts, INITIAL_PRODUCTS } from './services/api';
import { useStore } from './store/useStore';
import { CategoryId } from './types/ecommerce';
import {
  filterAndSortProducts,
  matchesPlantFinderCategory,
} from './utils/inventory';
import { Navbar } from './components/Navbar';
import { BentoHero } from './components/BentoHero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CheckoutPage } from './components/CheckoutPage';
import { CartDrawer } from './components/CartDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { SearchModal } from './components/SearchModal';
import { InventorySimulatorModal } from './components/InventorySimulatorModal';
import { Skeleton } from './components/ui/skeleton';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchInterval: 30_000, // Background inventory polling
      refetchOnWindowFocus: true,
    },
  },
});

const PLANT_FINDER_PILLS: Array<{ id: CategoryId; label: string }> = [
  { id: 'all', label: 'All Plants' },
  { id: 'air_purifiers', label: 'Indoor Air Purifiers' },
  { id: 'pet_safe', label: 'Pet Safe 🐾' },
  { id: 'low_light', label: 'Survives Low Light' },
  { id: 'uae_heat_tolerant', label: 'Outdoor UAE Heat Tolerant' },
  { id: 'pots_and_soil', label: 'Pots & Soil' },
];

const StorefrontContent: React.FC = () => {
  const activeProductId = useStore((s) => s.activeProductId);
  const isCheckoutOpen = useStore((s) => s.isCheckoutOpen);
  const navigateToProduct = useStore((s) => s.navigateToProduct);
  const selectedCategory = useStore((s) => s.selectedCategory);
  const setSelectedCategory = useStore((s) => s.setSelectedCategory);
  const stockFilter = useStore((s) => s.stockFilter);
  const setStockFilter = useStore((s) => s.setStockFilter);
  const sortBy = useStore((s) => s.sortBy);
  const setSortBy = useStore((s) => s.setSortBy);
  const setInventoryConsoleOpen = useStore((s) => s.setInventoryConsoleOpen);
  const syncCartWithLatestInventory = useStore(
    (s) => s.syncCartWithLatestInventory
  );

  const {
    data: products = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  // Sync browser Back/Forward navigation with /product/:id and /checkout route states
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/checkout') {
        useStore.setState({ isCheckoutOpen: true, activeProductId: null });
        return;
      }
      const match = path.match(/^\/product\/([^/]+)/);
      const nextId = match ? decodeURIComponent(match[1]) : null;
      useStore.setState({ activeProductId: nextId, isCheckoutOpen: false });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keep persisted cart quantities synchronized with latest Spring Boot greenhouse stock
  useEffect(() => {
    if (products.length > 0) {
      syncCartWithLatestInventory(products);
    }
  }, [products, syncCartWithLatestInventory]);

  const catalogSource = products.length > 0 ? products : INITIAL_PRODUCTS;
  const activeProduct = activeProductId
    ? catalogSource.find((p) => p.id === activeProductId) || null
    : null;

  const filteredProducts = filterAndSortProducts(products, {
    category: selectedCategory,
    searchQuery: '',
    stockFilter,
    sortBy,
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F6] text-[#0F172A] pb-16 md:pb-0">
      {/* 1. Sticky Glassmorphic Navbar with Cmd+K Search & Cart Badge */}
      <Navbar />

      <main className="flex-1">
        {isCheckoutOpen ? (
          <CheckoutPage allProducts={catalogSource} />
        ) : activeProduct ? (
          <ProductDetailPage
            product={activeProduct}
            allProducts={catalogSource}
          />
        ) : activeProductId ? (
          <div className="mx-auto max-w-3xl px-4 py-20 text-center">
            <h1 className="font-editorial text-2xl font-semibold text-[#0F172A]">
              Botanical Specimen Not Found
            </h1>
            <p className="mt-2 text-xs text-[#64748B]">
              We could not locate specimen ID &ldquo;{activeProductId}&rdquo; in our Al Barari greenhouse catalog.
            </p>
            <button
              type="button"
              onClick={() => navigateToProduct(null)}
              className="mt-5 rounded-lg bg-[#1B4332] px-4 py-2 text-xs font-medium text-white hover:bg-[#2D6A4F] cursor-pointer"
            >
              Return to UAE Nursery Catalog
            </button>
          </div>
        ) : (
          <>
            {/* 2. Homepage Bento Hero Section */}
            <BentoHero products={products} isLoading={isLoading} />

            {/* 3. Featured Collection Section with Interactive "Plant Finder" Quick-Filter Bar */}
            <section
              id="collection-grid"
              aria-labelledby="collection-heading"
              className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 border-t border-[#E5E0D8]"
            >
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <span>02. Interactive Plant Finder</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  {filteredProducts.length} of {products.length} Specimens Shown
                </span>
              </div>
              <h2
                id="collection-heading"
                className="mt-1.5 font-editorial text-2xl sm:text-3xl font-semibold text-[#0F172A]"
              >
                Greenhouse Specimens, Planters &amp; Botanical Care
              </h2>
            </div>

            {/* Secondary Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Stock Availability Filter */}
              <select
                aria-label="Filter by greenhouse stock tier"
                value={stockFilter}
                onChange={(e) =>
                  setStockFilter(
                    e.target.value as
                      | 'all'
                      | 'in_stock'
                      | 'low_stock'
                      | 'out_of_stock'
                  )
                }
                className="h-9 rounded-lg border border-[#E5E0D8] bg-white px-3 text-xs font-medium text-[#0F172A] focus:border-[#1B4332] focus:outline-none cursor-pointer"
              >
                <option value="all">All Stock Tiers</option>
                <option value="in_stock">Available Now (&gt; 0)</option>
                <option value="low_stock">Low Stock Only (1–10 left)</option>
                <option value="out_of_stock">Out of Stock (0 left)</option>
              </select>

              {/* Sort Order Select */}
              <select
                aria-label="Sort plants and pots"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | 'featured'
                      | 'price_asc'
                      | 'price_desc'
                      | 'stock_asc'
                  )
                }
                className="h-9 rounded-lg border border-[#E5E0D8] bg-white px-3 text-xs font-medium text-[#0F172A] focus:border-[#1B4332] focus:outline-none cursor-pointer"
              >
                <option value="featured">Sort: Horticulturist Picks</option>
                <option value="price_asc">Price: Low to High (AED)</option>
                <option value="price_desc">Price: High to Low (AED)</option>
                <option value="stock_asc">Inventory: Scarcest First</option>
              </select>

              {/* Background Poll / Manual Sync Button */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => refetch()}
                aria-label="Sync inventory with Spring Boot API"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E0D8] bg-white px-3 text-xs font-medium text-[#1B4332] hover:bg-[#F2EFE9] hover:border-[#1B4332]/40 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`}
                />
                <span>Sync Stock</span>
              </motion.button>
            </div>
          </div>

          {/* Interactive "Plant Finder" Quick-Filter Bar with Animated Toggle Pills */}
          <div
            role="tablist"
            aria-label="Plant Finder quick filters"
            className="mt-6 flex items-center gap-1.5 overflow-x-auto rounded-xl border border-[#E5E0D8] bg-[#F2EFE9]/90 p-1.5"
          >
            {PLANT_FINDER_PILLS.map((tab) => {
              const active = selectedCategory === tab.id;
              const count = products.filter((p) =>
                matchesPlantFinderCategory(p, tab.id)
              ).length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-white'
                      : 'text-[#334155] hover:text-[#1B4332]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="plant-finder-pill-active"
                      className="absolute inset-0 rounded-lg bg-[#1B4332] shadow-xs"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 32,
                      }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  <span
                    className={`relative z-10 font-mono-tabular text-[11px] ${
                      active ? 'text-white/80' : 'text-[#64748B]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Responsive Product Grid: 1-col (mobile), 2-col (tablet), 4-col (desktop) */}
          {isLoading ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex flex-col rounded-2xl border border-[#E5E0D8] bg-white p-4 space-y-4"
                >
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[#E5E0D8] bg-white py-16 px-6 text-center">
              <h3 className="text-base font-semibold text-[#0F172A]">
                No botanical specimens match your current filter selection
              </h3>
              <p className="mt-1 text-xs text-[#64748B]">
                Reset the Plant Finder or stock availability filter to browse all UAE nursery plants and planters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setStockFilter('all');
                }}
                className="mt-4 rounded-lg bg-[#1B4332] px-4 py-2 text-xs font-medium text-white hover:bg-[#2D6A4F] cursor-pointer"
              >
                Reset Plant Finder
              </button>
            </div>
          ) : (
            <motion.div
              layout
              className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* 4. UAE Greenhouse Provenance & Horticultural Guarantee Section */}
        <section
          aria-labelledby="craftsmanship-heading"
          className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 border-t border-[#E5E0D8]"
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <span>03. Al Barari Greenhouse Provenance</span>
                <span aria-hidden="true">·</span>
                <span>UAE Climate Acclimated</span>
              </div>
              <h2
                id="craftsmanship-heading"
                className="mt-2 font-editorial text-2xl sm:text-3xl font-semibold text-[#0F172A]"
                style={{ textWrap: 'balance' }}
              >
                Acclimated for UAE Homes, Backed by Live Greenhouse Telemetry.
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-[#475569] leading-relaxed">
                Every plant in our Dubai and Sharjah nurseries is pre-conditioned for indoor air-conditioning and potted in breathable terracotta or stoneware. Connected directly to our Java Spring Boot Inventory Engine for real-time stock accuracy.
              </p>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setInventoryConsoleOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#D5CBB8] bg-white px-4 py-2 text-xs font-medium text-[#1B4332] hover:bg-[#F2EFE9] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Open Live Nursery Stock Simulator</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
              <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5">
                <ShieldCheck className="h-5 w-5 text-[#1B4332]" />
                <h3 className="mt-3 text-sm font-semibold text-[#0F172A]">
                  Strict Quantity Guard
                </h3>
                <p className="mt-1.5 text-xs text-[#475569] leading-relaxed">
                  Cart and product steppers validate against live Spring Boot{' '}
                  <code className="font-mono-tabular text-[#1B4332]">
                    availableStock
                  </code>{' '}
                  integers on every click.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5">
                <Truck className="h-5 w-5 text-[#1B4332]" />
                <h3 className="mt-3 text-sm font-semibold text-[#0F172A]">
                  Chilled UAE Van Delivery
                </h3>
                <p className="mt-1.5 text-xs text-[#475569] leading-relaxed">
                  Orders over AED 200.00 unlock complimentary temperature-controlled delivery across Dubai, Abu Dhabi &amp; Sharjah.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5">
                <Sprout className="h-5 w-5 text-[#D97757]" />
                <h3 className="mt-3 text-sm font-semibold text-[#0F172A]">
                  30-Day Healthy Root Guarantee
                </h3>
                <p className="mt-1.5 text-xs text-[#475569] leading-relaxed">
                  Includes complimentary WhatsApp consultations with our Dubai master horticulturists.
                </p>
              </div>
            </div>
          </div>
        </section>
          </>
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-[#E5E0D8] bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center text-xs text-[#64748B]">
          <div className="flex items-center gap-3">
            <span className="font-editorial text-base font-semibold text-[#1B4332]">
              Atelier Monolith Botanica
            </span>
            <span aria-hidden="true">·</span>
            <span>Al Barari &amp; Jumeirah, Dubai, UAE · All Prices in AED</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => setInventoryConsoleOpen(true)}
              className="hover:text-[#1B4332] transition-colors cursor-pointer"
            >
              Spring Boot API Simulator
            </button>
            <span>
              © {new Date().getFullYear()} Atelier Monolith Botanica LLC (Dubai, UAE).
            </span>
          </div>
        </div>
      </footer>

      {/* Interactive Modals & Slide-Over Drawers */}
      <QuickViewModal products={products} />
      <CartDrawer />
      <SearchModal products={products} />
      <InventorySimulatorModal products={products} />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StorefrontContent />
    </QueryClientProvider>
  );
}
