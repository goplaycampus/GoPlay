import { useEffect, useMemo, useState } from 'react';
import { Heart, MapPin, ShieldCheck, ShoppingBag, Star, Truck, X } from 'lucide-react';
import { api } from '../services/api';
import type { Language, Product, Review, StoreSettings } from '../types';
import {
  calculateDeliveryCharge,
  calculateDiscountPct,
  formatBDT,
  getComplementaryProducts,
} from '../utils/commerce';
import { ProductImage } from './ProductImage';

interface ProductDetailModalProps {
  product: Product;
  allProducts?: Product[];
  settings?: StoreSettings;
  lang: Language;
  wishlisted: boolean;
  reviews: Review[];
  onClose: () => void;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  onSelectProduct?: (product: Product) => void;
  onReviewAdded: (review: Review) => void;
}

export function ProductDetailModal({
  product,
  allProducts = [],
  settings,
  lang,
  wishlisted,
  reviews,
  onClose,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  onReviewAdded,
}: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'Standard');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Default');
  const [quantity, setQuantity] = useState(1);
  const [deliveryZone, setDeliveryZone] = useState<'dhakaMetro' | 'dhakaSuburb' | 'nationwide'>('dhakaMetro');

  const [revName, setRevName] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revBusy, setRevBusy] = useState(false);
  const [revMsg, setRevMsg] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSize(product.sizes[0] || 'Standard');
    setSelectedColor(product.colors[0] || 'Default');
    setQuantity(1);
    setRevMsg(null);
  }, [product]);

  const displayName = lang === 'bn' && product.nameBn ? product.nameBn : product.name;
  const displayDesc = lang === 'bn' && product.descriptionBn ? product.descriptionBn : product.description;
  const activePrice = product.discountPrice ?? product.sellingPrice;
  const discountPct = calculateDiscountPct(product.sellingPrice, product.discountPrice);
  const canOrder =
    product.availabilityStatus === 'In Stock' || product.availabilityStatus === 'Pre-order';

  const productReviews = reviews.filter((r) => r.productId === product.id);

  const estimatedDeliveryFee = useMemo(() => {
    const rates = settings
      ? {
          dhakaMetro: settings.dhakaMetroShipping,
          dhakaSuburb: settings.dhakaSuburbShipping,
          nationwide: settings.nationwideShipping,
          freeThreshold: settings.freeShippingThreshold,
        }
      : { dhakaMetro: 70, dhakaSuburb: 100, nationwide: 130, freeThreshold: 3500 };

    const div = deliveryZone === 'nationwide' ? 'Sylhet' : 'Dhaka';
    const dist = deliveryZone === 'dhakaMetro' ? 'Dhaka Metro' : deliveryZone === 'dhakaSuburb' ? 'Savar' : 'Sylhet';
    return calculateDeliveryCharge(
      div,
      dist,
      activePrice * quantity,
      product.availabilityStatus === 'Pre-order',
      rates
    );
  }, [activePrice, deliveryZone, product.availabilityStatus, quantity, settings]);

  const complementary = useMemo(
    () => getComplementaryProducts(product, allProducts, 3),
    [allProducts, product]
  );

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevBusy(true);
    setRevMsg(null);
    try {
      const res = await api.submitReview({
        productId: product.id,
        customerName: revName,
        rating: revRating,
        comment: revComment,
      });
      onReviewAdded(res.review);
      setRevName('');
      setRevComment('');
      setRevMsg('Thank you — your genuine review has been published.');
    } catch (err) {
      setRevMsg(err instanceof Error ? err.message : 'Unable to submit review.');
    } finally {
      setRevBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
    >
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E5E5E5]">
        <div className="sticky top-0 z-10 bg-white border-b border-[#E5E5E5] px-6 py-4 flex items-center justify-between gap-4">
          <div className="text-xs text-[#525252] font-mono-num truncate">
            {product.categoryLabel} · {product.brand} · {product.sku}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="p-2 rounded-md hover:bg-[#F4F4F4] text-[#111111]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Sticky Media & Specs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-lg overflow-hidden border border-[#E5E5E5]">
              <ProductImage src={product.images[0]} alt={displayName} aspectClass="aspect-[4/3]" priority />
            </div>

            <div>
              <h3 className="font-display text-sm font-bold text-[#111111] mb-3">
                Technical Specifications
              </h3>
              <dl className="divide-y divide-[#E5E5E5] border border-[#E5E5E5] rounded-lg text-sm">
                <div className="px-4 py-2.5 flex justify-between gap-4">
                  <dt className="text-[#525252]">Model</dt>
                  <dd className="font-medium text-[#111111] text-right">{product.model}</dd>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4">
                  <dt className="text-[#525252]">Weight &amp; Dimensions</dt>
                  <dd className="font-medium text-[#111111] text-right">{product.weightDimensions}</dd>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4">
                  <dt className="text-[#525252]">Country of Origin</dt>
                  <dd className="font-medium text-[#111111] text-right">{product.countryOfOrigin}</dd>
                </div>
                {product.specifications.map((spec) => (
                  <div key={spec.label} className="px-4 py-2.5 flex justify-between gap-4">
                    <dt className="text-[#525252]">{spec.label}</dt>
                    <dd className="font-medium text-[#111111] text-right">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Right: Contiguous Purchase Module */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold mb-2">
                <span className="text-[#292929]">{product.brand}</span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    product.availabilityStatus === 'In Stock'
                      ? 'text-[#166534]'
                      : product.availabilityStatus === 'Pre-order'
                      ? 'text-[#92400E]'
                      : 'text-[#525252]'
                  }
                >
                  {product.availabilityStatus}
                  {product.availabilityStatus === 'In Stock' ? ` (${product.stockQuantity} units available)` : ''}
                </span>
              </div>

              <h2 id="pdp-title" className="font-display text-2xl sm:text-3xl font-extrabold text-[#111111]">
                {displayName}
              </h2>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-mono-num text-2xl font-bold text-[#111111]">
                  {formatBDT(activePrice)}
                </span>
                {discountPct > 0 && (
                  <>
                    <span className="font-mono-num text-base text-[#737373] line-through">
                      {formatBDT(product.sellingPrice)}
                    </span>
                    <span className="font-mono-num text-xs font-bold text-[#166534]">
                      Save {discountPct}%
                    </span>
                  </>
                )}
              </div>

              <p className="mt-4 text-sm text-[#292929] leading-relaxed">{displayDesc}</p>
            </div>

            {product.availabilityStatus === 'Pre-order' && (
              <div className="p-4 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] leading-relaxed">
                <strong>Pre-order Notice:</strong> This item is sourced from our supplier network after order confirmation. Delivery dates ({product.deliveryEstimate}) are supplier-dependent estimates, not guaranteed dates until dispatched.
              </div>
            )}

            {/* Variations */}
            <div className="space-y-4 pt-2 border-t border-[#E5E5E5]">
              <div>
                <span className="block text-xs font-semibold text-[#111111] mb-2">
                  Size / Specification
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${
                        selectedSize === size
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white text-[#111111] border-[#D4D4D4] hover:border-[#111111]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#111111] mb-2">Colourway</span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${
                        selectedColor === color
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white text-[#111111] border-[#D4D4D4] hover:border-[#111111]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center border border-[#D4D4D4] rounded-md">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2.5 text-sm font-bold text-[#111111] hover:bg-[#F4F4F4]"
                  >
                    −
                  </button>
                  <span className="px-3 py-2.5 text-sm font-mono-num font-semibold text-[#111111]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() =>
                      setQuantity((q) =>
                        product.availabilityStatus === 'In Stock'
                          ? Math.min(product.stockQuantity, q + 1)
                          : q + 1
                      )
                    }
                    className="px-3 py-2.5 text-sm font-bold text-[#111111] hover:bg-[#F4F4F4]"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!canOrder}
                  onClick={() => {
                    onAddToCart(product, selectedSize, selectedColor, quantity);
                    onClose();
                  }}
                  className={`flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-md font-display font-bold text-sm transition-colors ${
                    canOrder
                      ? product.availabilityStatus === 'Pre-order'
                        ? 'bg-[#111111] text-white hover:bg-[#292929]'
                        : 'bg-[#B7F500] text-[#111111] hover:bg-[#a6df00]'
                      : 'bg-[#E5E5E5] text-[#737373] cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {product.availabilityStatus === 'Pre-order'
                      ? 'Add Pre-order to Bag'
                      : canOrder
                      ? 'Add to Bag'
                      : product.availabilityStatus}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleWishlist(product.id)}
                  aria-label="Toggle wishlist"
                  className="p-3 rounded-md border border-[#D4D4D4] text-[#111111] hover:bg-[#F4F4F4]"
                >
                  <Heart className="w-5 h-5" fill={wishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Delivery, Shipping Estimator, Warranty & Return Transparency */}
            <div className="space-y-3 pt-4 border-t border-[#E5E5E5] text-xs text-[#292929]">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#111111]">Estimated Delivery:</strong> {product.deliveryEstimate}
                </div>
              </div>

              <div className="p-3 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#111111] shrink-0" />
                  <label htmlFor="pdp-delivery-zone" className="font-semibold text-[#111111]">
                    Shipping Estimator:
                  </label>
                  <select
                    id="pdp-delivery-zone"
                    value={deliveryZone}
                    onChange={(e) =>
                      setDeliveryZone(e.target.value as 'dhakaMetro' | 'dhakaSuburb' | 'nationwide')
                    }
                    className="border border-[#D4D4D4] bg-white rounded px-2 py-1 text-xs font-medium"
                  >
                    <option value="dhakaMetro">Dhaka Metro</option>
                    <option value="dhakaSuburb">Dhaka Suburbs</option>
                    <option value="nationwide">Outside Dhaka (64 Districts)</option>
                  </select>
                </div>
                <span className="font-mono-num font-bold text-[#111111]">
                  {estimatedDeliveryFee === 0
                    ? 'Free Shipping Unlocked (৳0)'
                    : `${formatBDT(estimatedDeliveryFee)} delivery`}
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#111111]">Warranty &amp; QC:</strong> {product.warrantyInfo} ·{' '}
                  <strong>Returns:</strong> {product.returnEligibility}
                </div>
              </div>
            </div>

            {/* Genuine Reviews Section */}
            <div className="pt-6 border-t border-[#E5E5E5] space-y-4">
              <h3 className="font-display text-sm font-bold text-[#111111]">
                Customer Reviews ({productReviews.length})
              </h3>
              {productReviews.length === 0 ? (
                <p className="text-xs text-[#525252]">
                  No genuine customer reviews recorded yet for this sample listing. Submit verified feedback below after trying the gear.
                </p>
              ) : (
                <div className="space-y-3">
                  {productReviews.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-md bg-[#F4F4F4] text-xs">
                      <div className="flex items-center justify-between font-semibold text-[#111111]">
                        <span>{rev.customerName}</span>
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-[#111111]" /> {rev.rating}/5
                        </span>
                      </div>
                      <p className="mt-1 text-[#292929]">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-2.5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={revName}
                    onChange={(e) => setRevName(e.target.value)}
                    placeholder="Your name"
                    className="sm:col-span-2 border border-[#D4D4D4] rounded-md px-3 py-1.5 text-xs"
                  />
                  <select
                    aria-label="Rating"
                    value={revRating}
                    onChange={(e) => setRevRating(Number(e.target.value))}
                    className="border border-[#D4D4D4] rounded-md px-2 py-1.5 text-xs"
                  >
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>
                <textarea
                  required
                  rows={2}
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  placeholder="Share honest feedback on build, sizing, or match performance..."
                  className="w-full border border-[#D4D4D4] rounded-md px-3 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  disabled={revBusy}
                  className="px-4 py-2 rounded-md bg-[#111111] text-white text-xs font-semibold hover:bg-[#292929]"
                >
                  {revBusy ? 'Posting...' : 'Post Review'}
                </button>
                {revMsg && <p className="text-xs text-[#166534]">{revMsg}</p>}
              </form>
            </div>
          </div>
        </div>

        {complementary.length > 0 && onSelectProduct && (
          <div className="px-6 sm:px-8 pb-8 pt-6 border-t border-[#E5E5E5] bg-[#FAFAFA]">
            <h3 className="font-display text-sm font-bold text-[#111111] mb-3">
              Complete Your Kit
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {complementary.map((item) => {
                const itemName = lang === 'bn' && item.nameBn ? item.nameBn : item.name;
                const itemPrice = item.discountPrice ?? item.sellingPrice;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectProduct(item)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E5E5] bg-white text-left hover:border-[#111111] transition-colors"
                  >
                    <div className="w-16 h-12 rounded overflow-hidden shrink-0 bg-[#F4F4F4]">
                      <ProductImage src={item.images[0]} alt={itemName} aspectClass="aspect-[4/3]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#111111] truncate">{itemName}</p>
                      <p className="font-mono-num text-xs font-bold text-[#292929] mt-0.5">
                        {formatBDT(itemPrice)} · {item.availabilityStatus}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
