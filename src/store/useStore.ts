import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  CartItem,
  CategoryId,
  OrderConfirmation,
  Product,
  UserProfile,
} from '../types/ecommerce';
import { evaluateQuantityGuard } from '../utils/inventory';

function getInitialRouteProductId(): string | null {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/^\/product\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getInitialCheckoutRoute(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/checkout';
}

interface StoreState {
  // Persisted Cart & Auth State
  cart: CartItem[];
  user: UserProfile | null;
  restockSubscriptions: Record<string, string>; // productId -> email
  lastOrder: OrderConfirmation | null;

  // Routing & UI State
  activeProductId: string | null; // Maps to /product/:id route
  isCheckoutOpen: boolean; // Maps to /checkout route
  selectedCategory: CategoryId;
  searchQuery: string;
  stockFilter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  sortBy: 'featured' | 'price_asc' | 'price_desc' | 'stock_asc';
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isInventoryConsoleOpen: boolean;
  quickViewProductId: string | null;

  // Navigation & UI Actions
  navigateToProduct: (productId: string | null) => void;
  navigateToCheckout: () => void;
  setSelectedCategory: (category: CategoryId) => void;
  setSearchQuery: (query: string) => void;
  setStockFilter: (filter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => void;
  setSortBy: (sort: 'featured' | 'price_asc' | 'price_desc' | 'stock_asc') => void;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setInventoryConsoleOpen: (open: boolean) => void;
  setQuickViewProductId: (id: string | null) => void;

  // Cart Actions with strict Quantity Guard
  addToCart: (
    product: Product,
    requestedDelta?: number
  ) => {
    added: boolean;
    newQuantity: number;
    wasClamped: boolean;
    reason?: string;
  };
  updateCartItemQuantity: (
    productId: string,
    newQuantity: number,
    availableStock: number
  ) => {
    updatedQuantity: number;
    wasClamped: boolean;
  };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  syncCartWithLatestInventory: (latestProducts: Product[]) => void;

  // Restock & Auth Actions
  addRestockSubscription: (productId: string, email: string) => void;
  toggleDemoAuth: () => void;
  setLastOrder: (order: OrderConfirmation | null) => void;
}

const DEMO_UAE_USER: UserProfile = {
  id: 'usr-dxb-901',
  name: 'Layla Al Maktoum',
  email: 'layla@albarari-botanica.ae',
  tier: 'Botanical Patron',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.atelier-uae-spring-boot-demo',
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      user: DEMO_UAE_USER,
      restockSubscriptions: {},
      lastOrder: null,

      activeProductId: getInitialRouteProductId(),
      isCheckoutOpen: getInitialCheckoutRoute(),
      selectedCategory: 'all',
      searchQuery: '',
      stockFilter: 'all',
      sortBy: 'featured',
      isCartOpen: false,
      isSearchOpen: false,
      isInventoryConsoleOpen: false,
      quickViewProductId: null,

      navigateToProduct: (productId) => {
        if (typeof window !== 'undefined') {
          const targetPath = productId ? `/product/${productId}` : '/';
          if (window.location.pathname !== targetPath) {
            window.history.pushState({ productId }, '', targetPath);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        set({
          activeProductId: productId,
          isCheckoutOpen: false,
          quickViewProductId: null,
        });
      },

      navigateToCheckout: () => {
        if (typeof window !== 'undefined') {
          if (window.location.pathname !== '/checkout') {
            window.history.pushState({ checkout: true }, '', '/checkout');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        set({
          isCheckoutOpen: true,
          activeProductId: null,
          isCartOpen: false,
          quickViewProductId: null,
        });
      },

      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setStockFilter: (stockFilter) => set({ stockFilter }),
      setSortBy: (sortBy) => set({ sortBy }),
      setCartOpen: (isCartOpen) => set({ isCartOpen }),
      setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
      setInventoryConsoleOpen: (isInventoryConsoleOpen) =>
        set({ isInventoryConsoleOpen }),
      setQuickViewProductId: (quickViewProductId) => set({ quickViewProductId }),

      addToCart: (product, requestedDelta = 1) => {
        const availableStock = product.inventory.availableStock;
        if (availableStock <= 0) {
          return {
            added: false,
            newQuantity: 0,
            wasClamped: true,
            reason: 'OUT_OF_STOCK',
          };
        }

        const currentCart = get().cart;
        const existingIndex = currentCart.findIndex(
          (item) => item.product.id === product.id
        );
        const currentQty =
          existingIndex >= 0 ? currentCart[existingIndex].quantity : 0;
        const targetQty = currentQty + requestedDelta;

        const guard = evaluateQuantityGuard(targetQty, availableStock);

        if (existingIndex >= 0 && guard.allowedQuantity === currentQty) {
          return {
            added: false,
            newQuantity: currentQty,
            wasClamped: true,
            reason: 'MAX_STOCK_REACHED',
          };
        }

        const nextCart = [...currentCart];
        if (existingIndex >= 0) {
          nextCart[existingIndex] = {
            product,
            quantity: guard.allowedQuantity,
          };
        } else {
          nextCart.push({
            product,
            quantity: guard.allowedQuantity,
          });
        }

        set({ cart: nextCart });
        return {
          added: true,
          newQuantity: guard.allowedQuantity,
          wasClamped: guard.wasClamped,
          reason: guard.reason,
        };
      },

      updateCartItemQuantity: (productId, newQuantity, availableStock) => {
        if (newQuantity <= 0 || availableStock <= 0) {
          set((state) => ({
            cart: state.cart.filter((item) => item.product.id !== productId),
          }));
          return { updatedQuantity: 0, wasClamped: availableStock <= 0 };
        }

        const guard = evaluateQuantityGuard(newQuantity, availableStock);
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: guard.allowedQuantity }
              : item
          ),
        }));

        return {
          updatedQuantity: guard.allowedQuantity,
          wasClamped: guard.wasClamped,
        };
      },

      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        })),

      clearCart: () => set({ cart: [] }),

      syncCartWithLatestInventory: (latestProducts) => {
        const currentCart = get().cart;
        if (currentCart.length === 0) return;

        let changed = false;
        const syncedCart: CartItem[] = [];

        for (const item of currentCart) {
          const baseId = item.product.id.split('__')[0];
          const fresh = latestProducts.find((p) => p.id === baseId);
          if (!fresh) {
            syncedCart.push(item);
            continue;
          }

          if (fresh.inventory.availableStock <= 0) {
            changed = true;
            continue;
          }

          const maxAllowed = Math.min(
            item.product.inventory.availableStock,
            fresh.inventory.availableStock
          );
          const clampedQty = Math.min(item.quantity, maxAllowed);
          if (clampedQty !== item.quantity) {
            changed = true;
          }

          syncedCart.push({
            product:
              item.product.id === fresh.id
                ? fresh
                : {
                    ...item.product,
                    inventory: {
                      ...item.product.inventory,
                      availableStock: maxAllowed,
                    },
                  },
            quantity: clampedQty,
          });
        }

        if (changed) {
          set({ cart: syncedCart });
        }
      },

      addRestockSubscription: (productId, email) =>
        set((state) => ({
          restockSubscriptions: {
            ...state.restockSubscriptions,
            [productId]: email,
          },
        })),

      toggleDemoAuth: () =>
        set((state) => ({
          user: state.user ? null : DEMO_UAE_USER,
        })),

      setLastOrder: (lastOrder) => set({ lastOrder }),
    }),
    {
      name: 'atelier-uae-nursery-store-v4',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        user: state.user,
        restockSubscriptions: state.restockSubscriptions,
      }),
    }
  )
);
