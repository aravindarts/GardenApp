import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  X,
  ArrowUpRight,
  Plus,
  Check,
  Sun,
  Droplets,
  PawPrint,
} from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '../types/ecommerce';
import { useStore } from '../store/useStore';
import { filterAndSortProducts, getStockPresentation } from '../utils/inventory';
import { formatCurrency } from '../lib/utils';

interface SearchModalProps {
  products: Product[];
}

export const SearchModal: React.FC<SearchModalProps> = ({ products }) => {
  const isSearchOpen = useStore((s) => s.isSearchOpen);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const navigateToProduct = useStore((s) => s.navigateToProduct);
  const addToCart = useStore((s) => s.addToCart);

  const [query, setQuery] = useState('');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isSearchOpen, setSearchOpen]);

  const results = filterAndSortProducts(products, {
    category: 'all',
    searchQuery: query,
  });

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const res = addToCart(product, 1);
    if (res.added) {
      setRecentlyAddedId(product.id);
      toast.success(`${product.name} added to bag`, {
        description: `${formatCurrency(product.price)} · In bag: ${res.newQuantity} of ${product.inventory.availableStock} available.`,
      });
      setTimeout(() => setRecentlyAddedId(null), 900);
    } else {
      toast.warning(`Quantity Guard: Maximum stock reached for ${product.name}`);
    }
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)}
            className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs"
          />

          {/* Command Palette Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Instant plant and nursery search"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-2xl"
          >
            {/* Search Input Header */}
            <div className="flex items-center gap-3 border-b border-[#E5E0D8] px-4 py-3.5">
              <Search className="h-4 w-4 text-[#1B4332] shrink-0" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by plant name (Monstera, Olive, Snake), care level, or Pet Safe..."
                aria-label="Search nursery catalog"
                className="flex-1 bg-transparent text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-xs text-[#64748B] hover:text-[#1B4332] px-1.5 py-0.5 cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search modal"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E0D8] text-[#64748B] hover:text-[#1B4332] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Quick Suggestion Terms */}
            <div className="flex items-center gap-2 border-b border-[#F2EFE9] bg-[#F9F8F6] px-4 py-2 text-xs text-[#64748B] overflow-x-auto">
              <span className="shrink-0">Quick filter:</span>
              {[
                'Monstera',
                'Olive Tree',
                'Pet Safe',
                'Low Light',
                'Terracotta',
                'Full UAE Sun',
              ].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="rounded-md border border-[#E5E0D8] bg-white px-2 py-0.5 text-xs font-medium text-[#1B4332] hover:border-[#1B4332]/40 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* Results List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F2EFE9] p-2">
              {results.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-[#0F172A]">
                    No plants or garden items match &ldquo;{query}&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-[#64748B]">
                    Try searching for Monstera, Olive, Snake Plant, Pet Safe, or Terracotta.
                  </p>
                </div>
              ) : (
                results.map((product) => {
                  const stockMeta = getStockPresentation(
                    product.inventory.availableStock,
                    product.inventory.maxCapacity
                  );
                  const isAdded = recentlyAddedId === product.id;

                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        setSearchOpen(false);
                        navigateToProduct(product.id);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setSearchOpen(false);
                          navigateToProduct(product.id);
                        }
                      }}
                      className="flex items-center justify-between gap-4 rounded-xl p-2.5 hover:bg-[#F9F8F6] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={product.primaryImage}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="h-14 w-16 rounded-lg border border-[#E5E0D8] bg-[#F2EFE9] object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs text-[#64748B]">
                            <span className="italic font-editorial text-[#1B4332]">
                              {product.botanicalName}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Sun className="h-3 w-3 text-[#D97757]" />
                              {product.lightRequirement}
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1">
                              <Droplets className="h-3 w-3 text-[#1B4332]" />
                              {product.wateringFrequency}
                            </span>
                            {product.isPetFriendly && (
                              <span className="inline-flex items-center gap-0.5 text-[#1B4332] font-medium">
                                <PawPrint className="h-3 w-3" />
                                Pet Safe
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-[#0F172A] truncate">
                            {product.name}
                          </h4>
                          <span
                            className={`text-[11px] font-medium ${
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
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono-tabular text-sm font-semibold text-[#1B4332]">
                          {formatCurrency(product.price)}
                        </span>

                        {stockMeta.canPurchase && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(e, product)}
                            aria-label={`Quick add ${product.name} to bag`}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#1B4332] px-2.5 text-xs font-medium text-white hover:bg-[#2D6A4F] cursor-pointer whitespace-nowrap shrink-0"
                          >
                            {isAdded ? (
                              <Check className="h-3.5 w-3.5 text-emerald-300" />
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        )}

                        <ArrowUpRight className="h-4 w-4 text-[#94A3B8]" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
