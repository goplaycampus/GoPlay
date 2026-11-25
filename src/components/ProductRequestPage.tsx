import { useState } from 'react';
import { CheckCircle2, ImagePlus, Upload } from 'lucide-react';
import { api } from '../services/api';
import type { ProductRequest, UserAccount } from '../types';
import { formatBDT, validateBangladeshPhone } from '../utils/commerce';
import type { AppPage } from './Header';

interface ProductRequestPageProps {
  user: UserAccount | null;
  onNavigate: (page: AppPage) => void;
  onTrackCreatedRequest: (requestNumber: string) => void;
}

export function ProductRequestPage({
  user,
  onNavigate,
  onTrackCreatedRequest,
}: ProductRequestPageProps) {
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [desiredSpecifications, setDesiredSpecifications] = useState('');
  const [preferredSizeColor, setPreferredSizeColor] = useState('');
  const [budgetBdt, setBudgetBdt] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [uploadedImageDataUrl, setUploadedImageDataUrl] = useState<string | undefined>(undefined);
  const [imageError, setImageError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<ProductRequest | null>(null);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setImageError('Only PNG, JPG, or WebP images are supported.');
      return;
    }
    if (file.size > 1_800_000) {
      setImageError('Image file must be under 1.8 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateBangladeshPhone(phone)) {
      setError('Please enter a valid 11-digit Bangladesh mobile number (e.g. 01711223344).');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.createProductRequest({
        productName,
        brand,
        model,
        referenceUrl,
        uploadedImageDataUrl,
        desiredSpecifications,
        preferredSizeColor,
        budgetBdt: Number(budgetBdt || 0),
        customerName,
        phone,
        email,
        additionalNotes,
      });
      setSubmittedRequest(res.request);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedRequest) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="border border-[#E5E5E5] rounded-xl p-8 bg-white space-y-5">
          <div className="w-12 h-12 rounded-full bg-[#B7F500] flex items-center justify-center text-[#111111]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-[#111111]">
            Product Sourcing Request Received
          </h1>
          <p className="text-sm text-[#525252] leading-relaxed">
            Your request has been logged privately. Save your Request ID below to track supplier research and review your written BDT quotation.
          </p>
          <div className="p-4 rounded-lg bg-[#F4F4F4] border border-[#E5E5E5] space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[#525252]">Request ID</span>
              <span className="font-mono-num font-bold text-[#111111]">{submittedRequest.requestNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Product</span>
              <span className="font-semibold text-[#111111]">{submittedRequest.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Current Status</span>
              <span className="font-semibold text-[#111111]">{submittedRequest.status}</span>
            </div>
            {submittedRequest.budgetBdt > 0 && (
              <div className="flex justify-between">
                <span className="text-[#525252]">Target Budget</span>
                <span className="font-mono-num text-[#111111]">{formatBDT(submittedRequest.budgetBdt)}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => onTrackCreatedRequest(submittedRequest.requestNumber)}
              className="px-5 py-2.5 rounded-md bg-[#B7F500] text-[#111111] font-bold text-sm hover:bg-[#a6df00]"
            >
              Track Request Status
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmittedRequest(null);
                setProductName('');
                setBrand('');
                setModel('');
                setReferenceUrl('');
                setDesiredSpecifications('');
                setUploadedImageDataUrl(undefined);
              }}
              className="px-5 py-2.5 rounded-md border border-[#D4D4D4] text-sm font-semibold text-[#111111]"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Process Overview */}
        <div className="lg:col-span-4 space-y-6">
          <div>
            <p className="text-xs font-semibold text-[#525252] mb-2">
              GoPlay Special Product Sourcing
            </p>
            <h1 className="font-display text-3xl font-extrabold text-[#111111] tracking-tight [text-wrap:balance]">
              Can&apos;t Find Your Gear Locally?
            </h1>
            <p className="mt-3 text-sm text-[#525252] leading-relaxed">
              Submit the exact sports equipment, sizing, or model you need. We verify supplier authenticity and send a transparent written BDT quotation before any order is confirmed.
            </p>
          </div>

          <div className="border border-[#E5E5E5] rounded-lg p-5 bg-[#FAFAFA] space-y-4">
            <h2 className="font-display text-sm font-bold text-[#111111]">
              6-Step Sourcing Workflow
            </h2>
            <ol className="space-y-3 text-xs text-[#292929]">
              <li><strong>01. Submit Details:</strong> Share brand, model, image or URL, and target BDT budget.</li>
              <li><strong>02. Authenticity Check:</strong> GoPlay verifies supplier documentation, availability, and delivery window.</li>
              <li><strong>03. Written Quotation:</strong> Item cost, shipping, taxes/duties, and service fee shown separately.</li>
              <li><strong>04. Customer Approval:</strong> Order confirms only after you review and approve the quotation.</li>
              <li><strong>05. Procurement Updates:</strong> Track supplier processing and transit milestones privately.</li>
              <li><strong>06. Quality Inspection:</strong> Visual/spec verification upon arrival before local courier handover.</li>
            </ol>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('track')}
            className="text-xs font-semibold text-[#111111] underline underline-offset-4 hover:text-[#525252]"
          >
            Already have a Request ID (REQ-GPL-...)? Track it here →
          </button>
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-8">
          <form
            onSubmit={handleSubmit}
            className="border border-[#E5E5E5] rounded-xl p-6 sm:p-8 bg-white space-y-6"
          >
            <h2 className="font-display text-xl font-bold text-[#111111]">
              Product Sourcing Request Form
            </h2>

            {error && (
              <div role="alert" className="p-3.5 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="req-product-name" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Product Name *
                </label>
                <input
                  id="req-product-name"
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Yonex Astrox 88D Pro Badminton Racket or Nike Mercurial Vapor 16"
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label htmlFor="req-brand" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Brand
                </label>
                <input
                  id="req-brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Yonex, SG, Kookaburra, Nike"
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label htmlFor="req-model" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Model / Variant
                </label>
                <input
                  id="req-model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. 2026 Pro Edition"
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label htmlFor="req-size-color" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Preferred Size / Colour
                </label>
                <input
                  id="req-size-color"
                  type="text"
                  value={preferredSizeColor}
                  onChange={(e) => setPreferredSizeColor(e.target.value)}
                  placeholder="e.g. EU 42 / Black & Lime, or 4U G5"
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label htmlFor="req-budget" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Estimated Budget (BDT ৳)
                </label>
                <input
                  id="req-budget"
                  type="number"
                  min={0}
                  value={budgetBdt}
                  onChange={(e) => setBudgetBdt(e.target.value)}
                  placeholder="e.g. 12500"
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm font-mono-num focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="req-url" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Reference Product URL (Optional)
                </label>
                <input
                  id="req-url"
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="req-specs" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Desired Specifications
                </label>
                <textarea
                  id="req-specs"
                  rows={3}
                  value={desiredSpecifications}
                  onChange={(e) => setDesiredSpecifications(e.target.value)}
                  placeholder="Specify willow grade, weight range, string tension, soleplate type (FG/AG/TF), etc."
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="req-image" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Product Reference Image (Optional · PNG/JPG/WebP under 1.8MB)
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-[#D4D4D4] bg-[#FAFAFA] hover:bg-[#F4F4F4] text-xs font-semibold text-[#111111] cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Upload Reference Photo</span>
                    <input
                      id="req-image"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageFile}
                      className="sr-only"
                    />
                  </label>
                  {uploadedImageDataUrl ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={uploadedImageDataUrl}
                        alt="Uploaded product reference"
                        className="w-16 h-16 object-cover rounded border border-[#E5E5E5]"
                      />
                      <button
                        type="button"
                        onClick={() => setUploadedImageDataUrl(undefined)}
                        className="text-xs text-[#991B1B] underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-[#737373] inline-flex items-center gap-1">
                      <ImagePlus className="w-3.5 h-3.5" /> No image selected
                    </span>
                  )}
                </div>
                {imageError && <p className="text-xs text-[#991B1B] mt-1">{imageError}</p>}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E5E5] grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="req-cust-name" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Your Full Name *
                </label>
                <input
                  id="req-cust-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name"
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label htmlFor="req-phone" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Bangladesh Phone *
                </label>
                <input
                  id="req-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm font-mono-num"
                />
              </div>

              <div>
                <label htmlFor="req-email" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Email Address *
                </label>
                <input
                  id="req-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="req-notes" className="block text-xs font-semibold text-[#111111] mb-1.5">
                  Additional Notes
                </label>
                <input
                  id="req-notes"
                  type="text"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Preferred delivery city, deadline, or tournament date (optional)"
                  className="w-full border border-[#D4D4D4] rounded-md px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <p className="text-xs text-[#525252]">
                Requests are private and never shared publicly with other customers.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-md bg-[#B7F500] text-[#111111] font-display font-bold text-sm hover:bg-[#a6df00] disabled:opacity-60"
              >
                {submitting ? 'Submitting Request...' : 'Submit Sourcing Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
