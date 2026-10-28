import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  SlidersHorizontal,
  Sun,
  Droplets,
  PawPrint,
} from 'lucide-react';
import { Product } from '../types/ecommerce';
import { STUDIO_VISUALS } from '../utils/studioVisuals';
import { formatCurrency } from '../lib/utils';
import { getStockPresentation } from '../utils/inventory';
import { Skeleton } from './ui/skeleton';
import { SmartPlantImage } from './SmartPlantImage';
import { useStore } from '../store/useStore';

interface BentoHeroProps {
  products: Product[];
  isLoading: boolean;
}

export const BentoHero: React.FC<BentoHeroProps> = ({ products, isLoading }) => {
  const navigateToProduct = useStore((s) => s.navigateToProduct);
  const setInventoryConsoleOpen = useStore((s) => s.setInventoryConsoleOpen);

  const primaryFeatured =
    products.find((p) => p.featuredBento === 'primary') || products[0];
  const secondaryFeatured =
    products.find((p) => p.featuredBento === 'secondary') || products[1];
  const tertiaryFeatured =
    products.find((p) => p.featuredBento === 'tertiary') || products[2];

  const scrollToCollection = () => {
    const el = document.getElementById('collection-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 pt-6 pb-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          <Skeleton className="h-[440px] lg:col-span-7 rounded-2xl" />
          <div className="flex flex-col gap-6 lg:col-span-5">
            <Skeleton className="h-[208px] rounded-2xl" />
            <Skeleton className="h-[208px] rounded-2xl" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="top"
      aria-label="Featured UAE Botanical Collection"
      className="mx-auto max-w-7xl px-4 pt-6 pb-10 sm:px-6 lg:px-8"
    >
      {/* Subtle Top Editorial Bar with Spring Boot Live Inventory Simulator Trigger */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#E5E0D8] pb-3.5 text-xs text-[#5C6460]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-[#1B4332] whitespace-nowrap">
            Al Barari &amp; Jumeirah Conservatories
          </span>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <span className="whitespace-nowrap">
            Acclimated Indoor &amp; Desert-Resilient Specimens
          </span>
          <span aria-hidden="true" className="hidden md:inline">·</span>
          <span className="hidden md:inline whitespace-nowrap font-medium text-[#D97757]">
            Free Express Dubai/UAE Delivery Over AED 200.00
          </span>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => setInventoryConsoleOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B4332] hover:text-[#2D6A4F] hover:underline cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Live Nursery Stock Simulator (Spring Boot API)</span>
        </motion.button>
      </div>

      {/* Bento Grid Layout: 7-col primary card + 5-col stacked secondary spotlight cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Primary Bento Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#F2EFE9] p-6 sm:p-8 lg:col-span-7 min-h-[430px]"
        >
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-medium text-[#1B4332] mb-3">
              <span>01. Biophilic Sanctuary Collection</span>
              <span aria-hidden="true">·</span>
              <span>Dubai &amp; Abu Dhabi</span>
              {primaryFeatured?.isBestseller && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#D97757] font-semibold">Bestseller</span>
                </>
              )}
            </div>

            <h1
              className="font-editorial text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold tracking-tight text-[#0F172A] leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              Living Architecture for Sunlit UAE Residences.
            </h1>

            <p className="mt-3.5 max-w-lg text-sm sm:text-base text-[#334155] leading-relaxed">
              Every tropical air-purifier and ancient Mediterranean olive tree is greenhouse-acclimated in Dubai for indoor AC humidity and Gulf sunlight, paired with handcrafted terracotta and limestone vessels.
            </p>
          </div>

          {/* Studio Visual Showcase (Sunlit Indoor Jungle Hero Banner) */}
          <div className="relative my-6 overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#EAE3D5] aspect-[16/9]">
            <SmartPlantImage
              primaryImage={STUDIO_VISUALS.heroConservatory}
              secondaryImage={primaryFeatured?.secondaryImage}
              alt="Atelier Monolith Botanica sunlit indoor conservatory featuring Monstera Deliciosa, Mediterranean Olive Tree, and Terracotta Planters"
              aspectClassName="aspect-[16/9]"
              showRoomViewPill={true}
              testIdPrefix="bento-hero-banner"
              className="h-full w-full"
            />
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={scrollToCollection}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1B4332] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2D6A4F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Explore Nursery Catalog</span>
                <ArrowUpRight className="h-4 w-4" />
              </motion.button>

              {primaryFeatured && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigateToProduct(primaryFeatured.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#D5CBB8] bg-white/95 px-4 py-2.5 text-sm font-medium text-[#1B4332] hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Inspect {primaryFeatured.name}</span>
                  <span className="font-mono-tabular text-xs text-[#475569]">
                    {formatCurrency(primaryFeatured.price)}
                  </span>
                </motion.button>
              )}
            </div>

            {primaryFeatured && (
              <div className="text-xs text-[#475569] font-mono-tabular">
                SKU {primaryFeatured.sku} · {primaryFeatured.inventory.availableStock} in greenhouse
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Two Stacked Bento Spotlight Cards */}
        <div className="flex flex-col justify-between gap-6 lg:col-span-5">
          {[secondaryFeatured, tertiaryFeatured].map((item, idx) => {
            if (!item) return null;
            const stockMeta = getStockPresentation(
              item.inventory.availableStock,
              item.inventory.maxCapacity
            );

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.08 * (idx + 1),
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={() => navigateToProduct(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateToProduct(item.id);
                  }
                }}
                className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white p-6 hover:border-[#1B4332]/40 transition-colors cursor-pointer"
              >
                <div className="grid grid-cols-12 items-start gap-4">
                  <div className="col-span-7 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <span className="italic font-editorial text-sm text-[#1B4332]">
                        {item.botanicalName}
                      </span>
                      {item.isBestseller && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#D97757]">
                            Bestseller
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="mt-1.5 font-editorial text-xl sm:text-2xl font-semibold text-[#0F172A] leading-snug group-hover:text-[#1B4332] transition-colors">
                      {item.name}
                    </h2>

                    <p className="mt-1.5 text-xs text-[#475569] line-clamp-2 leading-relaxed">
                      {item.subtitle}
                    </p>

                    {/* Botanical Care Attributes Row */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[#475569]">
                      <span className="inline-flex items-center gap-1">
                        <Sun className="h-3 w-3 text-[#D97757]" />
                        {item.lightRequirement}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-[#1B4332]" />
                        {item.wateringFrequency}
                      </span>
                      {item.isPetFriendly && (
                        <span className="inline-flex items-center gap-1 text-[#1B4332] font-medium">
                          <PawPrint className="h-3 w-3" />
                          Pet Safe
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-5 overflow-hidden rounded-xl border border-[#F2EFE9] bg-[#F9F8F6] aspect-[4/3]">
                    <SmartPlantImage
                      primaryImage={item.primaryImage}
                      secondaryImage={item.secondaryImage}
                      alt={item.name}
                      showRoomViewPill={false}
                      testIdPrefix={`bento-spotlight-${item.id}`}
                      className="h-full w-full"
                    />
                  </div>
                </div>

                {/* Bottom Footer Row of Bento Card */}
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#F2EFE9] pt-3.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono-tabular text-base font-semibold text-[#0F172A]">
                      {formatCurrency(item.price)}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        stockMeta.tier === 'LOW_STOCK'
                          ? 'text-[#D97757] font-semibold'
                          : stockMeta.tier === 'OUT_OF_STOCK'
                          ? 'text-rose-700'
                          : 'text-[#1B4332]'
                      }`}
                    >
                      {stockMeta.badgeText}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1B4332] group-hover:translate-x-0.5 transition-transform whitespace-nowrap shrink-0">
                    <span>Inspect</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
