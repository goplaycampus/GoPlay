import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Package, Search, Truck } from 'lucide-react';
import { api } from '../services/api';
import type { Order, ProductRequest } from '../types';
import { formatBDT } from '../utils/commerce';

interface TrackingPageProps {
  initialCode?: string;
}

export function TrackingPage({ initialCode = '' }: TrackingPageProps) {
  const [queryCode, setQueryCode] = useState(initialCode || 'ORD-GPL-1001');
  const [verifyPhone, setVerifyPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<Order | null>(null);
  const [requestResult, setRequestResult] = useState<
    (ProductRequest & { requiresVerification?: boolean }) | null
  >(null);
  const [approveMsg, setApproveMsg] = useState<string | null>(null);

  const runLookup = async (codeToLookup: string, phoneToVerify?: string) => {
    const clean = codeToLookup.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError(null);
    setOrderResult(null);
    setRequestResult(null);
    setApproveMsg(null);
    try {
      if (clean.startsWith('REQ-')) {
        const res = await api.trackProductRequest(clean, phoneToVerify);
        setRequestResult(res.request);
      } else {
        const res = await api.trackOrder(clean);
        setOrderResult(res.order);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to find tracking record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setQueryCode(initialCode);
      runLookup(initialCode);
    }
  }, [initialCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runLookup(queryCode, verifyPhone);
  };

  const handleApproveQuotation = async () => {
    if (!requestResult) return;
    setError(null);
    try {
      const res = await api.approveRequestQuotation(requestResult.requestNumber, verifyPhone);
      setRequestResult(res.request);
      setApproveMsg('Quotation approved. Our sourcing team will follow up to finalize payment & dispatch.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve quotation.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div>
        <p className="text-xs font-semibold text-[#525252] mb-1">GoPlay Order &amp; Sourcing Tracker</p>
        <h1 className="font-display text-3xl font-extrabold text-[#111111]">
          Track Your Order or Product Request
        </h1>
        <p className="mt-2 text-sm text-[#525252]">
          Enter your Order ID (e.g. <span className="font-mono-num">ORD-GPL-1001</span>) or Product Request ID (e.g. <span className="font-mono-num">REQ-GPL-2001</span>).
        </p>
      </div>

      <form onSubmit={handleSearch} className="border border-[#E5E5E5] rounded-xl p-5 bg-[#FAFAFA] space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <label htmlFor="track-code-input" className="sr-only">
              Order or Request ID
            </label>
            <input
              id="track-code-input"
              type="text"
              required
              value={queryCode}
              onChange={(e) => setQueryCode(e.target.value)}
              placeholder="ORD-GPL-1001 or REQ-GPL-2001"
              className="w-full bg-white border border-[#D4D4D4] rounded-md pl-10 pr-3.5 py-2.5 text-sm font-mono-num uppercase"
            />
          </div>
          <input
            type="tel"
            value={verifyPhone}
            onChange={(e) => setVerifyPhone(e.target.value)}
            placeholder="Phone (required for private REQ details)"
            aria-label="Phone number for private request verification"
            className="sm:w-64 bg-white border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm font-mono-num"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-md bg-[#111111] text-white text-sm font-semibold hover:bg-[#292929] whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'Track Status'}
          </button>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-[#525252]">
          <span>Sample records:</span>
          <button
            type="button"
            onClick={() => {
              setQueryCode('ORD-GPL-1001');
              runLookup('ORD-GPL-1001');
            }}
            className="font-mono-num underline text-[#111111]"
          >
            ORD-GPL-1001
          </button>
          <button
            type="button"
            onClick={() => {
              setQueryCode('REQ-GPL-2001');
              setVerifyPhone('01812345678');
              runLookup('REQ-GPL-2001', '01812345678');
            }}
            className="font-mono-num underline text-[#111111]"
          >
            REQ-GPL-2001 (Sample Quote)
          </button>
        </div>
      </form>

      {error && (
        <div role="alert" className="p-4 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]">
          {error}
        </div>
      )}

      {orderResult && (
        <div className="border border-[#E5E5E5] rounded-xl p-6 sm:p-8 bg-white space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#E5E5E5]">
            <div>
              <p className="text-xs font-mono-num text-[#525252]">
                {orderResult.orderNumber} · {orderResult.orderType}
              </p>
              <h2 className="font-display text-2xl font-bold text-[#111111] mt-1">
                Status: {orderResult.status}
              </h2>
              {orderResult.preOrderStatus && (
                <p className="text-xs font-semibold text-[#92400E] mt-1">
                  Pre-order Workflow: {orderResult.preOrderStatus}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-[#525252]">Order Total</p>
              <p className="font-mono-num text-xl font-bold text-[#111111]">
                {formatBDT(orderResult.totalAmount)}
              </p>
              <p className="text-xs text-[#525252]">{orderResult.paymentStatus}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] space-y-1">
              <div className="flex items-center gap-2 font-semibold text-[#111111]">
                <Truck className="w-4 h-4" /> Delivery &amp; Courier
              </div>
              <p className="text-xs text-[#525252]">
                Destination: {orderResult.shippingAddress.upazila}, {orderResult.shippingAddress.district}, {orderResult.shippingAddress.division}
              </p>
              <p className="text-xs text-[#525252]">
                Estimated Window: {orderResult.estimatedDeliveryPeriod}
              </p>
              {orderResult.courierName && (
                <p className="text-xs font-mono-num text-[#111111] pt-1">
                  Courier: {orderResult.courierName} · Tracking: {orderResult.trackingNumber || 'Pending'}
                </p>
              )}
            </div>

            <div className="p-4 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] space-y-1">
              <div className="flex items-center gap-2 font-semibold text-[#111111]">
                <Package className="w-4 h-4" /> Items ({orderResult.items.length})
              </div>
              {orderResult.items.map((item) => (
                <p key={`${item.sku}-${item.selectedSize}`} className="text-xs text-[#292929]">
                  {item.quantity}x {item.name} ({item.selectedSize}) — {formatBDT(item.unitPrice * item.quantity)}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold text-[#111111] mb-3">Status Timeline</h3>
            <ol className="space-y-3 border-l border-[#D4D4D4] ml-2 pl-5">
              {orderResult.statusHistory.map((step, i) => (
                <li key={i} className="relative text-sm">
                  <span className="font-semibold text-[#111111]">{step.status}</span>
                  <span className="block text-xs text-[#525252] font-mono-num">
                    {new Date(step.timestamp).toLocaleString()}
                    {step.note ? ` · ${step.note}` : ''}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {requestResult && (
        <div className="border border-[#E5E5E5] rounded-xl p-6 sm:p-8 bg-white space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#E5E5E5]">
            <div>
              <p className="text-xs font-mono-num text-[#525252]">
                {requestResult.requestNumber} · Special Product Sourcing
              </p>
              <h2 className="font-display text-2xl font-bold text-[#111111] mt-1">
                {requestResult.productName}
              </h2>
              <p className="text-sm text-[#525252]">
                {requestResult.brand} · {requestResult.model} · Status: <strong>{requestResult.status}</strong>
              </p>
            </div>
          </div>

          {requestResult.requiresVerification && (
            <div className="p-4 rounded-md bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E]">
              Enter the phone number used when submitting this request above and click &ldquo;Track Status&rdquo; to view full private quotation details or approve a quote.
            </div>
          )}

          {requestResult.quotation && (
            <div className="p-5 rounded-lg bg-[#F4F4F4] border border-[#E5E5E5] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#111111]">
                  Written BDT Quotation
                </h3>
                <span className="text-xs text-[#525252]">
                  Valid until {requestResult.quotation.validUntil || '7 days'}
                </span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#525252]">Item Cost</span>
                  <span className="font-mono-num">{formatBDT(requestResult.quotation.itemCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#525252]">Shipping &amp; Freight</span>
                  <span className="font-mono-num">{formatBDT(requestResult.quotation.shippingCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#525252]">Taxes &amp; Duties</span>
                  <span className="font-mono-num">{formatBDT(requestResult.quotation.taxesAndDuties)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#525252]">GoPlay Sourcing Service Fee</span>
                  <span className="font-mono-num">{formatBDT(requestResult.quotation.serviceFee)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#D4D4D4] font-bold text-base">
                  <span>Total Quoted Price</span>
                  <span className="font-mono-num">{formatBDT(requestResult.quotation.totalQuotedPrice)}</span>
                </div>
              </div>
              <p className="text-xs text-[#525252]">
                Estimated Delivery: {requestResult.quotation.estimatedDelivery}
              </p>

              {!requestResult.requiresVerification &&
                (requestResult.status === 'Quotation Sent' || requestResult.status === 'Quotation Prepared') && (
                  <button
                    type="button"
                    onClick={handleApproveQuotation}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#B7F500] text-[#111111] font-bold text-sm hover:bg-[#a6df00]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Quotation</span>
                  </button>
                )}
              {approveMsg && <p className="text-xs font-semibold text-[#166534]">{approveMsg}</p>}
            </div>
          )}

          <div>
            <h3 className="font-display text-sm font-bold text-[#111111] mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Sourcing Progress
            </h3>
            <ol className="space-y-3 border-l border-[#D4D4D4] ml-2 pl-5">
              {requestResult.statusHistory.map((step, i) => (
                <li key={i} className="text-sm">
                  <span className="font-semibold text-[#111111]">{step.status}</span>
                  <span className="block text-xs text-[#525252] font-mono-num">
                    {new Date(step.timestamp).toLocaleString()}
                    {step.note ? ` · ${step.note}` : ''}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
