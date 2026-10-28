import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, SlidersHorizontal, Grid } from 'lucide-react';
import { useStore } from '../store/useStore';
import { CategoryId } from '../types/ecommerce';

const NAV_LINKS: Array<{ id: CategoryId; label: string }> = [
  { id: 'all', label: 'All Plants' },
  { id: 'air_purifiers', label: 'Air Purifiers' },
  { id: 'pet_safe', label: 'Pet Safe' },
  { id: 'low_light', label: 'Low Light' },
  { id: 'pots_and_soil', label: 'Pots & Soil' },
];

export const Navbar: React.FC = () => {
  const cart = useStore((s) => s.cart);
  const selectedCategory = useStore((s) => s.selectedCategory);
  const setSelectedCategory = useStore((s) => s.setSelectedCategory);
  const navigateToProduct = useStore((s) => s.navigateToProduct);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const setInventoryConsoleOpen = useStore((s) => s.setInventoryConsoleOpen);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Global Cmd+K / Ctrl+K shortcut for Instant Search Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);

  const handleNavClick = (categoryId: CategoryId) => {
    navigateToProduct(null);
    setSelectedCategory(categoryId);
    setTimeout(() => {
      const el = document.getElementById('collection-grid');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#F9F8F6]/85 border-b border-[#E5E0D8] transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateToProduct(null);
              setSelectedCategory('all');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-xl font-semibold tracking-tight text-[#1B4332] whitespace-nowrap shrink-0 font-editorial"
          >
            Atelier Monolith Botanica
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav
            aria-label="Primary categories"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#475569]"
          >
            {NAV_LINKS.map((link) => {
              const isActive = selectedCategory === link.id;
              return (
                <a
                  key={link.id}
                  href={`#collection-${link.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.id);
                  }}
                  className={`relative py-1 transition-colors whitespace-nowrap shrink-0 hover:text-[#1B4332] ${
                    isActive ? 'text-[#1B4332] font-semibold' : ''
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="top-nav-underline"
                      className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-[#1B4332] rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Primary action cluster (Search Cmd+K & Cart Drawer trigger) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => setSearchOpen(true)}
              aria-label="Search plants and pots (Command K)"
              className="inline-flex items-center gap-2.5 rounded-lg border border-[#E5E0D8] bg-white/90 px-3 py-1.5 text-xs font-medium text-[#475569] hover:border-[#1B4332]/40 hover:text-[#1B4332] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-[#1B4332]" />
              <span className="hidden sm:inline">Search plants, pots...</span>
              <kbd className="hidden sm:inline-block rounded border border-[#E5E0D8] bg-[#F9F8F6] px-1.5 py-0.5 font-mono-tabular text-[11px] text-[#64748B]">
                ⌘K
              </kbd>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping bag with ${totalItems} items`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B4332] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#2D6A4F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Bag</span>
              <span
                data-testid="navbar-cart-count"
                className="font-mono-tabular inline-flex h-4 min-w-4 items-center justify-center rounded bg-white/20 px-1 text-[11px] font-semibold text-white"
              >
                {totalItems}
              </span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Floating Glassmorphic Mobile Bottom Navigation Bar (respects <= 15% mobile sticky cap) */}
      <nav
        aria-label="Mobile quick actions"
        className="fixed bottom-0 inset-x-0 z-30 flex md:hidden items-center justify-around h-12 backdrop-blur-md bg-[#F9F8F6]/90 border-t border-[#E5E0D8] px-4"
      >
        <button
          type="button"
          onClick={() => handleNavClick('all')}
          className="flex items-center gap-1.5 text-xs font-medium text-[#1B4332] py-1.5 px-2 whitespace-nowrap shrink-0"
        >
          <Grid className="h-3.5 w-3.5" />
          <span>Nursery</span>
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-[#475569] py-1.5 px-2 whitespace-nowrap shrink-0"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search</span>
        </button>
        <button
          type="button"
          onClick={() => setInventoryConsoleOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-[#475569] py-1.5 px-2 whitespace-nowrap shrink-0"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>API Stock</span>
        </button>
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] py-1.5 px-2 whitespace-nowrap shrink-0"
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span className="font-mono-tabular">Bag ({totalItems})</span>
        </button>
      </nav>
    </>
  );
};
