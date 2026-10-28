import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, RotateCcw, Server, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Product } from '../types/ecommerce';
import { useStore } from '../store/useStore';
import {
  resetInventoryToDefaults,
  updateProductStock,
} from '../services/api';
import { getStockPresentation } from '../utils/inventory';

interface InventorySimulatorModalProps {
  products: Product[];
}

export const InventorySimulatorModal: React.FC<InventorySimulatorModalProps> = ({
  products,
}) => {
  const queryClient = useQueryClient();
  const isOpen = useStore((s) => s.isInventoryConsoleOpen);
  const setOpen = useStore((s) => s.setInventoryConsoleOpen);
  const syncCartWithLatestInventory = useStore(
    (s) => s.syncCartWithLatestInventory
  );

  // Optimistic mutation via TanStack React Query
  const stockMutation = useMutation({
    mutationFn: ({
      productId,
      newStock,
    }: {
      productId: string;
      newStock: number;
    }) => updateProductStock(productId, newStock),
    onMutate: async ({ productId, newStock }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previous = queryClient.getQueryData<Product[]>(['products']);

      if (previous) {
        const optimistic = previous.map((p) =>
          p.id === productId
            ? {
                ...p,
                inventory: {
                  ...p.inventory,
                  availableStock: newStock,
                  lastSyncedAt: new Date().toISOString(),
                },
              }
            : p
        );
        queryClient.setQueryData<Product[]>(['products'], optimistic);
        syncCartWithLatestInventory(optimistic);
      }

      return { previous };
    },
    onSuccess: (updated) => {
      toast.success(
        `PATCH /api/v1/inventory/${updated.sku} → ${updated.inventory.availableStock} units`,
        {
          description: `UI & Quantity Guard updated optimistically for ${updated.name}.`,
        }
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetInventoryToDefaults(),
    onSuccess: (freshProducts) => {
      queryClient.setQueryData(['products'], freshProducts);
      syncCartWithLatestInventory(freshProducts);
      toast.info('Spring Boot Nursery Inventory reset to default greenhouse levels');
    },
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-[#0F172A]/45 backdrop-blur-xs"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Spring Boot Nursery Inventory Simulator"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-2xl max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E5E0D8] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <Server className="h-4 w-4 text-[#1B4332]" />
                <div>
                  <h2 className="text-sm font-semibold text-[#0F172A]">
                    Spring Boot REST Nursery Inventory Simulator
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Simulate real-time{' '}
                    <code className="font-mono-tabular">
                      PATCH /api/v1/inventory/&#123;sku&#125;
                    </code>{' '}
                    greenhouse stock mutations &amp; test optimistic UI transitions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => resetMutation.mutate()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E0D8] bg-[#F9F8F6] px-3 py-1.5 text-xs font-medium text-[#1B4332] hover:bg-[#F2EFE9] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Defaults</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close inventory simulator"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#475569] hover:bg-[#F2EFE9] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Product Stock Controls */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#F2EFE9] px-6 py-3">
              {products.map((product) => {
                const stock = product.inventory.availableStock;
                const meta = getStockPresentation(
                  stock,
                  product.inventory.maxCapacity
                );

                return (
                  <div
                    key={product.id}
                    className="flex flex-wrap items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tabular text-xs font-medium text-[#64748B]">
                          {product.sku}
                        </span>
                        <h4 className="text-xs font-semibold text-[#0F172A] truncate">
                          {product.name}
                        </h4>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        {meta.tier === 'IN_STOCK' && (
                          <span className="inline-flex items-center gap-1 text-[#1B4332] font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            In Stock ({stock})
                          </span>
                        )}
                        {meta.tier === 'LOW_STOCK' && (
                          <span className="inline-flex items-center gap-1 text-[#D97757] font-semibold">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock ({stock})
                          </span>
                        )}
                        {meta.tier === 'OUT_OF_STOCK' && (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                            <XCircle className="h-3 w-3" />
                            Out of Stock (0)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Preset Stock Tier Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          stockMutation.mutate({
                            productId: product.id,
                            newStock: 20,
                          })
                        }
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          stock > 10
                            ? 'border-[#1B4332] bg-[#1B4332]/10 text-[#1B4332]'
                            : 'border-[#E5E0D8] bg-white text-[#475569] hover:text-[#1B4332]'
                        }`}
                      >
                        In Stock (20)
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          stockMutation.mutate({
                            productId: product.id,
                            newStock: 3,
                          })
                        }
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          stock >= 1 && stock <= 10
                            ? 'border-[#D97757] bg-[#D97757]/10 text-[#D97757]'
                            : 'border-[#E5E0D8] bg-white text-[#475569] hover:text-[#D97757]'
                        }`}
                      >
                        Low Stock (3)
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          stockMutation.mutate({
                            productId: product.id,
                            newStock: 0,
                          })
                        }
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          stock === 0
                            ? 'border-rose-600 bg-rose-50 text-rose-900'
                            : 'border-[#E5E0D8] bg-white text-[#475569] hover:text-rose-700'
                        }`}
                      >
                        Out of Stock (0)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
