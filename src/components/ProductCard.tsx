import { ArrowLeftRight, Heart, ShoppingBag } from 'lucide-react';
import type { Language, Product } from '../types';
import { calculateDiscountPct, formatBDT } from '../utils/commerce';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  lang: Language;
  wishlisted: boolean;
  compared?: boolean;
  onToggleWishlist: (productId: string) => void;
  onToggleCompare?: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export function ProductCard({
  product,
  lang,
  wishlisted,
  compared = false,
  onToggleWishlist,
  onToggleCompare,
  onSelectProduct,
  onQuickAdd,
}: ProductCardProps) {
  const displayName = lang === 'bn' && product.nameBn ? product.nameBn : product.name;
  const activePrice = product.discountPrice ?? product.sellingPrice;
  const discountPct = calculateDiscountPct(product.sellingPrice, product.discountPrice);
  const canOrder =
    product.availabilityStatus === 'In Stock' || product.availabilityStatus === 'Pre-order';

  const statusColor =
    product.availabilityStatus === 'In Stock'
      ? 'text-[#166534]'
      : product.availabilityStatus === 'Pre-order'
      ? 'text-[#92400E]'
      : 'text-[#525252]';

  return (
    <article className="group flex flex-col bg-white border border-[#E5E5E5] rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        <button
          type="button"
          onClick={() => onSelectProduct(product)}
          className="block w-full text-left focus-visible:outline-2 focus-visible:outline-[#111111]"
          aria-label={`View ${displayName}`}
        >
          <ProductImage src={product.images[0]} alt={displayName} aspectClass="aspect-[4/3]" />
        </button>

        <button
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          aria-label={wishlisted ? `Remove ${displayName} from wishlist` : `Save ${displayName} to wishlist`}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 border border-[#E5E5E5] flex items-center justify-center text-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
        >
          <Heart className="w-4 h-4" fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="flex items-center justify-between gap-2 text-xs text-[#525252]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-medium text-[#292929]">{product.categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span className={`font-semibold ${statusColor}`}>{product.availabilityStatus}</span>
          </div>
          {onToggleCompare && (
            <button
              type="button"
              onClick={() => onToggleCompare(product)}
              aria-label={compared ? `Remove ${displayName} from compare` : `Compare ${displayName}`}
              className={`inline-flex items-center gap-1 text-[11px] font-semibold shrink-0 transition-colors ${
                compared ? 'text-[#111111] underline decoration-[#B7F500] decoration-2' : 'text-[#525252] hover:text-[#111111]'
              }`}
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>{compared ? 'Comparing' : 'Compare'}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelectProduct(product)}
          className="text-left focus-visible:outline-2 focus-visible:outline-[#111111]"
        >
          <h3 className="font-display text-base font-semibold text-[#111111] leading-snug line-clamp-2 group-hover:underline decoration-[#B7F500] decoration-2 underline-offset-4">
            {displayName}
          </h3>
        </button>

        <p className="text-xs text-[#525252] font-mono-num truncate">
          {product.brand} · {product.sizes.length} {product.sizes.length === 1 ? 'spec' : 'specs'} · {product.sku}
        </p>

        <div className="mt-auto pt-3 border-t border-[#F4F4F4] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-mono-num text-base font-bold text-[#111111]">
              {formatBDT(activePrice)}
            </span>
            {discountPct > 0 && (
              <>
                <span className="font-mono-num text-xs text-[#737373] line-through">
                  {formatBDT(product.sellingPrice)}
                </span>
                <span className="font-mono-num text-[11px] font-semibold text-[#166534]">
                  -{discountPct}%
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            disabled={!canOrder}
            onClick={() => onQuickAdd(product)}
            aria-label={
              product.availabilityStatus === 'Pre-order'
                ? `Pre-order ${displayName}`
                : `Add ${displayName} to cart`
            }
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              canOrder
                ? product.availabilityStatus === 'Pre-order'
                  ? 'bg-[#292929] text-white hover:bg-[#111111]'
                  : 'bg-[#B7F500] text-[#111111] hover:bg-[#a6df00]'
                : 'bg-[#F4F4F4] text-[#737373] cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>
              {product.availabilityStatus === 'Pre-order'
                ? lang === 'bn'
                  ? 'প্রি-অর্ডার'
                  : 'Pre-order'
                : canOrder
                ? lang === 'bn'
                  ? 'যোগ করুন'
                  : 'Add'
                : lang === 'bn'
                ? 'স্টক শেষ'
                : 'Unavailable'}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

