import { Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import type { CartItem, Product } from '../types';
import { formatBDT, getCartUpsellSuggestions } from '../utils/commerce';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  products?: Product[];
  freeShippingThreshold: number;
  onClose: () => void;
  onUpdateQty: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onQuickAddProduct?: (product: Product) => void;
  onCheckout: () => void;
}

export function CartDrawer({
  open,
  items,
  products = [],
  freeShippingThreshold,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onQuickAddProduct,
  onCheckout,
}: CartDrawerProps) {
  if (!open) return null;

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const remainingForFree = Math.max(0, freeShippingThreshold - subtotal);
  const progressPct =
    freeShippingThreshold > 0
      ? Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))
      : 100;

  const hasReady = items.some((i) => i.availabilityStatus === 'In Stock');
  const hasPreOrder = items.some((i) => i.availabilityStatus === 'Pre-order');
  const upsells = getCartUpsellSuggestions(items, products, 2);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-[#E5E5E5]">
        <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#111111]" />
            <h2 className="font-display text-lg font-bold text-[#111111]">
              Your Bag ({items.reduce((s, i) => s + i.quantity, 0)})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag"
            className="p-2 rounded-md hover:bg-[#F4F4F4] text-[#111111]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 bg-[#F4F4F4] border-b border-[#E5E5E5] space-y-2 text-xs text-[#292929]">
          <div className="flex items-center justify-between gap-2">
            {remainingForFree === 0 ? (
              <span className="font-semibold text-[#166534]">
                Free ready-stock shipping unlocked across Bangladesh
              </span>
            ) : (
              <span>
                Add <strong className="font-mono-num">{formatBDT(remainingForFree)}</strong> more for free ready-stock shipping
              </span>
            )}
            <span className="font-mono-num font-bold text-[#111111]">{progressPct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#E5E5E5] overflow-hidden">
            <div
              className="h-full bg-[#B7F500] transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-[#A3A3A3] mx-auto" />
              <p className="text-sm font-semibold text-[#111111]">Your GoPlay bag is empty</p>
              <p className="text-xs text-[#525252]">
                Add ready-stock gear or pre-order items to begin checkout.
              </p>
            </div>
          ) : (
            <>
              {hasReady && hasPreOrder && (
                <div className="p-3 rounded-md bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] leading-relaxed">
                  <strong>Mixed Order Notice:</strong> Your bag contains both Ready Stock and Pre-order items. Pre-order items follow supplier lead times.
                </div>
              )}

              {items.map((item, idx) => (
                <div
                  key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
                  className="flex gap-3 pb-4 border-b border-[#F4F4F4]"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 object-cover rounded-md bg-[#F4F4F4] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#525252] truncate">
                      {item.brand} · {item.availabilityStatus}
                    </p>
                    <h3 className="font-display text-sm font-bold text-[#111111] truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#525252] mt-0.5">
                      {item.selectedSize} · {item.selectedColor}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center border border-[#D4D4D4] rounded">
                        <button
                          type="button"
                          aria-label={`Decrease quantity for ${item.name}`}
                          onClick={() => onUpdateQty(idx, -1)}
                          className="px-2 py-0.5 text-xs font-bold hover:bg-[#F4F4F4]"
                        >
                          −
                        </button>
                        <span className="px-2.5 text-xs font-mono-num">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase quantity for ${item.name}`}
                          onClick={() => onUpdateQty(idx, 1)}
                          className="px-2 py-0.5 text-xs font-bold hover:bg-[#F4F4F4]"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono-num text-sm font-bold text-[#111111]">
                          {formatBDT(item.unitPrice * item.quantity)}
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => onRemoveItem(idx)}
                          className="text-[#737373] hover:text-[#991B1B]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {upsells.length > 0 && onQuickAddProduct && (
            <div className="pt-2 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#525252]">
                Quick Ready-Stock Add-Ons
              </p>
              <div className="space-y-2">
                {upsells.map((prod) => {
                  const price = prod.discountPrice ?? prod.sellingPrice;
                  return (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-[#E5E5E5] bg-[#FAFAFA]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded object-cover shrink-0 bg-[#E5E5E5]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#111111] truncate">{prod.name}</p>
                          <p className="font-mono-num text-xs text-[#525252]">{formatBDT(price)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onQuickAddProduct(prod)}
                        aria-label={`Add ${prod.name} to bag`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#111111] text-white text-xs font-semibold hover:bg-[#292929] shrink-0"
                      >
                        <Plus className="w-3 h-3 text-[#B7F500]" />
                        <span>Add</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-[#E5E5E5] bg-[#FAFAFA] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#525252]">
              <span>Available Promo Codes</span>
              <span className="font-mono-num font-semibold text-[#111111]">
                GOPLAY100 · TEAM5
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#525252]">Subtotal</span>
              <span className="font-mono-num text-lg font-bold text-[#111111]">
                {formatBDT(subtotal)}
              </span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="w-full py-3.5 rounded-md bg-[#B7F500] text-[#111111] font-display font-bold text-sm hover:bg-[#a6df00] transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

