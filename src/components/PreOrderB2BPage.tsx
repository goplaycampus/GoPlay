import { useState } from 'react';
import { Building2, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import type { B2BEnquiry, Language, Product } from '../types';
import { validateBangladeshPhone } from '../utils/commerce';
import { ProductCard } from './ProductCard';

interface PreOrderB2BPageProps {
  mode: 'preorder' | 'b2b';
  products: Product[];
  lang: Language;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onSelectProduct: (p: Product) => void;
  onQuickAdd: (p: Product) => void;
}

export function PreOrderB2BPage({
  mode,
  products,
  lang,
  wishlistIds,
  onToggleWishlist,
  onSelectProduct,
  onQuickAdd,
}: PreOrderB2BPageProps) {
  const preOrderProducts = products.filter((p) => p.availabilityStatus === 'Pre-order');

  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('Cricket / Football Club');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [requiredProducts, setRequiredProducts] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('25');
  const [budgetBdt, setBudgetBdt] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEnquiry, setCreatedEnquiry] = useState<B2BEnquiry | null>(null);

  const handleB2BSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateBangladeshPhone(phone)) {
      setError('Enter a valid 11-digit Bangladesh contact phone number.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.createB2BEnquiry({
        organizationName,
        organizationType,
        contactPerson,
        phone,
        email,
        requiredProducts,
        estimatedQuantity: Number(estimatedQuantity || 1),
        budgetBdt: Number(budgetBdt || 0),
        deliveryLocation,
        additionalRequirements,
      });
      setCreatedEnquiry(res.enquiry);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit B2B enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'preorder') {
    return (
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 space-y-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold text-[#525252] mb-2">
            GoPlay Pre-Order Policy &amp; Transparency
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight">
            How GoPlay Pre-Orders Work
          </h1>
          <p className="mt-3 text-base text-[#525252] leading-relaxed">
            To keep prices fair and avoid inflated dead stock, GoPlay holds core compact equipment in ready stock while offering high-value or size-sensitive gear on transparent pre-order.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-[#E5E5E5] rounded-lg bg-white space-y-2">
            <Clock className="w-5 h-5 text-[#111111]" />
            <h2 className="font-display text-base font-bold text-[#111111]">
              Supplier-Dependent Timelines
            </h2>
            <p className="text-sm text-[#525252] leading-relaxed">
              Every pre-order states an estimated delivery period (typically 10–16 business days). Dates are transparent estimates—never false guarantees—and delays are communicated promptly.
            </p>
          </div>
          <div className="p-6 border border-[#E5E5E5] rounded-lg bg-white space-y-2">
            <ShieldCheck className="w-5 h-5 text-[#111111]" />
            <h2 className="font-display text-base font-bold text-[#111111]">
              Order-Wise Fund Protection
            </h2>
            <p className="text-sm text-[#525252] leading-relaxed">
              Every pre-order maintains an isolated order-wise ledger. Customer advances are never treated as unrestricted funds or used to fulfill unrelated orders.
            </p>
          </div>
          <div className="p-6 border border-[#E5E5E5] rounded-lg bg-white space-y-2">
            <CheckCircle2 className="w-5 h-5 text-[#111111]" />
            <h2 className="font-display text-base font-bold text-[#111111]">
              Clear Cancellation &amp; Refunds
            </h2>
            <p className="text-sm text-[#525252] leading-relaxed">
              If a supplier fails to source the exact confirmed item or exceeds the agreed window, you may opt for an alternative resolution or full refund under Bangladesh digital commerce guidelines.
            </p>
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-[#111111] mb-6">
            Available Pre-Order Catalogue ({preOrderProducts.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {preOrderProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                lang={lang}
                wishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onSelectProduct={onSelectProduct}
                onQuickAdd={onQuickAdd}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-semibold text-[#525252] mb-2">
              Institutional &amp; Club Supply
            </p>
            <h1 className="font-display text-3xl font-extrabold text-[#111111] tracking-tight">
              B2B &amp; Academy Supply Enquiries
            </h1>
            <p className="mt-3 text-sm text-[#525252] leading-relaxed">
              Equipping a cricket academy, football club, school, college, university sports board, or corporate tournament? Request a structured bulk quotation in BDT.
            </p>
          </div>

          <div className="border border-[#E5E5E5] rounded-lg p-6 bg-[#FAFAFA] space-y-3 text-sm text-[#292929]">
            <div className="flex items-center gap-2 font-display font-bold text-[#111111]">
              <Building2 className="w-5 h-5" />
              <span>Who We Supply</span>
            </div>
            <ul className="space-y-1.5 text-xs text-[#525252]">
              <li>· Cricket &amp; Football Clubs and Academies</li>
              <li>· Schools, Colleges &amp; University Sports Teams</li>
              <li>· Coaching Camps &amp; Fitness Studios</li>
              <li>· Inter-Department &amp; Corporate Tournaments</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-7">
          {createdEnquiry ? (
            <div className="border border-[#E5E5E5] rounded-xl p-8 bg-white space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#B7F500] flex items-center justify-center text-[#111111]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="font-display text-2xl font-bold text-[#111111]">
                Institutional Enquiry Logged
              </h2>
              <p className="text-sm text-[#525252]">
                Reference: <strong className="font-mono-num text-[#111111]">{createdEnquiry.enquiryNumber}</strong> for{' '}
                <strong>{createdEnquiry.organizationName}</strong>. Our team will review supplier bulk pricing and prepare a written quotation.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCreatedEnquiry(null);
                  setOrganizationName('');
                  setRequiredProducts('');
                }}
                className="px-5 py-2.5 rounded-md bg-[#111111] text-white text-sm font-semibold"
              >
                Submit Another Enquiry
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleB2BSubmit}
              className="border border-[#E5E5E5] rounded-xl p-6 sm:p-8 bg-white space-y-5"
            >
              <h2 className="font-display text-xl font-bold text-[#111111]">
                Request Institutional Quotation
              </h2>

              {error && (
                <div role="alert" className="p-3 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="b2b-org" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Organization / Club Name *
                  </label>
                  <input
                    id="b2b-org"
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Sylhet Youth Cricket Academy"
                    className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="b2b-type" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Organization Type
                  </label>
                  <select
                    id="b2b-type"
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value)}
                    className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm bg-white"
                  >
                    <option>Cricket / Football Club</option>
                    <option>Sports Academy</option>
                    <option>School / College</option>
                    <option>University Sports Body</option>
                    <option>Corporate / Event Organizer</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="b2b-contact" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Contact Person *
                  </label>
                  <input
                    id="b2b-contact"
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="b2b-phone" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Bangladesh Phone *
                  </label>
                  <input
                    id="b2b-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm font-mono-num"
                  />
                </div>

                <div>
                  <label htmlFor="b2b-email" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Email
                  </label>
                  <input
                    id="b2b-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="b2b-location" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Delivery City / District *
                  </label>
                  <input
                    id="b2b-location"
                    type="text"
                    required
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="e.g. Dhaka, Sylhet, Chattogram"
                    className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="b2b-qty" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Estimated Total Quantity *
                  </label>
                  <input
                    id="b2b-qty"
                    type="number"
                    min={1}
                    required
                    value={estimatedQuantity}
                    onChange={(e) => setEstimatedQuantity(e.target.value)}
                    className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm font-mono-num"
                  />
                </div>

                <div>
                  <label htmlFor="b2b-budget" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Approximate Budget (BDT)
                  </label>
                  <input
                    id="b2b-budget"
                    type="number"
                    min={0}
                    value={budgetBdt}
                    onChange={(e) => setBudgetBdt(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm font-mono-num"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="b2b-items" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Required Products &amp; Sizing Breakdown *
                  </label>
                  <textarea
                    id="b2b-items"
                    rows={3}
                    required
                    value={requiredProducts}
                    onChange={(e) => setRequiredProducts(e.target.value)}
                    placeholder="List items, sizes, and quantities (e.g. 20 team jerseys M/L/XL, 12 leather balls, 2 agility cone kits)"
                    className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="b2b-notes" className="block text-xs font-semibold text-[#111111] mb-1.5">
                    Additional Requirements
                  </label>
                  <input
                    id="b2b-notes"
                    type="text"
                    value={additionalRequirements}
                    onChange={(e) => setAdditionalRequirements(e.target.value)}
                    placeholder="Required invoice format, event deadline, etc."
                    className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-md bg-[#B7F500] text-[#111111] font-display font-bold text-sm hover:bg-[#a6df00]"
              >
                {submitting ? 'Submitting Enquiry...' : 'Submit Institutional Enquiry'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
