import { useMemo, useState } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { BANGLADESH_DIVISIONS } from '../data/bangladesh';
import { api } from '../services/api';
import type { CartItem, Coupon, Order, PaymentMethod, StoreSettings, UserAccount } from '../types';
import { calculateCartTotals, formatBDT, validateBangladeshPhone } from '../utils/commerce';
import type { AppPage } from './Header';

interface CheckoutPageProps {
  items: CartItem[];
  settings: StoreSettings;
  user: UserAccount | null;
  onOrderComplete: (order: Order) => void;
  onNavigate: (page: AppPage) => void;
  onTrackOrder: (orderNumber: string) => void;
}

export function CheckoutPage({
  items,
  settings,
  user,
  onOrderComplete,
  onNavigate,
  onTrackOrder,
}: CheckoutPageProps) {
  const defaultAddr = user?.savedAddresses[0];
  const [fullName, setFullName] = useState(defaultAddr?.fullName || user?.name || '');
  const [phone, setPhone] = useState(defaultAddr?.phone || user?.phone || '');
  const [email, setEmail] = useState(defaultAddr?.email || user?.email || '');
  const [division, setDivision] = useState(defaultAddr?.division || 'Dhaka');
  const [district, setDistrict] = useState(defaultAddr?.district || 'Dhaka Metro');
  const [upazila, setUpazila] = useState(defaultAddr?.upazila || 'Dhanmondi');
  const [fullAddress, setFullAddress] = useState(defaultAddr?.fullAddress || '');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash on Delivery');
  const [paymentReference, setPaymentReference] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const currentDivisionObj = useMemo(
    () => BANGLADESH_DIVISIONS.find((d) => d.name === division) || BANGLADESH_DIVISIONS[0],
    [division]
  );

  const currentDistrictObj = useMemo(
    () =>
      currentDivisionObj.districts.find((dist) => dist.name === district) ||
      currentDivisionObj.districts[0],
    [currentDivisionObj, district]
  );

  const totals = useMemo(
    () =>
      calculateCartTotals(items, division, district, appliedCoupon, {
        dhakaMetro: settings.dhakaMetroShipping,
        dhakaSuburb: settings.dhakaSuburbShipping,
        nationwide: settings.nationwideShipping,
        freeThreshold: settings.freeShippingThreshold,
      }),
    [items, division, district, appliedCoupon, settings]
  );

  const handleDivisionChange = (newDiv: string) => {
    setDivision(newDiv);
    const divObj = BANGLADESH_DIVISIONS.find((d) => d.name === newDiv);
    if (divObj) {
      const firstDist = divObj.districts[0];
      setDistrict(firstDist.name);
      setUpazila(firstDist.upazilas[0] || '');
    }
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const distObj = currentDivisionObj.districts.find((d) => d.name === newDist);
    if (distObj) {
      setUpazila(distObj.upazilas[0] || '');
    }
  };

  const handleApplyCoupon = async () => {
    setCouponMsg(null);
    if (!couponInput.trim()) return;
    try {
      const res = await api.validateCoupon(couponInput, totals.subtotal);
      setAppliedCoupon(res.coupon);
      setCouponMsg(`Applied ${res.coupon.code}: ${res.coupon.description}`);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMsg(err instanceof Error ? err.message : 'Invalid coupon');
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateBangladeshPhone(phone)) {
      setError('Enter a valid 11-digit Bangladesh mobile number (e.g. 01711223344).');
      return;
    }
    if (paymentMethod === 'Manual Payment Verification' && !paymentReference.trim()) {
      setError('Enter your transaction reference ID for manual payment verification.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createOrder({
        shippingAddress: {
          fullName,
          phone,
          email,
          division,
          district,
          upazila,
          fullAddress,
          deliveryInstructions,
        },
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          selectedSize: i.selectedSize,
          selectedColor: i.selectedColor,
        })),
        paymentMethod,
        paymentReference: paymentMethod === 'Manual Payment Verification' ? paymentReference : undefined,
        couponCode: appliedCoupon?.code,
      });
      setConfirmedOrder(res.order);
      onOrderComplete(res.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
        <div className="border border-[#E5E5E5] rounded-xl p-8 bg-white space-y-5">
          <div className="w-12 h-12 rounded-full bg-[#B7F500] flex items-center justify-center text-[#111111]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-[#111111]">
            Order #{confirmedOrder.orderNumber} Confirmed
          </h1>
          <p className="text-sm text-[#525252]">
            {confirmedOrder.orderType === 'Ready Stock'
              ? 'Preparing shipment for courier handover.'
              : 'Logged in our order-wise ledger for supplier confirmation & verification.'}
          </p>

          <div className="p-4 rounded-lg bg-[#F4F4F4] border border-[#E5E5E5] space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#525252]">Order ID</span>
              <span className="font-mono-num font-bold">{confirmedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Order Type</span>
              <span className="font-semibold">{confirmedOrder.orderType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Payment Method</span>
              <span className="font-semibold">
                {confirmedOrder.paymentMethod} ({confirmedOrder.paymentStatus})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Estimated Delivery</span>
              <span>{confirmedOrder.estimatedDeliveryPeriod}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#D4D4D4] font-bold">
              <span>Total Payable / Recorded</span>
              <span className="font-mono-num">{formatBDT(confirmedOrder.totalAmount)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onTrackOrder(confirmedOrder.orderNumber)}
              className="px-5 py-2.5 rounded-md bg-[#B7F500] text-[#111111] font-bold text-sm hover:bg-[#a6df00]"
            >
              Track Order Status
            </button>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="px-5 py-2.5 rounded-md border border-[#D4D4D4] text-sm font-semibold text-[#111111]"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#111111]">Your Bag Is Empty</h1>
        <p className="text-sm text-[#525252]">Add equipment from the GoPlay catalogue before checking out.</p>
        <button
          type="button"
          onClick={() => onNavigate('shop')}
          className="px-6 py-3 rounded-md bg-[#111111] text-white text-sm font-semibold"
        >
          Browse Equipment
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-extrabold text-[#111111] mb-8">
        Bangladesh Checkout
      </h1>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Delivery & Payment */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div role="alert" className="p-4 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]">
              {error}
            </div>
          )}

          <div className="border border-[#E5E5E5] rounded-xl p-6 bg-white space-y-4">
            <h2 className="font-display text-lg font-bold text-[#111111]">
              1. Delivery Details (Bangladesh)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-name" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Full Name *
                </label>
                <input
                  id="chk-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="chk-phone" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Bangladesh Mobile Number *
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm font-mono-num"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="chk-email" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Email (Optional, for order tracking receipts)
                </label>
                <input
                  id="chk-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label htmlFor="chk-division" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Division *
                </label>
                <select
                  id="chk-division"
                  value={division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm bg-white"
                >
                  {BANGLADESH_DIVISIONS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="chk-district" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  District *
                </label>
                <select
                  id="chk-district"
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm bg-white"
                >
                  {currentDivisionObj.districts.map((dist) => (
                    <option key={dist.name} value={dist.name}>
                      {dist.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="chk-upazila" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Upazila / Thana *
                </label>
                <select
                  id="chk-upazila"
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm bg-white"
                >
                  {currentDistrictObj.upazilas.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="chk-instructions" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Delivery Instructions
                </label>
                <input
                  id="chk-instructions"
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Preferred call time, gate info"
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="chk-address" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Full Street Address *
                </label>
                <textarea
                  id="chk-address"
                  rows={2}
                  required
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="House, Road, Block/Sector, Landmark"
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border border-[#E5E5E5] rounded-xl p-6 bg-white space-y-4">
            <h2 className="font-display text-lg font-bold text-[#111111]">
              2. Payment Verification Mode
            </h2>
            <div className="p-3.5 rounded-md bg-[#F4F4F4] border border-[#E5E5E5] text-xs text-[#292929] flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#111111] shrink-0 mt-0.5" />
              <span>{settings.manualPaymentInstructions}</span>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 rounded-lg border border-[#D4D4D4] cursor-pointer hover:border-[#111111]">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'Cash on Delivery'}
                  onChange={() => setPaymentMethod('Cash on Delivery')}
                  className="mt-1 accent-[#111111]"
                />
                <div>
                  <span className="block text-sm font-bold text-[#111111]">
                    Cash on Delivery (COD)
                  </span>
                  <span className="block text-xs text-[#525252] mt-0.5">
                    Pay cash to the courier upon physical parcel delivery across Bangladesh.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-lg border border-[#D4D4D4] cursor-pointer hover:border-[#111111]">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'Manual Payment Verification'}
                  onChange={() => setPaymentMethod('Manual Payment Verification')}
                  className="mt-1 accent-[#111111]"
                />
                <div className="flex-1">
                  <span className="block text-sm font-bold text-[#111111]">
                    Manual Payment Verification (Test / Merchant Pending)
                  </span>
                  <span className="block text-xs text-[#525252] mt-0.5">
                    Submit a manual transfer or test verification reference for admin confirmation. Automated bKash / Nagad / SSLCommerz gateway checkout is architected for Phase 4 merchant activation.
                  </span>
                </div>
              </label>

              {paymentMethod === 'Manual Payment Verification' && (
                <div>
                  <label htmlFor="chk-payref" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Transaction Reference / Test Note *
                  </label>
                  <input
                    id="chk-payref"
                    type="text"
                    required
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. Manual-Ref-12345"
                    className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm font-mono-num"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 border border-[#E5E5E5] rounded-xl p-6 bg-[#FAFAFA] space-y-5 sticky top-24">
          <h2 className="font-display text-lg font-bold text-[#111111]">
            Order Summary ({totals.orderType})
          </h2>

          <div className="divide-y divide-[#E5E5E5]">
            {items.map((item) => (
              <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`} className="py-3 flex justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold text-[#111111]">{item.name}</p>
                  <p className="text-xs text-[#525252]">
                    {item.selectedSize} · {item.selectedColor} · Qty {item.quantity} · {item.availabilityStatus}
                  </p>
                </div>
                <span className="font-mono-num font-semibold text-[#111111]">
                  {formatBDT(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="pt-2 border-t border-[#E5E5E5]">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Promo code (e.g. GOPLAY100)"
                aria-label="Coupon code"
                className="flex-1 bg-white border border-[#D4D4D4] rounded-md px-3 py-2 text-xs uppercase"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-4 py-2 rounded-md bg-[#111111] text-white text-xs font-semibold"
              >
                Apply
              </button>
            </div>
            {couponMsg && <p className="text-xs text-[#292929] mt-1.5">{couponMsg}</p>}
          </div>

          <div className="pt-3 border-t border-[#E5E5E5] space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#525252]">Subtotal</span>
              <span className="font-mono-num">{formatBDT(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-[#166534]">
                <span>Coupon Discount</span>
                <span className="font-mono-num">−{formatBDT(totals.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#525252]">
                Delivery ({district === 'Dhaka Metro' ? 'Dhaka Metro' : division})
              </span>
              <span className="font-mono-num">
                {totals.deliveryCharge === 0 ? 'Free' : formatBDT(totals.deliveryCharge)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-[#D4D4D4] text-base font-bold text-[#111111]">
              <span>Total</span>
              <span className="font-mono-num">{formatBDT(totals.totalAmount)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-md bg-[#B7F500] text-[#111111] font-display font-bold text-sm hover:bg-[#a6df00] transition-colors disabled:opacity-60"
          >
            {submitting ? 'Confirming Order...' : `Confirm Order · ${formatBDT(totals.totalAmount)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
