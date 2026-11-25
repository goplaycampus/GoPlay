import { ArrowLeftRight, ShoppingBag, Trash2, X } from 'lucide-react';
import type { Language, Product } from '../types';
import { calculateDiscountPct, formatBDT } from '../utils/commerce';
import { ProductImage } from './ProductImage';

interface CompareBarProps {
  items: Product[];
  onOpenCompare: () => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

export function CompareBar({
  items,
  onOpenCompare,
  onRemoveItem,
  onClearAll,
}: CompareBarProps) {
  if (items.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Product comparison tray"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl bg-[#111111] text-white rounded-lg border border-[#292929] shadow-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <ArrowLeftRight className="w-4 h-4 text-[#B7F500] shrink-0" />
        <div className="flex items-center gap-2 overflow-x-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="inline-flex items-center gap-2 bg-[#292929] rounded px-2.5 py-1 text-xs shrink-0"
            >
              <span className="max-w-[140px] truncate font-medium">{item.name}</span>
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                aria-label={`Remove ${item.name} from compare`}
                className="text-white/70 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onClearAll}
          className="px-2.5 py-1.5 rounded text-xs font-semibold text-white/75 hover:text-white"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onOpenCompare}
          disabled={items.length < 2}
          className="px-4 py-2 rounded-md bg-[#B7F500] text-[#111111] text-xs font-bold hover:bg-[#a6df00] disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Compare ({items.length}/3)
        </button>
      </div>
    </div>
  );
}

interface CompareModalProps {
  open: boolean;
  items: Product[];
  lang: Language;
  onClose: () => void;
  onRemoveItem: (id: string) => void;
  onQuickAdd: (p: Product) => void;
  onSelectProduct: (p: Product) => void;
}

export function CompareModal({
  open,
  items,
  lang,
  onClose,
  onRemoveItem,
  onQuickAdd,
  onSelectProduct,
}: CompareModalProps) {
  if (!open || items.length === 0) return null;

  const specLabels = Array.from(
    new Set(items.flatMap((p) => p.specifications.map((s) => s.label)))
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-[#E5E5E5] shadow-2xl">
        <div className="sticky top-0 z-10 bg-white border-b border-[#E5E5E5] px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h2 id="compare-modal-title" className="font-display text-lg font-extrabold text-[#111111]">
              Side-by-Side Gear Comparison
            </h2>
            <p className="text-xs text-[#525252]">
              Compare technical specifications, BDT pricing, stock availability, and delivery windows.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison"
            className="p-2 rounded-md hover:bg-[#F4F4F4] text-[#111111]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-[#E5E5E5] align-top">
                <th className="py-3 pr-4 w-40 font-semibold text-[#525252]">Specification</th>
                {items.map((p) => {
                  const title = lang === 'bn' && p.nameBn ? p.nameBn : p.name;
                  const price = p.discountPrice ?? p.sellingPrice;
                  const savePct = calculateDiscountPct(p.sellingPrice, p.discountPrice);
                  const canOrder =
                    p.availabilityStatus === 'In Stock' || p.availabilityStatus === 'Pre-order';
                  return (
                    <th key={p.id} className="py-3 px-3 min-w-[190px] font-normal align-top">
                      <div className="space-y-2.5">
                        <div className="rounded-md overflow-hidden border border-[#E5E5E5]">
                          <ProductImage src={p.images[0]} alt={title} aspectClass="aspect-[4/3]" />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectProduct(p);
                          }}
                          className="text-left font-display text-sm font-bold text-[#111111] hover:underline decoration-[#B7F500] decoration-2"
                        >
                          {title}
                        </button>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono-num text-base font-extrabold text-[#111111]">
                            {formatBDT(price)}
                          </span>
                          {savePct > 0 && (
                            <span className="font-mono-num text-[11px] font-semibold text-[#166534]">
                              Save {savePct}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={!canOrder}
                            onClick={() => onQuickAdd(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#B7F500] text-[#111111] font-semibold hover:bg-[#a6df00] disabled:opacity-40"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{p.availabilityStatus === 'Pre-order' ? 'Pre-order' : 'Add'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(p.id)}
                            aria-label={`Remove ${p.name} from comparison`}
                            className="p-1.5 rounded border border-[#E5E5E5] text-[#525252] hover:text-[#991B1B]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F4]">
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-[#525252]">Brand &amp; Model</td>
                {items.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-[#111111] font-medium">
                    {p.brand} · {p.model}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-[#525252]">Availability</td>
                {items.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 font-semibold text-[#111111]">
                    {p.availabilityStatus}
                    {p.availabilityStatus === 'In Stock' ? ` (${p.stockQuantity} in stock)` : ''}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-[#525252]">Delivery Estimate</td>
                {items.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-[#292929]">
                    {p.deliveryEstimate}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-[#525252]">Sizes / Options</td>
                {items.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-[#292929]">
                    {p.sizes.join(', ')}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-[#525252]">Weight &amp; Dimensions</td>
                {items.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 font-mono-num text-[#292929]">
                    {p.weightDimensions}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-[#525252]">Origin</td>
                {items.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-[#292929]">
                    {p.countryOfOrigin}
                  </td>
                ))}
              </tr>
              {specLabels.map((label) => (
                <tr key={label}>
                  <td className="py-2.5 pr-4 font-semibold text-[#525252]">{label}</td>
                  {items.map((p) => {
                    const spec = p.specifications.find((s) => s.label === label);
                    return (
                      <td key={p.id} className="py-2.5 px-3 text-[#292929]">
                        {spec ? spec.value : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td className="py-2.5 pr-4 font-semibold text-[#525252]">Warranty</td>
                {items.map((p) => (
                  <td key={p.id} className="py-2.5 px-3 text-[#292929]">
                    {p.warrantyInfo}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
